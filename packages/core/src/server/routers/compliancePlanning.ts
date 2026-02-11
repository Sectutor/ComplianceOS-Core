
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
            try {
                const db = await getDb();
                const frameworkCode = (input.framework || '').toUpperCase();
                let planStructure: any = null;

                const template = (SYSTEM_TEMPLATES as any)[frameworkCode];
                if (!input.useAi && template) {
                    planStructure = template;
                } else {
                    const promptTemplate = (PLANNING_PROMPTS as any)[frameworkCode];
                    if (!promptTemplate) {
                        if (template) {
                            planStructure = template;
                        } else {
                            throw new Error(`Unsupported framework code: ${frameworkCode}`);
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
                            const jsonStr = completion.text.replace(/```json/g, '').replace(/```/g, '').trim();
                            planStructure = JSON.parse(jsonStr);
                        } catch (e: any) {
                            if (template) {
                                console.warn("[Planning] AI generation failed, using system template fallback:", e?.message || e);
                                planStructure = template;
                            } else {
                                throw new Error("AI plan generation failed and no system template available");
                            }
                        }
                    }
                }

                if (!planStructure || !Array.isArray(planStructure.phases)) {
                    throw new Error("Invalid plan structure: missing phases array");
                }

                let frameworkRec = await db.query.complianceFrameworks.findFirst({
                    where: eq(schema.complianceFrameworks.shortCode, frameworkCode)
                });

                if (!frameworkRec) {
                    const [newF] = await db.insert(schema.complianceFrameworks).values({
                        name: frameworkCode === 'ISO27001' ? 'ISO 27001:2022' : frameworkCode,
                        shortCode: frameworkCode,
                        type: 'framework'
                    }).returning();
                    frameworkRec = newF;
                }

                const [plan] = await db.insert(schema.implementationPlans).values({
                    clientId: input.clientId,
                    frameworkId: frameworkRec.id,
                    title: `Implementation Plan: ${frameworkRec.name}`,
                    description: `Automated plan generated for ${input.framework}`,
                    status: 'planning',
                    createdById: ctx.user?.id || 1
                }).returning();

                let taskCount = 0;
                for (const phase of planStructure.phases) {
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

                    if (Array.isArray(phase.tasks) && phase.tasks.length > 0) {
                        for (const t of phase.tasks) {
                            await db.insert(schema.implementationTasks).values({
                                implementationPlanId: plan.id,
                                title: t.title,
                                description: t.description,
                                status: 'todo',
                                pdca: phase.name,
                                estimatedHours: t.estimatedHours || 0,
                                deliverables: Array.isArray(t.deliverables) ? t.deliverables : undefined,
                                priority: 'medium',
                                createdById: ctx.user?.id || 1
                            });
                            taskCount++;
                        }
                    }
                }

                return { success: true, planId: plan.id, taskCount, framework: frameworkRec.name };
            } catch (err: any) {
                console.error("[Planning] generatePlan failed:", err);
                throw new Error(err?.message || "Failed to generate plan");
            }
        })
    });
};
