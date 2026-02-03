
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
    suggestTechnologies,
    generateImplementationPlan,
    explainMapping,
    askQuestion,
    generateVendorMitigationPlan,
    analyzeRisk,
    reindexKnowledgeBase
} from '../../lib/advisor/service';
import { eq, sql, and } from "drizzle-orm";
import { getDb } from '../../db';
import * as schema from '../../schema';

export function createAdvisorRouter(t: any, protectedProcedure: any) {
    return t.router({
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
