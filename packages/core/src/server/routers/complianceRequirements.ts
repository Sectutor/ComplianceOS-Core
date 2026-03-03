import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, sql, ilike, or, inArray } from "drizzle-orm";
import { FRAMEWORK_SEEDS } from "./evidence";

// Framework evidence seed data (same as in evidence.ts)
const FRAMEWORK_EVIDENCE_SEEDS: Record<string, any[]> = FRAMEWORK_SEEDS;

export const createRequirementsRouter = (t: any, protectedProcedure: any, publicProcedure: any) => {
    return t.router({
        // Get list of all available frameworks with counts
        listFrameworks: protectedProcedure
            .input(z.object({
                clientId: z.number().optional()
            }).optional())
            .query(async ({ input, ctx }: any) => {
                const dbConn = await getDb();
                const targetClientId = input?.clientId || ctx.user?.clientId;

                // Get unique frameworks from controls
                const controlFrameworks = await dbConn.select({
                    framework: schema.controls.framework,
                    count: sql<number>`count(*)`
                })
                    .from(schema.controls)
                    .where(targetClientId ? eq(schema.controls.clientId, targetClientId) : undefined)
                    .groupBy(schema.controls.framework);

                // Also get frameworks from policy templates
                const policyTemplates = await dbConn.select({
                    templateId: schema.policyTemplates.templateId,
                    name: schema.policyTemplates.name,
                    frameworks: schema.policyTemplates.frameworks
                })
                    .from(schema.policyTemplates)
                    .where(eq(schema.policyTemplates.isPublic, true));

                // Build framework list with counts
                const frameworkMap = new Map<string, any>();

                // Add frameworks from controls
                for (const cf of controlFrameworks) {
                    const fwName = cf.framework;
                    if (fwName && !frameworkMap.has(fwName)) {
                        frameworkMap.set(fwName, {
                            id: fwName,
                            name: fwName,
                            controlCount: Number(cf.count),
                            policyCount: 0,
                            evidenceCount: 0,
                            hasEvidenceSeed: !!FRAMEWORK_EVIDENCE_SEEDS[fwName]
                        });
                    }
                }

                // Add policy counts
                for (const pt of policyTemplates) {
                    const fwList = pt.frameworks as string[] || [];
                    for (const fwName of fwList) {
                        if (frameworkMap.has(fwName)) {
                            const existing = frameworkMap.get(fwName);
                            existing.policyCount++;
                        } else {
                            frameworkMap.set(fwName, {
                                id: fwName,
                                name: fwName,
                                controlCount: 0,
                                policyCount: 1,
                                evidenceCount: 0,
                                hasEvidenceSeed: !!FRAMEWORK_EVIDENCE_SEEDS[fwName]
                            });
                        }
                    }
                }

                // Add evidence counts from seeds
                for (const [fwName, evidence] of Object.entries(FRAMEWORK_EVIDENCE_SEEDS)) {
                    if (frameworkMap.has(fwName)) {
                        const existing = frameworkMap.get(fwName);
                        existing.evidenceCount = evidence.length;
                    } else {
                        frameworkMap.set(fwName, {
                            id: fwName,
                            name: fwName,
                            controlCount: 0,
                            policyCount: 0,
                            evidenceCount: evidence.length,
                            hasEvidenceSeed: true
                        });
                    }
                }

                return Array.from(frameworkMap.values())
                    .filter(f => f.controlCount > 0 || f.policyCount > 0 || f.evidenceCount > 0)
                    .sort((a, b) => a.name.localeCompare(b.name));
            }),

        // Get full requirements for a specific framework
        getFrameworkRequirements: protectedProcedure
            .input(z.object({
                framework: z.string(),
                clientId: z.number().optional()
            }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await getDb();
                const targetClientId = input.clientId || ctx.user?.clientId;
                const framework = input.framework;
                const normalizeFramework = (fw: string) => fw.toLowerCase().replace(/[^a-z0-9]/g, '');
                const fwNorm = normalizeFramework(framework);

                // 1. Get Controls for the framework
                const controls = await dbConn.select({
                    id: schema.controls.id,
                    controlId: schema.controls.controlId,
                    name: schema.controls.name,
                    description: schema.controls.description,
                    category: schema.controls.category,
                    framework: schema.controls.framework,
                    implementationGuidance: schema.controls.implementationGuidance
                })
                    .from(schema.controls)
                    .where(and(
                        targetClientId ? eq(schema.controls.clientId, targetClientId) : undefined,
                        or(
                            eq(schema.controls.framework, framework),
                            ilike(schema.controls.framework, `%${framework}%`),
                            // Also try with space instead of dash
                            ilike(schema.controls.framework, `%${framework.replace(/-/g, ' ')}%`)
                        )
                    ));

                // 2. Get Policy Templates for the framework
                const policyTemplates = await dbConn.select({
                    id: schema.policyTemplates.id,
                    templateId: schema.policyTemplates.templateId,
                    name: schema.policyTemplates.name,
                    sections: schema.policyTemplates.sections,
                    frameworks: schema.policyTemplates.frameworks,
                    tailoringQuestions: schema.policyTemplates.tailoringQuestions,
                    description: schema.policyTemplates.content
                })
                    .from(schema.policyTemplates)
                    .where(eq(schema.policyTemplates.isPublic, true));

                const filteredPolicies = policyTemplates.filter((pt: any) => {
                    const fwList = pt.frameworks as string[] || [];
                    return fwList.some(fw => {
                        const ptFwNorm = normalizeFramework(fw);
                        return ptFwNorm.includes(fwNorm) || fwNorm.includes(ptFwNorm);
                    });
                });

                // 3. Get Evidence Requirements for the framework
                let evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS[framework];

                // If not found by exact ID, try by normalized name or common variations
                if (!evidenceRequirements) {
                    const fwKeys = Object.keys(FRAMEWORK_EVIDENCE_SEEDS);
                    const matchingKey = fwKeys.find(key => {
                        const keyNorm = normalizeFramework(key);
                        return fwNorm.includes(keyNorm) || keyNorm.includes(fwNorm);
                    });

                    if (matchingKey) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS[matchingKey];
                    } else if (fwNorm.includes('iso')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['ISO 27001'];
                    } else if (fwNorm.includes('soc')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['SOC 2'];
                    } else if (fwNorm.includes('pci')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['PCI DSS'];
                    } else if (fwNorm.includes('hipaa')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['HIPAA'];
                    } else if (fwNorm.includes('gdpr')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['GDPR'];
                    } else {
                        evidenceRequirements = [];
                    }
                }

                // 4. Group controls by category
                const controlsByCategory: Record<string, typeof controls> = {};
                for (const control of controls) {
                    const category = control.category || 'Uncategorized';
                    if (!controlsByCategory[category]) {
                        controlsByCategory[category] = [];
                    }
                    controlsByCategory[category].push(control);
                }

                return {
                    framework,
                    summary: {
                        totalControls: controls.length,
                        totalPolicies: filteredPolicies.length,
                        totalEvidence: evidenceRequirements.length,
                        categories: Object.keys(controlsByCategory).length
                    },
                    controls: controlsByCategory,
                    policies: filteredPolicies,
                    evidence: evidenceRequirements
                };
            }),

        // Get a simplified requirements summary for dropdown selection
        getFrameworkSummary: protectedProcedure
            .input(z.object({
                framework: z.string()
            }))
            .query(async ({ input }: any) => {
                const framework = input.framework;
                const normalizeFramework = (fw: string) => fw.toLowerCase().replace(/[^a-z0-9]/g, '');
                const fwNorm = normalizeFramework(framework);

                // Get evidence requirements from seeds
                let evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS[framework];

                if (!evidenceRequirements) {
                    const fwKeys = Object.keys(FRAMEWORK_EVIDENCE_SEEDS);
                    const matchingKey = fwKeys.find(key => {
                        const keyNorm = normalizeFramework(key);
                        return fwNorm.includes(keyNorm) || keyNorm.includes(fwNorm);
                    });

                    if (matchingKey) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS[matchingKey];
                    } else if (fwNorm.includes('iso')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['ISO 27001'];
                    } else if (fwNorm.includes('soc')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['SOC 2'];
                    } else if (fwNorm.includes('pci')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['PCI DSS'];
                    } else if (fwNorm.includes('hipaa')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['HIPAA'];
                    } else if (fwNorm.includes('gdpr')) {
                        evidenceRequirements = FRAMEWORK_EVIDENCE_SEEDS['GDPR'];
                    } else {
                        evidenceRequirements = [];
                    }
                }

                return {
                    framework,
                    evidenceCount: evidenceRequirements.length,
                    evidenceRequirements: evidenceRequirements.slice(0, 5), // Preview first 5
                };
            }),

        // Search controls across frameworks
        searchControls: protectedProcedure
            .input(z.object({
                query: z.string(),
                framework: z.string().optional(),
                limit: z.number().optional().default(20)
            }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();

                const conditions = [
                    or(
                        ilike(schema.controls.name, `%${input.query}%`),
                        ilike(schema.controls.description, `%${input.query}%`),
                        ilike(schema.controls.controlId, `%${input.query}%`)
                    )
                ];

                if (input.framework) {
                    conditions.push(eq(schema.controls.framework, input.framework));
                }

                const controls = await dbConn.select({
                    id: schema.controls.id,
                    controlId: schema.controls.controlId,
                    name: schema.controls.name,
                    description: schema.controls.description,
                    category: schema.controls.category,
                    framework: schema.controls.framework
                })
                    .from(schema.controls)
                    .where(and(...conditions))
                    .limit(input.limit);

                return controls;
            })
    });
};

