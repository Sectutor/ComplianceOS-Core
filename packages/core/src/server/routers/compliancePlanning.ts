
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and } from "drizzle-orm";
import { PLANNING_PROMPTS, SYSTEM_TEMPLATES } from "../../lib/ai/planningPrompts";
import { llmService } from "../../lib/llm/service";

export const createCompliancePlanningRouter = (t: any, protectedProcedure: any) => {
    return t.router({
        listFrameworks: protectedProcedure.query(async () => {
            const db = await getDb();
            const frameworks = await db.select().from(schema.complianceFrameworks);

            // If empty, return default list for UI to show (mock) or seed logic
            if (frameworks.length === 0) {
                return [
                    { id: 1, name: "ISO 27001:2022", shortCode: "ISO27001", type: "certification" },
                    { id: 2, name: "SOC 2 Type II", shortCode: "SOC2", type: "attestation" },
                    { id: 3, name: "GDPR", shortCode: "GDPR", type: "regulation" }
                ];
            }
            return frameworks;
        }),

        generatePlan: protectedProcedure.input(z.object({
            clientId: z.number(),
            framework: z.string(), // e.g., "ISO27001"
            useAi: z.boolean().optional().default(false),
            context: z.string().optional()
        })).mutation(async ({ input, ctx }: any) => {
            const db = await getDb();
            const frameworkCode = input.framework.toUpperCase();
            let planStructure: any = null;

            // 1. Framework Data Retrieval (System Template vs AI)
            const template = (SYSTEM_TEMPLATES as any)[frameworkCode];

            if (!input.useAi && template) {
                console.log(`[Planning] Using System Template for ${frameworkCode}`);
                planStructure = template;
            } else {
                console.log(`[Planning] Generating AI Plan for ${frameworkCode}`);
                // AI Logic
                const promptTemplate = (PLANNING_PROMPTS as any)[frameworkCode];
                if (!promptTemplate) {
                    // Fallback to template if prompt missing
                    if (template) {
                        planStructure = template;
                    } else {
                        throw new Error(`Framework ${frameworkCode} not supported yet.`);
                    }
                } else {
                    const prompt = promptTemplate(input.context || "Standard Organization");
                    try {
                        const completion = await llmService.generate({
                            userPrompt: prompt,
                            systemPrompt: "You are a JSON-only API. Return valid JSON.",
                            temperature: 0.2,
                            feature: "compliance_planning"
                        });

                        // Basic cleanup if markdown used
                        const jsonStr = completion.text.replace(/```json/g, '').replace(/```/g, '').trim();
                        planStructure = JSON.parse(jsonStr);
                    } catch (e) {
                        console.error("AI Generation Failed, falling back to template", e);
                        if (template) planStructure = template;
                        else throw e;
                    }
                }
            }

            if (!planStructure || !planStructure.phases) {
                throw new Error("Failed to generate valid plan structure.");
            }

            // 2. Persist to Database
            // check if framework exists in DB
            let frameworkRec = await db.query.complianceFrameworks.findFirst({
                where: eq(schema.complianceFrameworks.shortCode, frameworkCode)
            });

            if (!frameworkRec) {
                // Auto-seed framework
                const [newF] = await db.insert(schema.complianceFrameworks).values({
                    name: frameworkCode === 'ISO27001' ? 'ISO 27001:2022' : frameworkCode,
                    shortCode: frameworkCode,
                    type: 'framework'
                }).returning();
                frameworkRec = newF;
            }

            // Create Implementation Plan
            const [plan] = await db.insert(schema.implementationPlans).values({
                clientId: input.clientId,
                frameworkId: frameworkRec.id,
                title: `Implementation Plan: ${frameworkRec.name}`,
                description: `Automated plan generated for ${input.framework}`,
                status: 'planning',
                createdById: ctx.user?.id || 1
            }).returning();

            // Create Structure
            let taskCount = 0;
            for (const phase of planStructure.phases) {
                // Create Phase (if we strictly map phases, or valid existing ones)
                // For now, assuming standard naming. Maybe we seed ImplementationPhases properly later.
                // We will verify if phases exist or just use them as logical grouping for tasks.
                // The schema has `implementationPhases` table, let's use it.

                let phaseRec = await db.query.implementationPhases.findFirst({
                    where: and(
                        eq(schema.implementationPhases.frameworkId, frameworkRec!.id),
                        eq(schema.implementationPhases.name, phase.name)
                    )
                });

                if (!phaseRec) {
                    const [newP] = await db.insert(schema.implementationPhases).values({
                        frameworkId: frameworkRec.id,
                        name: phase.name,
                        order: phase.order || 0,
                        description: phase.description
                    }).returning();
                    phaseRec = newP;
                }

                // Create Tasks
                if (phase.tasks && phase.tasks.length > 0) {
                    for (const t of phase.tasks) {
                        await db.insert(schema.implementationTasks).values({
                            implementationPlanId: plan.id,
                            title: t.title,
                            description: t.description,
                            status: 'todo',
                            pdca: phase.name, // Link to phase name string as legacy support
                            // We could add phaseId to tasks if schema allowed, but currently using pdca string
                            estimatedHours: t.estimatedHours || 0,
                            deliverables: t.deliverables,
                            priority: 'medium',
                            createdById: ctx.user?.id || 1
                        });
                        taskCount++;
                    }
                }
            }

            return { success: true, planId: plan.id, taskCount, framework: frameworkRec.name };
        })
    });
};
