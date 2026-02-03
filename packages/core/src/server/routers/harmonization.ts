
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, inArray, desc } from "drizzle-orm";

export const createHarmonizationRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        // Get mappings for a specific framework (e.g., what maps TO ISO 27001)
        getMappings: protectedProcedure.input(z.object({
            frameworkId: z.number(),
            direction: z.enum(['incoming', 'outgoing']).default('incoming')
        })).query(async ({ input }: any) => {
            const db = await getDb();

            let whereClause;
            if (input.direction === 'incoming') {
                // Show me things that convert INTO this framework
                whereClause = eq(schema.frameworkMappings.targetFrameworkId, input.frameworkId);
            } else {
                // Show me things this framework converts TO
                whereClause = eq(schema.frameworkMappings.sourceFrameworkId, input.frameworkId);
            }

            const mappings = await db.select().from(schema.frameworkMappings)
                .where(whereClause);

            return mappings;
        }),

        // The Magic: Scans a plan and finds efficiency gains
        analyzePlanHarmonization: protectedProcedure.input(z.object({
            planId: z.number()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();

            // 1. Get current plan details
            const [plan] = await db.select().from(schema.implementationPlans)
                .where(eq(schema.implementationPlans.id, input.planId))
                .limit(1);

            if (!plan || !plan.frameworkId) throw new Error("Plan or Framework not found");

            // 2. Find ALL other separate plans for this client that are "Completed" or "In Progress"
            // We want to find controls implemented elsewhere
            const otherPlans = await db.select().from(schema.implementationPlans)
                .where(and(
                    eq(schema.implementationPlans.clientId, plan.clientId),
                    // ne(schema.implementationPlans.id, plan.id) // In Drizzle `ne` is not imported, use raw sql or filter in JS
                ));

            const relevantOtherPlans = otherPlans.filter(p => p.id !== plan.id && p.status !== 'not_started');

            if (relevantOtherPlans.length === 0) {
                return {
                    savingsPercentage: 0,
                    opportunities: []
                };
            }

            const otherPlanIds = relevantOtherPlans.map(p => p.id);

            // 3. Find completed tasks in those other plans
            const completedTasks = await db.select().from(schema.implementationTasks)
                .where(and(
                    inArray(schema.implementationTasks.implementationPlanId, otherPlanIds),
                    eq(schema.implementationTasks.status, 'done')
                ));

            // 4. Trace completed tasks -> controls -> mappings -> current plan requirements
            // This is complex because we need to bridge: Task -> Control ID (string) -> Control (int) -> Mapping -> Target Control (int) -> Target Control ID (string) -> Current Plan Task

            const opportunities: any[] = [];
            let totalSavedHours = 0;
            let currentPlanTotalHours = plan.estimatedHours || 100; // Fallback

            // Get all controls to resolve string IDs to Int IDs
            // optimize: fetch only relevant controls? For now fetch all is safer or use where inArray
            const allControls = await db.select().from(schema.controls);
            const controlsMap = new Map(allControls.map(c => [c.controlId, c]));
            const controlsIdMap = new Map(allControls.map(c => [c.id, c]));

            // Get mappings
            const mappings = await db.select().from(schema.controlMappings);

            // Get tasks in CURRENT plan to recommend skipping
            const currentPlanTasks = await db.select().from(schema.implementationTasks)
                .where(eq(schema.implementationTasks.implementationPlanId, plan.id));

            for (const otherTask of completedTasks) {
                if (!otherTask.controlId) continue;

                const sourceControl = controlsMap.get(otherTask.controlId);
                if (!sourceControl) continue;

                // Find what this maps TO (outgoing)
                const relevantMappings = mappings.filter(m => m.sourceControlId === sourceControl.id);

                for (const map of relevantMappings) {
                    const targetControl = controlsIdMap.get(map.targetControlId);
                    if (!targetControl) continue;

                    // Does the current plan have a task for this target control?
                    const matchingCurrentTask = currentPlanTasks.find(t => t.controlId === targetControl.controlId && t.status !== 'done');

                    if (matchingCurrentTask) {
                        // Found an opportunity!
                        if (!opportunities.find(o => o.id === matchingCurrentTask.id)) {
                            opportunities.push({
                                id: matchingCurrentTask.id,
                                title: matchingCurrentTask.title,
                                source: `Implemented in ${relevantOtherPlans.find(p => p.id === otherTask.implementationPlanId)?.title || 'Other Plan'}`,
                                confidence: map.confidence === 'ai_high' ? 'High' : 'Medium',
                                savedHours: matchingCurrentTask.estimatedHours || 0
                            });
                            totalSavedHours += (matchingCurrentTask.estimatedHours || 0);
                        }
                    }
                }
            }

            // Heuristic fallbacks for Demo if no exact mappings found
            // If the titles are very similar (e.g. "Access Control Policy"), exact match
            for (const otherTask of completedTasks) {
                const matchingCurrentTask = currentPlanTasks.find(t =>
                    t.title === otherTask.title &&
                    t.status !== 'done' &&
                    !opportunities.find(o => o.id === t.id)
                );

                if (matchingCurrentTask) {
                    opportunities.push({
                        id: matchingCurrentTask.id,
                        title: matchingCurrentTask.title,
                        source: `Direct Match in ${relevantOtherPlans.find(p => p.id === otherTask.implementationPlanId)?.title || 'Other Plan'}`,
                        confidence: 'High',
                        savedHours: matchingCurrentTask.estimatedHours || 0
                    });
                    totalSavedHours += (matchingCurrentTask.estimatedHours || 0);
                }
            }

            const savingsPercentage = currentPlanTotalHours > 0
                ? Math.round((totalSavedHours / currentPlanTotalHours) * 100)
                : 0;

            return {
                savingsPercentage,
                opportunities
            };
        })
    });
};
