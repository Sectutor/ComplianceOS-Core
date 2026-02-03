// import { IndexingService } from "../../lib/advisor/indexing";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clientControls, controlMappings, controls, regulationMappings, notificationLog, controlBaselines } from "../../schema";
import { logActivity } from "../../lib/audit";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, desc, sql, inArray, like, or } from "drizzle-orm";

export const createClientControlsRouter = (t: any, clientProcedure: any, adminProcedure: any, publicProcedure: any, clientEditorProcedure: any) => {
  return t.router({

    sync: adminProcedure
      .input(z.object({ sourceClientControlId: z.number() }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();

        return await dbConn.transaction(async (tx: any) => {
          // 1. Get Source Control
          const source = await tx.query.clientControls.findFirst({
            where: eq(clientControls.id, input.sourceClientControlId),
            with: { control: true }
          });
          if (!source) throw new TRPCError({ code: "NOT_FOUND" });

          // 2. Find Mappings for this Control
          const mappings = await tx.select()
            .from(controlMappings)
            .where(eq(controlMappings.sourceControlId, source.controlId));

          // 3. Update Client Controls for mapped targets (if they exist for this client)
          let syncedCount = 0;
          for (const map of mappings) {
            const targetClientControl = await tx.query.clientControls.findFirst({
              where: and(
                eq(clientControls.clientId, source.clientId),
                eq(clientControls.controlId, map.targetControlId)
              )
            });

            if (targetClientControl) {
              await tx.update(clientControls)
                .set({
                  status: source.status,
                  applicability: source.applicability,
                  implementationNotes: source.implementationNotes + `\n(Synced from ${source.control.framework} ${source.control.controlId})`,
                  evidenceLocation: source.evidenceLocation
                })
                .where(eq(clientControls.id, targetClientControl.id));
              syncedCount++;
            }
          }
          return { syncedCount };
        });
      }),

    list: clientProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ input }: any) => {
        console.log("DEBUG: clientControls.list called for clientId:", input.clientId);
        return await db.getClientControls(input.clientId);
      }),
    get: clientProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }: any) => {
        const cc = await db.getClientControlById(input.id);
        if (!cc) throw new TRPCError({ code: "NOT_FOUND" });

        // Manual Security Check since input lacks clientId
        if (ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
          const allowed = await db.isUserAllowedForClient(ctx.user.id, cc.clientId);
          if (!allowed) throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }

        return cc;
      }),

    getMappings: clientProcedure
      .input(z.object({ controlId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const mappings = await dbConn.select()
          .from(controlMappings)
          .where(eq(controlMappings.sourceControlId, input.controlId));
        return mappings;
      }),

    getLinkedPolicies: clientProcedure
      .input(z.object({ controlId: z.number() }))
      .query(async ({ input }: any) => {
        const dbConn = await db.getDb();
        const results = await dbConn.select({
          mapping: schema.controlPolicyMappings,
          policy: schema.clientPolicies
        })
          .from(schema.controlPolicyMappings)
          .innerJoin(schema.clientPolicies, eq(schema.controlPolicyMappings.clientPolicyId, schema.clientPolicies.id))
          .where(eq(schema.controlPolicyMappings.clientControlId, input.controlId));

        return results.map((r: any) => ({
          ...r.policy,
          mapping: r.mapping
        }));
      }),
    createCustom: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        framework: z.string().default("Custom"),
        code: z.string().optional()
      }))
      .mutation(async ({ input }: any) => {
        const dbConn = await db.getDb();

        // 1. Generate or use provided Control Code
        const controlCode = input.code || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        // 2. Check if Global Control Exists
        let targetControlId: number;
        const existingControl = await dbConn.select().from(controls).where(eq(controls.controlId, controlCode)).limit(1);

        if (existingControl.length > 0) {
          // Control exists, use it
          targetControlId = existingControl[0].id;
        } else {
          // Control does not exist, create it
          const [newControl] = await dbConn.insert(controls).values({
            controlId: controlCode,
            name: input.name,
            description: input.description,
            framework: input.framework,
            status: 'active',
            version: 1
          }).returning();
          targetControlId = newControl.id;
        }

        // 3. Create or Update Client Control Link
        // Check if already linked
        const existingLink = await dbConn.select().from(clientControls).where(and(
          eq(clientControls.clientId, input.clientId),
          eq(clientControls.controlId, targetControlId)
        )).limit(1);

        let clientControlResult;
        if (existingLink.length > 0) {
          // Already linked, return existing
          clientControlResult = existingLink[0];
        } else {
          // Link it
          const [newClientControl] = await dbConn.insert(clientControls).values({
            clientId: input.clientId,
            controlId: targetControlId,
            clientControlId: controlCode,
            status: 'not_implemented',
            applicability: 'applicable'
          }).returning();
          clientControlResult = newClientControl;
        }

        const finalControl = existingControl.length > 0 ? existingControl[0] : (await dbConn.select().from(controls).where(eq(controls.id, targetControlId)).limit(1))[0];

        return {
          success: true,
          control: finalControl,
          clientControl: clientControlResult
        };
      }),
    create: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        controlId: z.number(),
        clientControlId: z.string().optional(),
        customDescription: z.string().optional(),
        owner: z.string().optional(),
        status: z.enum(["not_implemented", "in_progress", "implemented", "not_applicable"]).optional(),
      }))
      .mutation(async ({ input }: any) => {
        const newControl = await db.createClientControl(input);

        // Index the new client control
        // Indexing removed for Core split
        // try {
        //   const fullControl = await db.getClientControlById(newControl.id);
        //   if (fullControl) {
        //     // ... indexing logic ...
        //   }
        // } catch (error) {
        //   console.error("Failed to index new client control:", error);
        // }
        return newControl;
      }),
    update: clientEditorProcedure
      .input(z.object({
        clientId: z.number(), // Required for permission check
        id: z.number(),
        customDescription: z.string().optional(),
        owner: z.string().optional(),
        status: z.enum(["not_implemented", "in_progress", "implemented", "not_applicable"]).optional(),
        applicability: z.string().optional(),
        justification: z.string().optional(),
        implementationDate: z.date().nullable().optional(),
        implementationNotes: z.string().optional(),
        evidenceLocation: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }: any) => {
        const { id, ...data } = input;

        // Validation: Require justification for N/A
        if (data.applicability === 'not_applicable' && !data.justification) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Justification is required when marking a control as Not Applicable."
          });
        }

        // Fetch previous state for logging
        const previousState = await db.getClientControlById(id);

        await db.updateClientControl(id, data);

        // --- Dynamic Status Propagation (Master Framework Logic) ---
        if (data.status || data.evidenceLocation || data.implementationNotes) {
          try {
            const dbConn = await db.getDb();
            const currentControl = previousState?.clientControl;
            // Get underlying master control info
            const masterControlInfo = previousState?.control;

            if (currentControl && masterControlInfo) {
              // Find all mapped controls using the new frameworkMappings table
              // We check both directions: Source -> Target AND Target -> Source

              // 1. Where current is Source
              const mappingsAsSource = await dbConn.select({
                targetId: schema.frameworkMappings.targetControlId
              }).from(schema.frameworkMappings)
                .where(eq(schema.frameworkMappings.sourceControlId, masterControlInfo.id));

              // 2. Where current is Target (if bi-directional sync is desired)
              const mappingsAsTarget = await dbConn.select({
                sourceId: schema.frameworkMappings.sourceControlId
              }).from(schema.frameworkMappings)
                .where(eq(schema.frameworkMappings.targetControlId, masterControlInfo.id));

              const relatedGlobalControlIds = [
                ...mappingsAsSource.map((m: any) => m.targetId),
                ...mappingsAsTarget.map((m: any) => m.sourceId)
              ];

              if (relatedGlobalControlIds.length > 0) {
                // Find Client Controls for these Global IDs owned by this client
                const peerControls = await dbConn.select().from(clientControls)
                  .where(and(
                    eq(clientControls.clientId, currentControl.clientId),
                    inArray(clientControls.controlId, relatedGlobalControlIds)
                  ));

                // Update them
                for (const peer of peerControls) {
                  // Only update if changes are significant to avoid infinite loops or noise
                  // We also avoid updating if the peer is already in the desired state
                  // Note: In a real "Master" system, we might only check if current is Master. 
                  // Here we assume bi-directional sync for convenience explicitly requested.

                  const shouldUpdateStatus = data.status && peer.status !== data.status;
                  const shouldUpdateEvidence = data.evidenceLocation && peer.evidenceLocation !== data.evidenceLocation;

                  if (shouldUpdateStatus || shouldUpdateEvidence) {
                    await dbConn.update(clientControls).set({
                      status: data.status || peer.status,
                      evidenceLocation: data.evidenceLocation || peer.evidenceLocation,
                      // Append note only if not already present to avoid spam
                      implementationNotes: peer.implementationNotes?.includes(`(Synced from ${masterControlInfo.controlId})`)
                        ? peer.implementationNotes
                        : (peer.implementationNotes || '') + `\n(Synced from ${masterControlInfo.controlId})`,
                      updatedAt: new Date()
                    }).where(eq(clientControls.id, peer.id));
                  }
                }
              }
            }
          } catch (e) {
            console.error("Failed to propagate control status:", e);
          }
        }
        // -----------------------------------------------------------

        // Log if status changed
        if (previousState && previousState.clientControl && data.status) {
          if (data.status !== previousState.clientControl.status) {

            try {
              await logActivity({
                userId: ctx.user!.id,
                clientId: previousState.clientControl.clientId,
                action: 'update',
                entityType: 'control',
                entityId: previousState.clientControl.controlId,
                details: {
                  field: 'status',
                  old: previousState.clientControl.status,
                  new: data.status,
                  controlCode: previousState.control?.controlId,
                  clientControlId: id
                }
              });
            } catch (e) {
              console.error("Audit Log Failure:", e);
            }

            // Regulatory Alert Logic
            const oldStatus = previousState.clientControl.status;
            const newStatus = data.status;
            const isDowngrade = (oldStatus === 'implemented' || oldStatus === 'in_progress') &&
              (newStatus === 'not_implemented' || newStatus === 'not_applicable');

            if (isDowngrade) {
              const dbConn = await db.getDb();
              if (dbConn && ctx.user) {
                const links = await dbConn.select().from(regulationMappings)
                  .where(and(
                    eq(regulationMappings.clientId, previousState.clientControl.clientId),
                    eq(regulationMappings.mappedType, 'control'),
                    eq(regulationMappings.mappedId, id)
                  ));

                if (links.length > 0) {
                  try {
                    await dbConn.insert(notificationLog).values({
                      userId: ctx.user.id,
                      type: 'alert',
                      title: 'Regulatory Compliance Impact',
                      message: `Control downgrade (${previousState.control?.controlId}) affects ${links.length} regulation articles (e.g. ${links[0].regulationId}).`
                    });
                  } catch (e) {
                    console.error("Alert Creation Failure:", e);
                  }
                }
              }
            }
          }

        }

        // Re-index updated control
        // Indexing removed for Core split
        // try {
        //   const fullControl = await db.getClientControlById(id);
        //   if (fullControl) {
        //     // ... indexing logic ...
        //   }
        // } catch (e) { console.error("Failed to update control index:", e); }

        return { success: true };
      }),
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }: any) => {
        // Fetch to get clientId
        const control = await db.getClientControlById(input.id);

        await db.deleteClientControl(input.id);

        if (control) {
          try {
            // await IndexingService.deleteDocumentIndex(control.clientId, 'control', input.id.toString());
          } catch (e) { console.error("Failed to delete control index:", e); }
        }
        return { success: true };
      }),
    bulkAssign: adminProcedure
      .input(z.object({
        clientId: z.number(),
        frameworks: z.array(z.string()),
      }))
      .mutation(async ({ input }: any) => {
        return await db.bulkAssignControls(input.clientId, input.frameworks);
      }),

    applyBaseline: clientEditorProcedure
      .input(z.object({
        clientId: z.number(),
        framework: z.string(), // "NIST SP 800-53 Rev 5"
        baseline: z.string(), // "low", "moderate", "high"
      }))
      .mutation(async ({ input, ctx }: any) => {
        const dbConn = await db.getDb();
        console.log(`Applying Baseline: ${input.baseline} for ${input.framework} to Client ${input.clientId}`);

        // 1. Determine Target Baselines (Cumulative)
        let targetBaselines = [input.baseline];
        if (input.baseline.toLowerCase() === 'high') targetBaselines = ['low', 'moderate', 'high'];
        else if (input.baseline.toLowerCase() === 'moderate') targetBaselines = ['low', 'moderate'];
        else targetBaselines = ['low'];

        console.log("Target Baselines:", targetBaselines);

        if (!controlBaselines) {
          console.error("CRITICAL: controlBaselines is undefined in router!");
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Server misconfiguration: controlBaselines definition missing." });
        }

        // 2. Fetch Control Codes for these baselines
        const baselineMappings = await dbConn.select()
          .from(controlBaselines)
          .where(and(
            eq(controlBaselines.framework, input.framework),
            inArray(controlBaselines.baseline, targetBaselines)
          ));

        const targetControlCodes = [...new Set(baselineMappings.map((bm: any) => bm.controlId))] as string[];
        console.log(`[DEBUG] Found ${targetControlCodes.length} codes for baseline ${input.baseline}. First 3: ${targetControlCodes.slice(0, 3)}`);

        if (targetControlCodes.length === 0) {
          return { success: true, appliedCount: 0, message: "No controls found for this baseline." };
        }

        // 3. Resolve Control Codes to Internal IDs
        // controls is imported at the top
        const validControls = await dbConn.select({
          id: controls.id,
          controlId: controls.controlId
        }).from(controls)
          .where(inArray(controls.controlId, targetControlCodes));

        console.log(`[DEBUG] Resolved ${validControls.length} valid controls from controls table.`);

        // 4. Apply to Client
        let appliedCount = 0;
        const existingControls = await dbConn.select({
          controlId: clientControls.controlId
        }).from(clientControls)
          .where(eq(clientControls.clientId, input.clientId));

        const existingControlIds = new Set(existingControls.map((c: any) => c.controlId));
        const toInsert: any[] = [];

        for (const ctrl of validControls) {
          if (!existingControlIds.has(ctrl.id)) {
            toInsert.push({
              clientId: input.clientId,
              controlId: ctrl.id,
              clientControlId: ctrl.controlId,
              status: 'not_implemented',
              applicability: 'applicable',
              implementationNotes: `Applied via ${input.baseline} baseline on ${new Date().toISOString()}`
            });
            existingControlIds.add(ctrl.id);
            appliedCount++;
          }
        }

        if (toInsert.length > 0) {
          const batchSize = 50;
          for (let i = 0; i < toInsert.length; i += batchSize) {
            const batch = toInsert.slice(i, i + batchSize);
            await dbConn.insert(clientControls).values(batch);
          }
          console.log(`[DEBUG] Successfully inserted ${toInsert.length} controls for Client ${input.clientId}`);
        } else {
          console.log(`[DEBUG] No new controls to insert for Client ${input.clientId} (all valid controls already exist).`);
        }

        return { success: true, appliedCount, totalControls: validControls.length };
      }),

  });
};
