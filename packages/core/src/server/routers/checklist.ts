import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { checklistStates } from "../../schema";
import { eq, and } from "drizzle-orm";

const checklistItemSchema = z.union([
    z.boolean(),
    z.string(),
    z.number(),
    z.array(z.unknown()),
    z.record(z.unknown()),
    z.null()
]);

export const createChecklistRouter = (t: any, clientProcedure: any) => t.router({
    get: clientProcedure
        .input(z.object({
            clientId: z.number(),
            checklistId: z.string()
        }))
        .query(async ({ input }: any) => {
            console.log('[Checklist] Get query:', { clientId: input.clientId, checklistId: input.checklistId });
            const db = await getDb();
            const [state] = await db
                .select()
                .from(checklistStates)
                .where(and(
                    eq(checklistStates.clientId, input.clientId),
                    eq(checklistStates.checklistId, input.checklistId)
                ))
                .limit(1);

            console.log('[Checklist] Get result:', state ? 'found' : 'not found');
            return state || null;
        }),

    update: clientProcedure
        .input(z.object({
            clientId: z.number(),
            checklistId: z.string(),
            items: z.record(checklistItemSchema)
        }))
        .mutation(async ({ input }: any) => {
            console.log('[Checklist] Update mutation started:', {
                clientId: input.clientId,
                checklistId: input.checklistId,
                itemCount: Object.keys(input.items || {}).length
            });

            try {
                const db = await getDb();

                const [existing] = await db
                    .select()
                    .from(checklistStates)
                    .where(and(
                        eq(checklistStates.clientId, input.clientId),
                        eq(checklistStates.checklistId, input.checklistId)
                    ))
                    .limit(1);

                if (existing) {
                    console.log('[Checklist] Updating existing state:', existing.id);
                    await db
                        .update(checklistStates)
                        .set({
                            items: input.items,
                            updatedAt: new Date()
                        })
                        .where(eq(checklistStates.id, existing.id));
                } else {
                    console.log('[Checklist] Inserting new state');
                    await db
                        .insert(checklistStates)
                        .values({
                            clientId: input.clientId,
                            checklistId: input.checklistId,
                            items: input.items
                        });
                }

                console.log('[Checklist] Update successful');
                return { success: true };
            } catch (error) {
                console.error('[Checklist] Update failed:', error);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to update checklist: ${(error as Error).message}`,
                    cause: error
                });
            }
        }),

    linkEvidenceRequest: clientProcedure
        .input(z.object({
            clientId: z.number(),
            checklistId: z.string(),
            taskId: z.string(),
            evidenceRequestId: z.number()
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [existing] = await db
                .select()
                .from(checklistStates)
                .where(and(
                    eq(checklistStates.clientId, input.clientId),
                    eq(checklistStates.checklistId, input.checklistId)
                ))
                .limit(1);

            const items: Record<string, any> = existing?.items || {};
            const currentTask = items[input.taskId];

            if (typeof currentTask === 'object' && currentTask !== null) {
                items[input.taskId] = { ...currentTask, evidenceRequestId: input.evidenceRequestId };
            } else {
                items[input.taskId] = { checked: !!currentTask, evidenceRequestId: input.evidenceRequestId };
            }

            if (existing) {
                console.log('[Checklist] Updating items with evidence request link');
                await db
                    .update(checklistStates)
                    .set({ items, updatedAt: new Date() })
                    .where(eq(checklistStates.id, existing.id));
            } else {
                console.log('[Checklist] Inserting new state with evidence request link');
                await db
                    .insert(checklistStates)
                    .values({
                        clientId: input.clientId,
                        checklistId: input.checklistId,
                        items
                    });
            }
            return { success: true };
        })
});
