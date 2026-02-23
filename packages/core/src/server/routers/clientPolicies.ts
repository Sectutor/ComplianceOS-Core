import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clientPolicies, clientControls, controls, regulationMappings, notificationLog, users, policyVersions, riskPolicyMappings, riskAssessments, controlPolicyMappings, policyTemplates, employees } from "../../schema";
import { logActivity } from "../../lib/audit";
import * as db from "../../db";
import { getDb } from "../../db";
import { policyGenerator } from "../../lib/policy/policy-generation";
import * as schema from "../../schema";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";
import { notifyUsers } from "../../lib/notificationService";
import { EmailService } from "../../lib/email/service";


export const createClientPoliciesRouter = (t: any, clientProcedure: any, adminProcedure: any, publicProcedure: any, clientEditorProcedure: any) => {
  return t.router({

    list: clientProcedure
      .input(z.object({
        clientId: z.number(),
        module: z.enum(["general", "privacy", "cyber"]).optional()
      }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const conditions = [eq(clientPolicies.clientId, input.clientId)];

        if (input.module) {
          conditions.push(eq(clientPolicies.module, input.module));
        } else {
          // Default to general if not specified, OR return all? 
          // For backward compatibility, existing calls won't have module. 
          // If we want to hide privacy docs from main list, we should maybe filter reasonable defaults or return all.
          // Let's filter by 'general' by default to hide Privacy docs from main view unless requested.
          conditions.push(eq(clientPolicies.module, 'general'));
        }

        const results = await dbConn.select({
          clientPolicy: clientPolicies,
          template: policyTemplates
        })
          .from(clientPolicies)
          .leftJoin(policyTemplates, eq(clientPolicies.templateId, policyTemplates.id))
          .where(and(...conditions))
          .orderBy(desc(clientPolicies.updatedAt));

        return results.map((r: any) => ({
          ...r.clientPolicy,
          clientPolicy: r.clientPolicy,
          template: r.template
        }));
      }),
    get: clientProcedure
      .input(z.object({ id: z.number(), clientId: z.number().optional() }))
      .query(async ({ input }: any) => {
        const result = await db.getClientPolicyById(input.id);
        if (!result) throw new TRPCError({ code: "NOT_FOUND" });
        // Extra check: ensure policy actually belongs to input.clientId
        // Note: getClientPolicyById returns { clientPolicy, template }
        const policy = result.clientPolicy || result;
        if (input.clientId && policy.clientId !== input.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to the specified client context" });
        }
        return result;
      }),
    activity: clientProcedure
      .input(z.object({
        policyId: z.number(),
        clientId: z.number()
      }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();

        return await dbConn.select({
          log: schema.auditLogs,
          user: schema.users
        })
          .from(schema.auditLogs)
          .leftJoin(schema.users, eq(schema.auditLogs.userId, schema.users.id))
          .where(and(
            eq(schema.auditLogs.clientId, input.clientId),
            eq(schema.auditLogs.entityType, 'policy'),
            eq(schema.auditLogs.entityId, input.policyId)
          ))
          .orderBy(desc(schema.auditLogs.createdAt))
          .limit(50);
      }),
    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        templateId: z.number().optional(),
        clientPolicyId: z.string().optional(),
        name: z.string(),
        content: z.string().optional(),
        status: z.enum(["draft", "review", "approved", "archived"]).optional(),
        owner: z.string().optional(),
        version: z.number().optional(),
        tailor: z.boolean().optional(),
        instruction: z.string().optional(),
        sections: z.array(z.string()).optional(),
        module: z.enum(["general", "privacy", "cyber"]).optional().default("general"),
        isAiGenerated: z.boolean().optional(),
        answers: z.record(z.any()).optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const data = { ...input };

        // Check Plan Limits
        const client = await db.getClientById(data.clientId);
        if (!client) {
          console.error(`[PolicyCreate] Client ${data.clientId} not found`);
          throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });
        }

        const { getPlanLimits } = await import("../../lib/limits");
        const limits = getPlanLimits(client.planTier);

        if (limits.maxPolicies !== Infinity) {
          const currentPolicies = await db.getClientPolicies(data.clientId);
          if (currentPolicies.length >= limits.maxPolicies) {
            console.warn(`[PolicyCreate] Plan limit reached for client ${data.clientId}`);
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Plan limit reached. Your ${client.planTier || 'free'} plan allows a maximum of ${limits.maxPolicies} policies. Please upgrade to Pro.`
            });
          }
        }

        // Auto-fill content from template if not provided
        if ((data.templateId || (data.sections && data.sections.length > 0)) && !data.content) {
          try {
            console.log(`[PolicyCreate] Starting generation for Client ${data.clientId}, Template ${data.templateId || 'from sections'}`);
            if (data.templateId) {
              // Generate from Template
              const generatedContent = await policyGenerator.generate(data.clientId, data.templateId, {
                tailorToIndustry: data.tailor,
                customInstruction: data.instruction,
                answers: data.answers
              });
              data.content = generatedContent;
              console.log(`[PolicyCreate] Generation from template complete. Content length: ${generatedContent?.length || 0}`);
            } else if (data.sections && data.sections.length > 0) {
              // Generate from Blank with Sections
              const generatedContent = await policyGenerator.generateFromSections(data.clientId, data.name, data.sections, {
                tailorToIndustry: data.tailor,
                customInstruction: data.instruction,
                answers: data.answers
              });
              data.content = generatedContent;
              console.log(`[PolicyCreate] Generation from sections complete. Content length: ${generatedContent?.length || 0}`);
            }
            // Mark as AI generated
            (data as any).isAiGenerated = true;
            console.log(`[PolicyCreate] Generation complete. Length: ${data.content?.length || 0}`);
          } catch (e) {
            console.error("[PolicyCreate] Policy Generation failed:", e);
            // Throw error instead of silently creating empty policy
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to generate policy content. Please try again or provide content manually."
            });
          }
        } else {
          console.log(`[PolicyCreate] Skipping generation - content provided or no template/sections specified`);
        }

        // Remove extra fields and map answers to tailoringAnswers
        const { tailor, instruction, sections, answers, ...insertData } = data;
        (insertData as any).tailoringAnswers = answers;

        // Ensure status is valid or default
        if (!insertData.status) insertData.status = "draft";

        console.log(`[PolicyCreate] Saving policy to DB for client ${data.clientId}...`);
        const newPolicy = await db.createClientPolicy(insertData as any);
        console.log(`[PolicyCreate] Saved policy with ID: ${newPolicy?.id}`);

        if (newPolicy) {
          await logActivity({
            userId: ctx.user.id,
            clientId: insertData.clientId,
            action: 'create',
            entityType: 'policy',
            entityId: newPolicy.id,
            details: { name: newPolicy.name }
          });
        }

        // Indexing removed for Core split
        // if (newPolicy && newPolicy.content) {
        //   try {
        //     console.log(`[PolicyCreate] Starting indexing for policy ID: ${newPolicy.id}, Client ID: ${newPolicy.clientId}`);
        //     // const { IndexingService } = await import('../../lib/advisor/indexing');
        //     // await IndexingService.indexDocument(...)
        //   } catch (e) { console.error("Failed to index policy:", e); }
        // }

        return newPolicy;
      }),

    suggestSections: clientProcedure
      .input(z.object({
        policyName: z.string(),
        industry: z.string().optional()
      }))
      .query(async ({ input }: any) => {
        return await policyGenerator.suggestSections(input.policyName, input.industry);
      }),
    update: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        name: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "review", "approved", "archived"]).optional(),
        owner: z.string().optional(),
        version: z.number().optional(),
        reviewers: z.array(z.string()).optional(),
        reviewDueDate: z.string().nullable().optional(), // ISO date string, null to clear
        approvalStatus: z.enum(["pending", "requested", "changes_requested", "approved"]).optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        const { id, clientId, reviewDueDate, ...data } = input;

        // Safeguard: verify policy belongs to this client
        const existing = await db.getClientPolicyById(id);
        if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
        if (existing.clientPolicy.clientId !== clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to this client" });
        }

        const updateData: any = { ...data };
        if (reviewDueDate !== undefined) updateData.reviewDueDate = reviewDueDate ? new Date(reviewDueDate) : null;

        await db.updateClientPolicy(id, updateData);

        // Log Activity for significant updates
        if (data.content || data.name || data.status || data.owner || data.approvalStatus) {
          await logActivity({
            userId: ctx.user.id,
            action: 'update',
            entityType: 'policy',
            entityId: id,
            clientId: clientId,
            details: {
              changes: Object.keys(data),
              version: existing.clientPolicy.version
            }
          });
        }

        // Re-index updated policy
        // Re-index updated policy - removed for Core split

        return { success: true };
      }),

    requestReview: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        reviewers: z.array(z.string()),
        dueDate: z.string().optional(),
        message: z.string().optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const { id, clientId, reviewers, dueDate, message } = input;

        // Get current policy to validate state
        const existingPolicy = await db.getClientPolicyById(id);
        if (!existingPolicy) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });
        }

        if (existingPolicy.clientPolicy.clientId !== clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to this client" });
        }

        // Validate policy is in correct state for requesting review
        if (existingPolicy.clientPolicy.status !== 'draft' && existingPolicy.clientPolicy.status !== 'review') {
          console.warn(`[PolicyReview] Invalid state transition: policy ${id} is ${existingPolicy.clientPolicy.status}, expected draft or review`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot request review for policy in '${existingPolicy.clientPolicy.status}' status. Policy must be in 'draft' or 'review' status.`
          });
        }

        // Validate reviewers
        if (!reviewers || reviewers.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "At least one reviewer is required"
          });
        }

        console.log(`[PolicyReview] Request review for policy ${id}, client ${clientId}`);

        await db.updateClientPolicy(id, {
          approvalStatus: 'requested',
          reviewers: reviewers,
          reviewDueDate: dueDate ? new Date(dueDate) : null,
          status: 'review',
          updatedAt: new Date()
        });

        await logActivity({
          userId: ctx.user.id,
          action: 'request_review',
          entityType: 'policy',
          entityId: id,
          clientId: clientId,
          details: { reviewers, dueDate, message }
        });

        // Send Notifications to Reviewers
        try {
          const dbConn = await db.getDb();
          const policyResult = await db.getClientPolicyById(id);
          const policyName = policyResult?.clientPolicy?.name || "Policy";

          // Find Users associated with these Reviewers (matching by email)
          const reviewerDetails = await dbConn.select({
            id: employees.id,
            email: employees.email,
            firstName: employees.firstName,
            lastName: employees.lastName
          })
            .from(employees)
            .where(inArray(employees.id, reviewers.map((r: string) => parseInt(r, 10))));

          if (reviewerDetails.length > 0) {
            const reviewerEmails = reviewerDetails.map((r: typeof reviewerDetails[number]) => r.email);
            const userResults = await dbConn.select({ id: users.id, email: users.email })
              .from(users)
              .where(inArray(users.email, reviewerEmails));

            const userIds = userResults.map((u: typeof userResults[number]) => u.id);

            // 1. In-App Notifications
            if (userIds.length > 0) {
              await notifyUsers(userIds, {
                type: "policy_review_requested",
                title: "Policy Review Requested",
                message: `${ctx.user.name || 'A team member'} has requested your review for the policy: ${policyName}.`,
                link: `/clients/${clientId}/policies/${id}`,
                relatedEntityType: "policy",
                relatedEntityId: id
              });
            }

            // 2. Email Notifications
            for (const reviewer of reviewerDetails) {
              await EmailService.send({
                to: reviewer.email,
                subject: `Review Requested: ${policyName}`,
                html: `
                  <div style="font-family: sans-serif; color: #374151;">
                    <h2>Policy Review Requested</h2>
                    <p>Hello ${reviewer.firstName},</p>
                    <p><strong>${ctx.user.name || 'A team member'}</strong> has requested that you review the following policy:</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      <p><strong>Policy:</strong> ${policyName}</p>
                      ${dueDate ? `<p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>` : ''}
                      ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                    </div>
                    <p>Please log in to the ComplianceOS dashboard to review and provide your feedback.</p>
                    <a href="${process.env.VITE_APP_URL || ''}/clients/${clientId}/policies/${id}" 
                       style="display: inline-block; background-color: #1c4d8d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                      View Policy
                    </a>
                  </div>
                `,
                clientId: clientId
              });
            }
          }
        } catch (error) {
          console.error("[PolicyReview] Notification failed:", error);
        }

        return { success: true };

      }),

    submitApproval: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        decision: z.enum(['approved', 'changes_requested']),
        notes: z.string().optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const { id, clientId, decision, notes } = input;

        // Get current policy to validate state
        const existingPolicy = await db.getClientPolicyById(id);
        if (!existingPolicy) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });
        }

        if (existingPolicy.clientPolicy.clientId !== clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to this client" });
        }

        // Validate policy is in correct state for review decision
        if (existingPolicy.clientPolicy.status !== 'review') {
          console.warn(`[PolicyReview] Invalid state transition: policy ${id} is ${existingPolicy.clientPolicy.status}, expected review`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Cannot review policy in '${existingPolicy.clientPolicy.status}' status. Policy must be in 'review' status.`
          });
        }

        // Determine new status based on decision
        const newStatus = decision === 'approved' ? 'approved' : 'draft';

        console.log(`[PolicyReview] Decision for policy ${id}: ${decision}, new status: ${newStatus}`);

        await db.updateClientPolicy(id, {
          approvalStatus: decision,
          status: newStatus,
          updatedAt: new Date()
        });

        await logActivity({
          userId: ctx.user.id,
          action: decision === 'approved' ? 'approve_policy' : 'reject_policy',
          entityType: 'policy',
          entityId: id,
          clientId: clientId,
          details: { notes }
        });

        // Notify Policy Owner/Creator
        try {
          const dbConn = await db.getDb();
          const policyResult = await db.getClientPolicyById(id);
          const policy = policyResult?.clientPolicy;
          if (policy) {
            // Find user id for the owner (if owner is set as an identifier) or just notify the original creator
            // For now, let's assume we want to notify whoever is the 'owner' if we can find them,
            // or just log it for the next time they visit.

            // If the policy has an 'owner' email, let's use that.
            if (policy.owner && policy.owner.includes('@')) {
              const [ownerUser] = await dbConn.select({ id: users.id })
                .from(users)
                .where(eq(users.email, policy.owner))
                .limit(1);

              if (ownerUser) {
                await notifyUsers([ownerUser.id], {
                  type: decision === 'approved' ? 'policy_approved' : 'policy_changes_requested',
                  title: decision === 'approved' ? 'Policy Approved' : 'Changes Requested on Policy',
                  message: `${ctx.user.name || 'A reviewer'} has ${decision === 'approved' ? 'approved' : 'requested changes to'} your policy: ${policy.name}.`,
                  link: `/clients/${clientId}/policies/${id}`,
                  relatedEntityType: "policy",
                  relatedEntityId: id,
                  metadata: { notes }
                });
              }

              await EmailService.send({
                to: policy.owner,
                subject: `Policy Review Update: ${policy.name}`,
                html: `
                      <div style="font-family: sans-serif; color: #374151;">
                        <h2>Policy Review Decision</h2>
                        <p>A decision has been made on the policy: <strong>${policy.name}</strong></p>
                        <div style="background-color: ${decision === 'approved' ? '#ecfdf5' : '#fef2f2'}; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid ${decision === 'approved' ? '#10b981' : '#ef4444'};">
                          <p><strong>Decision:</strong> <span style="font-weight: bold; color: ${decision === 'approved' ? '#059669' : '#dc2626'}; text-transform: uppercase;">${decision.replace('_', ' ')}</span></p>
                          ${notes ? `<p><strong>Notes/Feedback:</strong> ${notes}</p>` : ''}
                        </div>
                        <a href="${process.env.VITE_APP_URL || ''}/clients/${clientId}/policies/${id}" 
                           style="display: inline-block; background-color: #1c4d8d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
                          View Policy
                        </a>
                      </div>
                    `,
                clientId: clientId
              });
            }
          }
        } catch (error) {
          console.error("[PolicyApproval] Notification failed:", error);
        }

        return { success: true };

      }),
    delete: clientEditorProcedure
      .input(z.object({ id: z.number(), clientId: z.number() }))
      .mutation(async ({ input }: any) => {
        // Fetch policy first to get clientId if needed, or assume global delete logic if supported.
        // But since we need clientId for partitioning, we must fetch it.
        const policy = await db.getClientPolicyById(input.id);
        if (!policy) throw new TRPCError({ code: "NOT_FOUND" });

        if (policy.clientPolicy.clientId !== input.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to this client" });
        }

        await db.deleteClientPolicy(input.id);

        // if (policy) {
        //   try {
        //     const { IndexingService } = await import('../../lib/advisor/indexing');
        //     await IndexingService.deleteDocumentIndex(policy.clientPolicy.clientId, 'policy', input.id.toString());
        //   } catch (e) { console.error("Failed to delete policy index:", e); }
        // }

        return { success: true };
      }),
    generateBulk: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        companyName: z.string(),
      }))
      .mutation(async ({ input }: any) => {
        return await db.bulkGeneratePolicies(input.clientId, input.companyName);
      }),
    getRACI: clientProcedure
      .input(z.object({ policyId: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        // Optional: verify policy belongs to clientId
        return await db.getPolicyRACIAssignments(input.policyId);
      }),
    updateRACI: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        policyId: z.number(),
        assignments: z.array(z.object({
          role: z.string(),
          employeeId: z.number()
        }))
      }))
      .mutation(async ({ input }: any) => {
        await db.updatePolicyRACIAssignments(input.clientId, input.policyId, input.assignments);

        // Re-index assignments
        // Re-index assignments - removed for Core split
        // try {
        //   const { reindexKnowledgeBase } = await import("../../lib/advisor/service");
        //   reindexKnowledgeBase(input.clientId, 'assignments').catch(e => console.error(e));
        // } catch (e) { console.error("Failed to reindex assignments:", e); }

        return { success: true };
      }),

    publish: clientEditorProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number(),
        version: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        const dbConn = await db.getDb();

        const policy = await dbConn.query.clientPolicies.findFirst({
          where: and(
            eq(clientPolicies.id, input.id),
            eq(clientPolicies.clientId, input.clientId)
          )
        });
        if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found or access denied" });

        // Calculate consistent version numbers
        const currentVersionNum = Number(policy.version) || 0;
        const newVersionNum = currentVersionNum + 1;
        const newVersionStr = input.version || `v${newVersionNum}.0`;

        console.log(`[PolicyPublish] Publishing policy ${input.id}: v${currentVersionNum} -> ${newVersionStr} (num: ${newVersionNum})`);

        // Create Version Snapshot
        await dbConn.insert(policyVersions).values({
          clientPolicyId: policy.id,
          version: newVersionStr,
          content: policy.content,
          status: 'approved',
          description: input.notes,
          publishedBy: (ctx.user as any)?.id
        });

        // Update Main Policy with consistent version number
        await dbConn.update(clientPolicies)
          .set({
            status: 'approved',
            version: newVersionNum,
            updatedAt: new Date()
          })
          .where(eq(clientPolicies.id, policy.id));

        // Log Activity
        await logActivity({
          userId: (ctx.user as any)?.id,
          clientId: policy.clientId,
          action: 'publish',
          entityType: 'policy',
          entityId: policy.id,
          details: {
            version: newVersionStr,
            notes: input.notes
          }
        });

        // Index for RAG
        // Index for RAG - removed for Core split

        return { success: true, version: newVersionStr };
      }),

    history: clientProcedure
      .input(z.object({ policyId: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();

        // First verify the policy belongs to this client
        const policy = await dbConn.query.clientPolicies.findFirst({
          where: and(
            eq(clientPolicies.id, input.policyId),
            eq(clientPolicies.clientId, input.clientId)
          )
        });

        if (!policy) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Policy not found or does not belong to this client"
          });
        }

        return await dbConn.select({
          version: policyVersions,
          publisher: users
        })
          .from(policyVersions)
          .leftJoin(users, eq(policyVersions.publishedBy, users.id))
          .where(eq(policyVersions.clientPolicyId, input.policyId))
          .orderBy(desc(policyVersions.createdAt));
      }),

    restore: clientEditorProcedure
      .input(z.object({
        policyId: z.number(),
        versionId: z.number(),
        clientId: z.number()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const dbConn = await db.getDb();

        // Get the version content
        const version = await dbConn.query.policyVersions.findFirst({
          where: eq(policyVersions.id, input.versionId)
        });

        if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Version not found" });
        if (version.clientPolicyId !== input.policyId) throw new TRPCError({ code: "BAD_REQUEST", message: "Version does not belong to this policy" });

        // Get policy for client ID (for logging)
        const policy = await db.getClientPolicyById(input.policyId);
        if (!policy) throw new TRPCError({ code: "NOT_FOUND", message: "Policy not found" });
        if (policy.clientPolicy.clientId !== input.clientId) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Policy does not belong to this client" });
        }

        const currentVersionNum = Number(policy.clientPolicy.version) || 0;
        const newVersionNum = currentVersionNum + 1;

        console.log(`[PolicyRestore] Restoring policy ${input.policyId} to version ${version.version}, new version will be ${newVersionNum}`);

        // Create a version snapshot of current state before restoring
        await dbConn.insert(policyVersions).values({
          clientPolicyId: policy.clientPolicy.id,
          version: `v${currentVersionNum}.0-pre-restore`,
          content: policy.clientPolicy.content,
          status: 'draft',
          description: `Auto-snapshot before restoring to ${version.version}`,
          publishedBy: (ctx.user as any)?.id
        });

        // Update the policy with restored content
        await dbConn.update(clientPolicies)
          .set({
            content: version.content,
            status: 'draft',
            version: newVersionNum,
            updatedAt: new Date()
          })
          .where(eq(clientPolicies.id, input.policyId));

        // Log Activity
        await logActivity({
          userId: (ctx.user as any)?.id,
          clientId: policy.clientId,
          action: 'restore',
          entityType: 'policy',
          entityId: input.policyId,
          details: {
            restoredFromVersion: version.version,
            versionId: version.id
          }
        });

        return { success: true };
      }),

    refine: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        content: z.string(),
        instruction: z.string().optional(),
        mode: z.enum(['refine', 'fix_placeholders']).optional(),
        context: z.object({
          clientName: z.string(),
          industry: z.string().optional()
        }).optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const { llmService } = await import('../../lib/llm/service');
        const dbConn = await db.getDb();

        // Fetch Client Data for accurate context
        let clientName = input.context?.clientName || 'the Organization';
        let industry = input.context?.industry || 'General';

        try {
          const client = await dbConn.query.clients.findFirst({
            where: eq(schema.clients.id, input.clientId),
            columns: { name: true, industry: true }
          });
          if (client?.name) clientName = client.name;
          if (client?.industry) industry = client.industry;
        } catch (e) {
          console.warn("[Refine] Could not fetch client data:", e);
        }

        let prompt = "";

        if (input.mode === 'fix_placeholders') {
          prompt = `You are a compliance policy editor. Your task is to ONLY fill in placeholders in the provided HTML content.
            Context: Client=${clientName}, Industry=${industry}.
            
            Strict Instructions:
            1. Identify placeholders such as [Company Name], TBD, [Date], [Insert Role], {{company_name}}, etc.
            2. Replace them with specific, plausible values appropriate for ${clientName}.
            3. CRITICAL: DO NOT rewrite, rephrase, summarize, or change any other text. The structure and wording must remain exactly the same, except for the filled placeholders.
            4. Return the full, valid HTML content.
            `
        } else {
          prompt = `Rewrite the following compliance policy content to be more professional, clear, and compliant.
            Context: Client=${clientName}, Industry=${industry}.
            `;
        }

        if (input.instruction) {
          prompt += `\nSpecific Instruction: ${input.instruction}\n`;
        }

        prompt += `\nReturn ONLY the HTML content. Do not include markdown code blocks, preamble, or explanations.\n\nContent:\n${input.content}`;

        try {
          const response = await llmService.generate({
            userPrompt: prompt,
            temperature: 0.3,
            feature: 'policy_refinement'
          }, {
            clientId: input.clientId,
            userId: ctx.user?.id,
            endpoint: 'clientPolicies.refine'
          });

          let cleanContent = response.text.trim();
          // specific cleanup for common LLM markdown habits
          if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.replace(/^```(?:html|markdown)?\s*/, '').replace(/\s*```$/, '');
          }

          return { content: cleanContent };
        } catch (error: any) {
          console.error("Refine failed:", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI Refinement failed: " + error.message });
        }
      }),


    gapAnalysis: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }: any) => {
        return await db.getPolicyGapAnalysis(input.clientId);
      }),

    linkRisk: clientEditorProcedure
      .input(z.object({
        policyId: z.number(),
        riskId: z.number(),
        notes: z.string().optional()
      }))
      .mutation(async ({ input, ctx }: any) => {
        const dbConn = await db.getDb();

        // Check if exists
        const existing = await dbConn.select().from(riskPolicyMappings)
          .where(and(
            eq(riskPolicyMappings.clientPolicyId, input.policyId),
            eq(riskPolicyMappings.riskAssessmentId, input.riskId)
          ));

        if (existing.length > 0) return { success: true, message: "Already linked" };

        // Get Client ID from policy
        const policy = await db.getClientPolicyById(input.policyId);
        if (!policy) throw new TRPCError({ code: "NOT_FOUND" });

        await dbConn.insert(riskPolicyMappings).values({
          clientId: policy.clientPolicy.clientId,
          clientPolicyId: input.policyId,
          riskAssessmentId: input.riskId,
          notes: input.notes
        });
        return { success: true };
      }),

    unlinkRisk: clientEditorProcedure
      .input(z.object({
        policyId: z.number(),
        riskId: z.number()
      }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();

        await dbConn.delete(riskPolicyMappings)
          .where(and(
            eq(riskPolicyMappings.clientPolicyId, input.policyId),
            eq(riskPolicyMappings.riskAssessmentId, input.riskId)
          ));
        return { success: true };
      }),

    getLinkedRisks: clientProcedure
      .input(z.object({ policyId: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();

        const links = await dbConn.select({
          mapping: riskPolicyMappings,
          risk: riskAssessments
        })
          .from(riskPolicyMappings)
          .innerJoin(riskAssessments, eq(riskPolicyMappings.riskAssessmentId, riskAssessments.id))
          .where(eq(riskPolicyMappings.clientPolicyId, input.policyId));

        return links;
      }),

    getLinkedControls: clientProcedure
      .input(z.object({ policyId: z.number(), clientId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        return await dbConn.select({
          mapping: controlPolicyMappings,
          clientControl: clientControls,
          control: controls
        })
          .from(controlPolicyMappings)
          .innerJoin(clientControls, eq(controlPolicyMappings.clientControlId, clientControls.id))
          .leftJoin(controls, eq(clientControls.controlId, controls.id))
          .where(eq(controlPolicyMappings.clientPolicyId, input.policyId));
      }),

    linkControl: clientEditorProcedure
      .input(z.object({
        policyId: z.number(),
        controlId: z.number(), // This is client_control.id
        notes: z.string().optional()
      }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();

        // Check if exists
        const existing = await dbConn.select().from(controlPolicyMappings)
          .where(and(
            eq(controlPolicyMappings.clientPolicyId, input.policyId),
            eq(controlPolicyMappings.clientControlId, input.controlId)
          ));

        if (existing.length > 0) return { success: true, message: "Already linked" };

        // Get Client ID from policy
        const policy = await db.getClientPolicyById(input.policyId);
        if (!policy) throw new TRPCError({ code: "NOT_FOUND" });

        await dbConn.insert(controlPolicyMappings).values({
          clientId: policy.clientPolicy.clientId,
          clientPolicyId: input.policyId,
          clientControlId: input.controlId,
          notes: input.notes
        });
        return { success: true };
      }),

    unlinkControl: clientEditorProcedure
      .input(z.object({
        policyId: z.number(),
        controlId: z.number()
      }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();

        await dbConn.delete(controlPolicyMappings)
          .where(and(
            eq(controlPolicyMappings.clientPolicyId, input.policyId),
            eq(controlPolicyMappings.clientControlId, input.controlId)
          ));
        return { success: true };
      }),

    incorporateLinterSections: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        policyId: z.number(),
        content: z.string(),
        missingSections: z.array(z.object({
          id: z.string(),
          title: z.string()
        }))
      }))
      .mutation(async ({ input }: any) => {
        const { policyGenerator } = await import("../../lib/policy/policy-generation");

        const updatedContent = await policyGenerator.incorporateMissingSections(
          input.clientId,
          input.content,
          input.missingSections
        );

        return { content: updatedContent };
      }),



  });
};
