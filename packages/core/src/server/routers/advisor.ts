
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    suggestTechnologies,
    generateImplementationPlan,
    explainMapping,
    askQuestion,
    generateVendorMitigationPlan,
    analyzeRisk,
    reindexKnowledgeBase,
    generateRiskMitigationPlan
} from '../../lib/advisor/service';
import { eq, sql, and } from "drizzle-orm";
import { getDb } from '../../db';
import * as schema from '../../schema';

// Helper to get guidance
async function getGuidance(input: { clientId: number, controlTitle: string, controlDescription: string, controlId: string }) {
    const dbConn = await getDb();
    const client = await dbConn.query.clients.findFirst({
        where: eq(schema.clients.id, input.clientId)
    });

    const contextPrompt = `
    You are an expert security engineer helping a startup implement compliance controls.
    
    Organization Context:
    - Name: ${client?.name}
    - Industry: ${client?.industry}
    - Description: ${client?.description || "Not provided"}
    - Size: ${client?.size || "Not provided"}
    
    The user needs to implement this control:
    - Control: ${input.controlTitle} (${input.controlId})
    - Requirement: ${input.controlDescription}
    
    Provide a concrete, real-world implementation guide.
    Structure your response in Markdown:
    
    ### Why this matters
    (2 sentences on the security/business value for a ${client?.industry} company)
    
    ### Implementation Steps
    (3-5 concrete steps. Be specific. If they are a software company, assume standard tools like GitHub, AWS, Vercel, etc. unless specified otherwise)
    
    ### Real-World Example
    (A concrete example of what "good" looks like. e.g., a screenshot description, a config snippet, or a process description)
    `;

    // Use the existing askQuestion logic but force the prompt
    // We import LLM service directly here to bypass the conversation history logic of askQuestion if needed,
    // or just reuse askQuestion if it's easier. Reusing askQuestion logic via direct service call is cleaner.
    const { LLMService } = await import('../../lib/llm/service');
    const llm = new LLMService();
    
    try {
        const response = await llm.generate({
            userPrompt: contextPrompt,
            temperature: 0.3,
        });

        return { guidance: response.text };
    } catch (error: any) {
        console.error("LLM Generation Failed:", error);
        // Fallback or rethrow with more detail
        throw new Error(`LLM Error: ${error.message || 'Unknown error'}`);
    }
}

export function createAdvisorRouter(t: any, protectedProcedure: any) {
    return t.router({
        getImplementationGuidance: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                controlId: z.string(),
                controlTitle: z.string(),
                controlDescription: z.string()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    return await getGuidance(input);
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate guidance: ${error.message}`,
                    });
                }
            }),
            
        analyzeRisk: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                threat: z.string(),
                vulnerability: z.string(),
                assets: z.array(z.string())
            }))
            .mutation(async ({ input }: any) => {
                try {
                    return await analyzeRisk(input);
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to analyze risk: ${error.message}`,
                    });
                }
            }),

        suggestTechnologies: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                controlId: z.number(),
                vendorPreference: z.string().optional(),
                budgetConstraint: z.enum(['low', 'medium', 'high']).optional()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await suggestTechnologies({
                        clientId: input.clientId,
                        controlId: input.controlId,
                        vendorPreference: input.vendorPreference,
                        budgetConstraint: input.budgetConstraint,
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to suggest technologies: ${error.message}`,
                    });
                }
            }),

        implementationPlan: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                controlId: z.number(),
                selectedTech: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await generateImplementationPlan({
                        clientId: input.clientId,
                        controlId: input.controlId,
                        selectedTech: input.selectedTech,
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate implementation plan: ${error.message}`,
                    });
                }
            }),

        explainMapping: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                regulationId: z.string(),
                articleId: z.string()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await explainMapping({
                        clientId: input.clientId,
                        regulationId: input.regulationId,
                        articleId: input.articleId,
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to explain mapping: ${error.message}`,
                    });
                }
            }),

        askQuestion: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                question: z.string(),
                context: z.object({
                    type: z.enum(['control', 'policy', 'evidence', 'regulation', 'risk', 'vendor', 'gapanalysis', 'page']),
                    id: z.string(),
                    data: z.any().optional()
                }).nullish(),
                conversationHistory: z.array(z.object({
                    role: z.enum(['user', 'assistant']),
                    content: z.string()
                })).optional()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await askQuestion({
                        clientId: input.clientId,
                        question: input.question,
                        context: input.context,
                        conversationHistory: input.conversationHistory,
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to answer question: ${error.message}`,
                    });
                }
            }),

        vendorMitigationPlan: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                vendorId: z.number(),
                scanId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await generateVendorMitigationPlan({
                        clientId: input.clientId,
                        vendorId: input.vendorId,
                        scanId: input.scanId,
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate vendor mitigation plan: ${error.message}`,
                    });
                }
            }),

        generateRiskMitigationPlan: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                riskTitle: z.string(),
                riskDescription: z.string(),
                riskContext: z.string().optional(),
                currentMitigations: z.array(z.string()).optional()
            }))
            .mutation(async ({ input }: any) => {
                try {
                    const result = await generateRiskMitigationPlan({
                        clientId: input.clientId,
                        riskTitle: input.riskTitle,
                        riskDescription: input.riskDescription,
                        riskContext: input.riskContext,
                        currentMitigations: input.currentMitigations
                    });
                    return result;
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate risk mitigation plan: ${error.message}`,
                    });
                }
            }),

        generateBcpContent: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                planId: z.number(),
                sectionKey: z.enum(['intro', 'scope', 'assumptions', 'activation', 'roles', 'strategies', 'scenarios', 'exercises']),
                context: z.string().optional(),
                mode: z.enum(['draft', 'improve', 'expand'])
            }))
            .mutation(async ({ input }: any) => {
                const { generateBcpContent } = await import('../../lib/advisor/service');
                try {
                    return await generateBcpContent(input);
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate BCP content: ${error.message}`,
                    });
                }
            }),

        reindexContent: protectedProcedure
            .input(z.object({
                clientId: z.number().optional(),
                type: z.enum(['all', 'policies', 'evidence', 'knowledge_base', 'risks']).default('all')
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { IndexingService } = await import('../../lib/advisor/indexing');

                let stats = {
                    policies: 0,
                    evidence: 0,
                    knowledge_base: 0,
                    risks: 0,
                    errors: 0
                };

                // Index Policies
                if (input.type === 'all' || input.type === 'policies') {
                    const policies = input.clientId
                        ? await dbConn.query.clientPolicies.findMany({ where: eq(schema.clientPolicies.clientId, input.clientId) })
                        : await dbConn.query.clientPolicies.findMany(); // Admin only really

                    for (const p of policies) {
                        if (!p.content) continue;
                        try {
                            await IndexingService.indexDocument(
                                p.clientId,
                                'policy',
                                p.id.toString(),
                                {
                                    title: p.name,
                                    content: p.content,
                                    updatedAt: p.updatedAt?.toISOString() || new Date().toISOString()
                                },
                                {
                                    title: p.name,
                                    url: `/clients/${p.clientId}/policies/${p.id}`
                                }
                            );
                            stats.policies++;
                        } catch (err) {
                            console.error(`Failed to index policy ${p.id}`, err);
                            stats.errors++;
                        }
                    }
                }

                // Index Evidence
                if (input.type === 'all' || input.type === 'evidence') {
                    try {
                        const evidenceItems = input.clientId
                            ? await dbConn.select().from(schema.evidence).where(eq(schema.evidence.clientId, input.clientId))
                            : await dbConn.select().from(schema.evidence);

                        for (const e of evidenceItems) {
                            const content = (e as any).summary || (e as any).description || (e as any).extractedText;

                            if (!content) continue;

                            try {
                                await IndexingService.indexDocument(
                                    e.clientId,
                                    'evidence',
                                    e.id.toString(),
                                    content,
                                    {
                                        filename: (e as any).filename,
                                        url: (e as any).url
                                    }
                                );
                                stats.evidence++;
                            } catch (err) {
                                console.error(`Failed to index evidence ${e.id}`, err);
                                stats.errors++;
                            }
                        }
                    } catch (e) {
                        console.warn("Evidence indexing skipped (table or fields mismatch)", e);
                    }
                }

                // Index Knowledge Base
                if (input.type === 'all' || input.type === 'knowledge_base') {
                    try {
                        const kbEntries = input.clientId
                            ? await dbConn.select().from(schema.knowledgeBaseEntries).where(eq(schema.knowledgeBaseEntries.clientId, input.clientId))
                            : await dbConn.select().from(schema.knowledgeBaseEntries);

                        for (const entry of kbEntries) {
                            if (!entry.question || !entry.answer) continue;

                            // Format content as Q&A pair for better semantic search
                            const content = `Question: ${entry.question}\nAnswer: ${entry.answer}\nComments: ${entry.comments || ''}`;

                            try {
                                await IndexingService.indexDocument(
                                    entry.clientId,
                                    'knowledge_base',
                                    entry.id.toString(),
                                    content,
                                    {
                                        question: entry.question,
                                        answer: entry.answer,
                                        updatedAt: entry.updatedAt?.toISOString() || new Date().toISOString()
                                    }
                                );
                                stats.knowledge_base++;
                            } catch (err) {
                                console.error(`Failed to index KB entry ${entry.id}`, err);
                                stats.errors++;
                            }
                        }
                    } catch (e) {
                        console.error("Knowledge Base indexing failed", e);
                        stats.errors++;
                    }
                }

                // Index Risks
                if (input.type === 'all' || input.type === 'risks') {
                    try {
                        const assessments = input.clientId
                            ? await dbConn.select().from(schema.riskAssessments).where(eq(schema.riskAssessments.clientId, input.clientId))
                            : await dbConn.select().from(schema.riskAssessments);

                        for (const r of assessments) {
                            const content = `Risk: ${r.title}\nID: ${r.assessmentId}\nDescription: ${r.threatDescription || ''}\nVulnerability: ${r.vulnerabilityDescription || ''}\nInherent Risk: ${r.inherentRisk}\nResidual Risk: ${r.residualRisk}\nStatus: ${r.status}`;
                            try {
                                await IndexingService.indexDocument(
                                    r.clientId,
                                    'risk',
                                    r.id.toString(),
                                    {
                                        title: r.title,
                                        content: content,
                                        updatedAt: r.updatedAt?.toISOString() || new Date().toISOString()
                                    },
                                    {
                                        title: r.title,
                                        inherentRisk: r.inherentRisk,
                                        status: r.status
                                    }
                                );
                                stats.risks++;
                            } catch (err) {
                                console.error(`Failed to index risk ${r.id}`, err);
                                stats.errors++;
                            }
                        }
                    } catch (e) {
                        console.error("Risk indexing failed", e);
                        stats.errors++;
                    }
                }

                return { success: true, stats };
            }),

        getOwaspIntelligence: protectedProcedure
            .input(z.object({
                tags: z.array(z.string()),
                limit: z.number().default(10)
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                try {
                    const requirements = await db.select().from(schema.frameworkRequirements);

                    const filtered = requirements.filter((r: any) => {
                        const rTags = r.mappingTags as string[] | null;
                        if (!rTags || !Array.isArray(rTags)) return false;
                        return input.tags.some((tag: string) => rTags.includes(tag));
                    });

                    // Sort by how many tags match (simple relevance)
                    const sorted = filtered.sort((a: any, b: any) => {
                        const aMatches = (a.mappingTags as string[]).filter((t: string) => input.tags.includes(t)).length;
                        const bMatches = (b.mappingTags as string[]).filter((t: string) => input.tags.includes(t)).length;
                        return bMatches - aMatches;
                    });

                    return sorted.slice(0, input.limit);
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to fetch OWASP intelligence: ${error.message}`,
                    });
                }
            }),

        // Health check for RAG embeddings
        ragHealth: protectedProcedure
            .query(async () => {
                const dbConn = await getDb();
                try {
                    const results = await dbConn.execute(sql`
                        SELECT 
                            doc_type,
                            COUNT(*) as total,
                            COUNT(embedding_vector) as with_vector,
                            COUNT(*) - COUNT(embedding_vector) as legacy_only
                        FROM embeddings
                        GROUP BY doc_type
                        ORDER BY doc_type
                    `);
                    return {
                        success: true,
                        stats: results.rows || results,
                    };
                } catch (error: any) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to get RAG health: ${error.message}`,
                    });
                }
            })
    });
}
