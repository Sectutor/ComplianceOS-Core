import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { clientControls, controls } from "../../schema";
import * as db from "../../db";
import { eq, and, inArray, or } from "drizzle-orm";
import { iso27001Controls } from "../../data/frameworks/iso27001";

export const createIso27001Router = (t: any, clientProcedure: any, clientEditorProcedure: any) => {
    return t.router({
        getSoA: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                console.log(`[ISO27001] Fetching SoA for client: ${input.clientId}`);
                const dbConn = await db.getDb();

                // 1. Fetch existing client controls for ISO 27001 (allowing for name variations)
                const existing = await dbConn.select({
                    clientControl: clientControls,
                    control: controls
                })
                    .from(clientControls)
                    .innerJoin(controls, eq(clientControls.controlId, controls.id))
                    .where(and(
                        eq(clientControls.clientId, input.clientId),
                        or(
                            eq(controls.framework, "ISO 27001:2022"),
                            eq(controls.framework, "ISO 27001")
                        )
                    ));

                if (existing.length > 0) {
                    console.log(`[ISO27001] Found ${existing.length} existing controls`);
                    return existing;
                }
                console.log(`[ISO27001] No controls found for client, checking global...`);

                // 2. If none, check if global controls exist
                const globalControls = await dbConn.select()
                    .from(controls)
                    .where(or(
                        eq(controls.framework, "ISO 27001:2022"),
                        eq(controls.framework, "ISO 27001")
                    ));

                if (globalControls.length === 0) {
                    console.log(`[ISO27001] No global controls found. Seeding ISO 27001:2022...`);
                    // Seed global controls from static data if they don't exist
                    const toInsert = iso27001Controls.map(c => ({
                        controlId: c.id,
                        name: c.name,
                        description: c.description,
                        framework: "ISO 27001:2022",
                        category: c.category,
                        status: 'active' as const,
                        version: 1
                    }));
                    await dbConn.insert(controls).values(toInsert);

                    // Re-fetch
                    const newGlobal = await dbConn.select()
                        .from(controls)
                        .where(or(
                            eq(controls.framework, "ISO 27001:2022"),
                            eq(controls.framework, "ISO 27001")
                        ));

                    // Auto-assign to client
                    const clientBatch = newGlobal.map(c => ({
                        clientId: input.clientId,
                        controlId: c.id,
                        clientControlId: c.controlId,
                        status: 'not_implemented' as const,
                        applicability: 'applicable'
                    }));
                    await dbConn.insert(clientControls).values(clientBatch);

                    return await dbConn.select({
                        clientControl: clientControls,
                        control: controls
                    })
                        .from(clientControls)
                        .innerJoin(controls, eq(clientControls.controlId, controls.id))
                        .where(and(
                            eq(clientControls.clientId, input.clientId),
                            eq(controls.framework, "ISO 27001:2022")
                        ));
                }

                console.log(`[ISO27001] Found ${globalControls.length} global controls, assigning to client...`);

                // 3. Global exist but not assigned to client (or partially assigned)
                // Need to filter out controls the client ALREADY has to avoid duplicate key errors.

                // Fetch ALL existing client control IDs for this client (regardless of framework filter)
                // This ensures we don't try to insert a duplicate (clientId, controlId)
                const existingClientControlIds = await dbConn.select({
                    controlId: clientControls.controlId
                })
                    .from(clientControls)
                    .where(eq(clientControls.clientId, input.clientId));

                const existingSet = new Set(existingClientControlIds.map(c => c.controlId));

                const clientBatch = globalControls
                    .filter(c => !existingSet.has(c.id))
                    .map(c => ({
                        clientId: input.clientId,
                        controlId: c.id,
                        clientControlId: c.controlId,
                        status: 'not_implemented' as const,
                        applicability: 'applicable'
                    }));

                if (clientBatch.length > 0) {
                    await dbConn.insert(clientControls)
                        .values(clientBatch)
                        .onConflictDoNothing();
                }

                return await dbConn.select({
                    clientControl: clientControls,
                    control: controls
                })
                    .from(clientControls)
                    .innerJoin(controls, eq(clientControls.controlId, controls.id))
                    .where(and(
                        eq(clientControls.clientId, input.clientId),
                        or(
                            eq(controls.framework, "ISO 27001:2022"),
                            eq(controls.framework, "ISO 27001")
                        )
                    ));
            }),

        updateSoA: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                controlId: z.number(), // This is the clientControl.id
                applicability: z.enum(["applicable", "not_applicable"]),
                justification: z.string().optional(),
                status: z.enum(["not_implemented", "in_progress", "implemented", "not_applicable"]),
                implementationNotes: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                console.log(`[ISO27001] Updating control ${input.controlId} for client ${input.clientId}`);
                try {
                    const dbConn = await db.getDb();

                    // Security check: ensure this client control belongs to the client
                    const [existing] = await dbConn.select().from(clientControls)
                        .where(and(
                            eq(clientControls.id, input.controlId),
                            eq(clientControls.clientId, input.clientId)
                        ))
                        .limit(1);

                    if (!existing) {
                        console.error(`[ISO27001] Control ${input.controlId} not found or denied for client ${input.clientId}`);
                        throw new TRPCError({ code: "FORBIDDEN", message: "Control not found or access denied" });
                    }

                    await dbConn.update(clientControls)
                        .set({
                            applicability: input.applicability,
                            justification: input.justification,
                            status: input.status,
                            implementationNotes: input.implementationNotes,
                            updatedAt: new Date()
                        })
                        .where(eq(clientControls.id, input.controlId));

                    console.log(`[ISO27001] Update successful`);
                    return { success: true };
                } catch (err: any) {
                    console.error(`[ISO27001] Update failed:`, err);
                    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err.message });
                }
            })
    });
};
