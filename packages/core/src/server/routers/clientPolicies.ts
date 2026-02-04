import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clientPolicies, clientControls, controls, regulationMappings, notificationLog, users, policyVersions, riskPolicyMappings, riskAssessments, controlPolicyMappings, policyTemplates } from "../../schema";
import { logActivity } from "../../lib/audit";
import * as db from "../../db";
import { getDb } from "../../db";
import { policyGenerator } from "../../lib/policy/policy-generation";
import * as schema from "../../schema";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";

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
    create: adminProcedure
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
      }))
      .mutation(async ({ input }: any) => {
        let data = { ...input };

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
                customInstruction: data.instruction
              });
              data.content = generatedContent;
            } else if (data.sections && data.sections.length > 0) {
              // Generate from Blank with Sections
              const generatedContent = await policyGenerator.generateFromSections(data.clientId, data.name, data.sections, {
                tailorToIndustry: data.tailor,
                customInstruction: data.instruction
              });
              data.content = generatedContent;
            }
            // Mark as AI generated
            (data as any).isAiGenerated = true;
            console.log(`[PolicyCreate] Generation complete. Length: ${data.content?.length || 0}`);
          } catch (e) {
            console.error("[PolicyCreate] Policy Generation failed:", e);
          }
        }

        // Remove extra fields
        const { tailor, instruction, sections, ...insertData } = data;

        // Ensure status is valid or default
        if (!insertData.status) insertData.status = "draft";

        console.log(`[PolicyCreate] Saving policy to DB for client ${data.clientId}...`);
        const newPolicy = await db.createClientPolicy(insertData as any);
        console.log(`[PolicyCreate] Saved policy with ID: ${newPolicy?.id}`);

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

    suggestSections: publicProcedure
      .input(z.object({
        policyName: z.string(),
        industry: z.string().optional()
      }))
      .query(async ({ input }: any) => {
        return await policyGenerator.suggestSections(input.policyName, input.industry);
      }),
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        clientId: z.number().optional(), // usually not updated, but acceptable
        name: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "review", "approved", "archived"]).optional(),
        owner: z.string().optional(),
        version: z.number().optional(),
      }))
      .mutation(async ({ input }: any) => {
        const { id, ...data } = input;
        await db.updateClientPolicy(id, data);

        // Re-index updated policy
        // Re-index updated policy - removed for Core split

        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }: any) => {
        // Fetch policy first to get clientId if needed, or assume global delete logic if supported.
        // But since we need clientId for partitioning, we must fetch it.
        const policy = await db.getClientPolicyById(input.id);

        await db.deleteClientPolicy(input.id);

        // if (policy) {
        //   try {
        //     const { IndexingService } = await import('../../lib/advisor/indexing');
        //     await IndexingService.deleteDocumentIndex(policy.clientPolicy.clientId, 'policy', input.id.toString());
        //   } catch (e) { console.error("Failed to delete policy index:", e); }
        // }

        return { success: true };
      }),
    generateBulk: adminProcedure
      .input(z.object({
        clientId: z.number(),
        companyName: z.string(),
      }))
      .mutation(async ({ input }: any) => {
        return await db.bulkGeneratePolicies(input.clientId, input.companyName);
      }),
    getRACI: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ input }: any) => {
        return await db.getPolicyRACIAssignments(input.policyId);
      }),
    updateRACI: adminProcedure
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

    publish: adminProcedure
      .input(z.object({
        id: z.number(),
        version: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        const dbConn = await db.getDb();

        const policy = await dbConn.query.clientPolicies.findFirst({
          where: eq(clientPolicies.id, input.id)
        });
        if (!policy) throw new TRPCError({ code: "NOT_FOUND" });

        // Create Version Snapshot
        const newVersionStr = input.version || `v${(policy.version || 0) + 1}.0`;

        await dbConn.insert(policyVersions).values({
          clientPolicyId: policy.id,
          version: newVersionStr,
          content: policy.content,
          status: 'approved',
          description: input.notes,
          publishedBy: (ctx.user as any)?.id // Safe cast
        });

        // Update Main Policy
        await dbConn.update(clientPolicies)
          .set({
            status: 'approved',
            version: (policy.version || 0) + 1,
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

    history: publicProcedure
      .input(z.object({ policyId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();

        return await dbConn.select({
          version: policyVersions,
          publisher: users
        })
          .from(policyVersions)
          .leftJoin(users, eq(policyVersions.publishedBy, users.id))
          .where(eq(policyVersions.clientPolicyId, input.policyId))
          .orderBy(desc(policyVersions.createdAt));
      }),

    restore: adminProcedure
      .input(z.object({
        policyId: z.number(),
        versionId: z.number()
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

        // Update the policy
        await dbConn.update(clientPolicies)
          .set({
            content: version.content,
            status: 'draft', // Revert to draft
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

    refine: adminProcedure
      .input(z.object({
        content: z.string(),
        instruction: z.string(),
        context: z.object({
          clientName: z.string(),
          industry: z.string().optional()
        }).optional()
      }))
      .mutation(async ({ input }: any) => {
        // AI Refinement removed for Core split
        // const { LLMService } = await import('../../lib/llm/service');
        // const llm = new LLMService();
        // ...

        return { content: input.content }; // No-op return
      }),
    gapAnalysis: publicProcedure
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

    getLinkedRisks: publicProcedure
      .input(z.object({ policyId: z.number() }))
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

    getLinkedControls: publicProcedure
      .input(z.object({ policyId: z.number() }))
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

  });
};
