
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../../db";
import { threatModels, threatModelComponents, riskScenarios, devProjects, riskTreatments, threatModelDataFlows, riskAssessments } from "../../schema";
import { eq, and, desc, or } from "drizzle-orm";
import { logActivity } from "../../lib/audit";

import { calculateResidualScore, scoreToRiskLevel } from "../../lib/riskCalculations";

// Basic STRIDE mapping logic
const STRIDE_MAPPING: Record<string, any[]> = {
    'Web Client': [
        {
            title: 'Cross-Site Scripting (XSS)',
            category: 'Tampering',
            description: 'Malicious scripts injected into trusted websites.',
            mitigations: ['Output encoding', 'Content Security Policy (CSP)', 'OWASP Top 10: A03:2021']
        },
        {
            title: 'Cross-Site Request Forgery (CSRF)',
            category: 'Elevation of Privilege',
            description: 'Unauthorized commands transmitted from a user that the web application trusts.',
            mitigations: ['Anti-CSRF Tokens', 'SameSite Cookie Attribute', 'OWASP Top 10: A01:2021']
        },
    ],
    'API': [
        {
            title: 'Broken Object Level Authorization',
            category: 'Information Disclosure',
            description: 'API does not correctly validate user permissions involves accessing resources.',
            mitigations: ['Implement authorization checks for every object access', 'ASVS V4: Access Control']
        },
        {
            title: 'Injection Attacks (SQL/NoSQL)',
            category: 'Tampering',
            description: 'Untrusted data is sent to an interpreter as part of a command or query.',
            mitigations: ['Parameterized queries', 'Stored procedures', 'OWASP Top 10: A03:2021']
        },
        {
            title: 'Denial of Service (DoS)',
            category: 'Denial of Service',
            description: 'API resources exhausted by massive traffic.',
            mitigations: ['Rate limiting', 'Auto-scaling', 'Resource quotas']
        },
    ],
    'Database': [
        {
            title: 'SQL Injection',
            category: 'Tampering',
            description: 'Insertion of malicious SQL statements.',
            mitigations: ['Use ORM/Query Builders', 'Parameterized queries', 'Principle of Least Privilege for DB user']
        },
        {
            title: 'Weak Encryption at Rest',
            category: 'Information Disclosure',
            description: 'Sensitive data stored without adequate encryption.',
            mitigations: ['AES-256 Encryption', 'Client-side encryption', 'ASVS V6: Stored Data Cryptography']
        },
    ],
    'External Service': [
        {
            title: 'Insecure Direct Object References',
            category: 'Information Disclosure',
            description: 'Reference to internal implementation object context.',
            mitigations: ['Indirect Reference Maps', 'OWASP Top 10: A04:2021']
        },
        {
            title: 'Man-in-the-Middle',
            category: 'Tampering',
            description: 'Communication intercepted between services.',
            mitigations: ['Enforce Mutual TLS', 'Certificate Pinning', 'ASVS V9: Communications']
        }
    ],
    'Authentication Service': [
        {
            title: 'Spoofing Identity',
            category: 'Spoofing',
            description: 'Attacker successfully identifies as another user.',
            mitigations: ['Multi-Factor Authentication (MFA)', 'Secure Identity Providers (Auth0, Clerk)', 'ASVS V2: Authentication']
        },
        {
            title: 'Brute Force Attack',
            category: 'Repudiation',
            description: 'Systematic checking of all possible keys or passwords.',
            mitigations: ['Account Lockout / Throttling', 'CAPTCHA', 'Monitor for failed logins']
        }
    ],
    'Process': [
        {
            title: 'Elevation of Privilege',
            category: 'Elevation of Privilege',
            description: 'Process accepts input that modifies control flow or executes arbitrary code.',
            mitigations: ['Input Validation', 'Least Privilege Execution', 'Sandboxing']
        },
        {
            title: 'Denial of Service',
            category: 'Denial of Service',
            description: 'Process resource exhaustion via malformed requests.',
            mitigations: ['Rate Limiting', 'Resource Quotas', 'Timeouts']
        }
    ],
    'Store': [
        {
            title: 'Insecure Data Storage',
            category: 'Information Disclosure',
            description: 'Data store does not use encryption at rest',
            mitigations: ['Encrypt Disk/Volume', 'Field Level Encryption']
        },
        {
            title: 'Integrity Violation',
            category: 'Tampering',
            description: 'Unauthorized modification of stored data.',
            mitigations: ['File Integrity Monitoring (FIM)', 'Write-Ahead Logging', 'Strict ACLs']
        }
    ],
    'Actor': [
        {
            title: 'Spoofing User',
            category: 'Spoofing',
            description: 'Malicious actor impersonating a legitimate user.',
            mitigations: ['Strong Authentication', 'Device Fingerprinting']
        }
    ]
};


export const createThreatModelsRouter = (t: any, clientProcedure: any) => {
    return t.router({
        create: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
                name: z.string(),
                methodology: z.string().default('STRIDE'),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [newModel] = await db.insert(threatModels)
                    .values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        name: input.name,
                        methodology: input.methodology,
                        status: 'active'
                    } as any)
                    .returning();

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "create",
                    entityType: "threat_model",
                    entityId: newModel.id,
                    details: { name: newModel.name }
                });

                return newModel;
            }),

        get: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [model] = await db.select().from(threatModels).where(and(eq(threatModels.id, input.id), eq(threatModels.clientId, input.clientId)));

                if (!model) throw new TRPCError({ code: 'NOT_FOUND', message: 'Threat model not found' });

                const components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.id));
                const flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.id));

                // Fetch identified risks and their mitigations
                const risks = await db.select().from(riskScenarios).where(eq(riskScenarios.threatModelId, input.id));
                const risksWithMitigations = await Promise.all(risks.map(async (risk) => {
                    const treatments = await db.select().from(riskTreatments).where(eq(riskTreatments.riskScenarioId, risk.id));
                    return {
                        ...risk,
                        mitigations: treatments.map(t => t.strategy).filter(Boolean) as string[]
                    };
                }));

                return { ...model, components, flows, risks: risksWithMitigations };
            }),

        addComponent: clientProcedure
            .input(z.object({
                threatModelId: z.number(),
                name: z.string(),
                type: z.string(),
                description: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                const [component] = await db.insert(threatModelComponents)
                    .values(input as any)
                    .returning();
                return component;
            }),

        removeComponent: clientProcedure
            .input(z.object({
                id: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(threatModelComponents).where(eq(threatModelComponents.id, input.id));
                // Also delete related flows
                await db.delete(threatModelDataFlows).where(or(
                    eq(threatModelDataFlows.sourceComponentId, input.id),
                    eq(threatModelDataFlows.targetComponentId, input.id)
                ));
                return { success: true };
            }),

        updateComponentPosition: clientProcedure
            .input(z.object({
                id: z.number(),
                x: z.number(),
                y: z.number()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.update(threatModelComponents)
                    .set({ x: input.x, y: input.y })
                    .where(eq(threatModelComponents.id, input.id));
                return { success: true };
            }),

        saveFlow: clientProcedure
            .input(z.object({
                threatModelId: z.number(),
                sourceComponentId: z.number(),
                targetComponentId: z.number(),
                protocol: z.string().optional(),
                description: z.string().optional(),
                isEncrypted: z.boolean().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                const [flow] = await db.insert(threatModelDataFlows)
                    .values(input as any)
                    .returning();
                return flow;
            }),

        updateFlow: clientProcedure
            .input(z.object({
                id: z.number(),
                protocol: z.string().optional(),
                description: z.string().optional(),
                isEncrypted: z.boolean().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.update(threatModelDataFlows)
                    .set({
                        protocol: input.protocol,
                        description: input.description,
                        isEncrypted: input.isEncrypted
                    })
                    .where(eq(threatModelDataFlows.id, input.id));
                return { success: true };
            }),


        removeFlow: clientProcedure
            .input(z.object({
                id: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                await db.delete(threatModelDataFlows).where(eq(threatModelDataFlows.id, input.id));
                return { success: true };
            }),

        generateRisks: clientProcedure
            .input(z.object({
                threatModelId: z.number(),
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();
                const components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.threatModelId));
                const flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.threatModelId));

                const suggestedRisks = [];
                const seenTitles = new Set(); // Avoid dupes

                for (const comp of components) {
                    const rules = STRIDE_MAPPING[comp.type] || [];
                    for (const rule of rules) {
                        const uniqueKey = `${comp.name}-${rule.title}`;
                        if (!seenTitles.has(uniqueKey)) {
                            suggestedRisks.push({
                                title: `${rule.title} on ${comp.name}`,
                                description: `${rule.description} (Category: ${rule.category}, Component: ${comp.type})`,
                                category: rule.category,
                                componentName: comp.name,
                                componentType: comp.type,
                                source: 'Automated STRIDE Analysis',
                                mitigations: rule.mitigations || []
                            });
                            seenTitles.add(uniqueKey);
                        }
                    }
                }

                // Analyze Flows (Data in Transit)
                for (const flow of flows) {
                    const source = components.find(c => c.id === flow.sourceComponentId)?.name || 'Unknown';
                    const target = components.find(c => c.id === flow.targetComponentId)?.name || 'Unknown';

                    if (!flow.isEncrypted) {
                        const uniqueKey = `Flow-Unencrypted-${flow.id}`;
                        if (!seenTitles.has(uniqueKey)) {
                            suggestedRisks.push({
                                title: `Unencrypted Data Flow (${source} -> ${target})`,
                                description: `Data transmitted over ${flow.protocol} without encryption. Sensitive data may be intercepted.`,
                                category: 'Information Disclosure',
                                componentName: `${source} -> ${target}`,
                                componentType: 'Data Flow',
                                source: 'Automated Flow Analysis',
                                mitigations: ['Implement TLS 1.2+', 'Encrypt payload', 'ASVS V9: Communications Security']
                            });
                            seenTitles.add(uniqueKey);
                        }
                    }

                    if (['HTTP', 'FTP', 'Telnet'].includes(flow.protocol?.toUpperCase() || '')) {
                        const uniqueKey = `Flow-Insecure-${flow.id}`;
                        if (!seenTitles.has(uniqueKey)) {
                            suggestedRisks.push({
                                title: `Insecure Protocol Usage (${flow.protocol})`,
                                description: `${flow.protocol} is known to be insecure and should be replaced.`,
                                category: 'Tampering',
                                componentName: `${source} -> ${target}`,
                                componentType: 'Data Flow',
                                source: 'Automated Flow Analysis',
                                mitigations: ['Upgrade to HTTPS/SFTP/SSH', 'Disable insecure protocols']
                            });
                            seenTitles.add(uniqueKey);
                        }
                    }
                }

                return suggestedRisks;
            }),

        commitRisks: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
                threatModelId: z.number(),
                risks: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                    likelihood: z.number().min(1).max(5),
                    impact: z.number().min(1).max(5),
                    selectedMitigations: z.array(z.string()).optional()
                }))
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const results = [];

                for (const risk of input.risks) {
                    const inherentScore = risk.likelihood * risk.impact;
                    const inherentRisk = scoreToRiskLevel(inherentScore);

                    // 1. Create Risk Scenario (Project Level)
                    const [savedScenario] = await db.insert(riskScenarios).values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        threatModelId: input.threatModelId,
                        assessmentType: 'project',
                        title: risk.title,
                        description: risk.description,
                        likelihood: String(risk.likelihood),
                        impact: String(risk.impact),
                        inherentScore,
                        inherentRisk,
                        status: 'draft',
                        updatedAt: new Date()
                    } as any).returning();

                    // 2. Create Global Risk Assessment (Enterprise Level - "The Register")
                    const [savedAssessment] = await db.insert(riskAssessments).values({
                        clientId: input.clientId,
                        assessmentId: `TM-${input.threatModelId}-${Date.now()}`, // Unique ID for TM risks
                        title: risk.title,
                        threatDescription: risk.description, // Map description here
                        likelihood: String(risk.likelihood),
                        impact: String(risk.impact),
                        inherentScore,
                        inherentRisk,
                        riskId: savedScenario.id, // Link back to scenario
                        status: 'draft',
                        contextSnapshot: {
                            source: 'Threat Model',
                            projectId: input.devProjectId,
                            threatModelId: input.threatModelId
                        },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } as any).returning();

                    // 3. Add Mitigations as Treatments (Linked to BOTH)
                    if (risk.selectedMitigations && risk.selectedMitigations.length > 0) {
                        for (const mitigation of risk.selectedMitigations) {
                            await db.insert(riskTreatments).values({
                                clientId: input.clientId,
                                riskScenarioId: savedScenario.id,
                                riskAssessmentId: savedAssessment.id, // Critical for global dashboard visibility
                                treatmentType: 'mitigate',
                                strategy: mitigation,
                                status: 'planned',
                                updatedAt: new Date()
                            } as any);
                        }
                    }

                    results.push(savedAssessment);
                }

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "update",
                    entityType: "threat_model",
                    entityId: input.threatModelId,
                    details: { action: "committed_risks", count: results.length }
                });

                return results;
            }),

        exportToThreatDragon: clientProcedure
            .input(z.object({
                id: z.number(),
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const [model] = await db.select().from(threatModels).where(and(eq(threatModels.id, input.id), eq(threatModels.clientId, input.clientId)));
                if (!model) throw new TRPCError({ code: 'NOT_FOUND', message: 'Model not found' });

                const components = await db.select().from(threatModelComponents).where(eq(threatModelComponents.threatModelId, input.id));
                const flows = await db.select().from(threatModelDataFlows).where(eq(threatModelDataFlows.threatModelId, input.id));

                const cells = [];

                // Map Components
                components.forEach((c: any) => {
                    cells.push({
                        id: String(c.id),
                        shape: c.type === 'Actor' ? 'actor' : c.type === 'Store' ? 'store' : 'process', // Simple mapping
                        data: {
                            name: c.name,
                            type: c.type,
                            description: c.description
                        },
                        position: { x: c.x, y: c.y },
                        size: { width: 160, height: 80 },
                        zIndex: 10
                    });
                });

                // Map Flows
                flows.forEach((f: any) => {
                    cells.push({
                        id: String(f.id),
                        shape: 'flow',
                        source: { cell: String(f.sourceComponentId) },
                        target: { cell: String(f.targetComponentId) },
                        data: {
                            name: f.protocol || 'Flow',
                            protocol: f.protocol,
                            isEncrypted: f.isEncrypted
                        },
                        zIndex: 20
                    });
                });

                return {
                    summary: {
                        title: model.name,
                        owner: "ComplianceOS User",
                        description: "Exported from ComplianceOS"
                    },
                    detail: {
                        diagrams: [
                            {
                                title: "Main Diagram",
                                cells: cells
                            }
                        ]
                    }
                };
            }),

        importFromThreatDragon: clientProcedure
            .input(z.object({
                clientId: z.number(),
                devProjectId: z.number(),
                json: z.string() // The raw JSON string
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                let data;
                try {
                    data = JSON.parse(input.json);
                } catch (e) {
                    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid JSON' });
                }

                const modelName = data.summary?.title || "Imported Threat Dragon Model";

                // Create Model
                const [newModel] = await db.insert(threatModels)
                    .values({
                        clientId: input.clientId,
                        devProjectId: input.devProjectId,
                        name: modelName,
                        methodology: 'STRIDE',
                        status: 'active'
                    } as any)
                    .returning();

                // Import Diagram (Assuming first diagram)
                const diagram = data.detail?.diagrams?.[0];
                if (!diagram) return newModel;

                const componentMap = new Map(); // Old ID -> New ID

                // 1. Import Components (Nodes)
                const nodes = diagram.cells.filter((c: any) => c.shape !== 'flow');
                for (const node of nodes) {
                    // Map TD shape to our Type
                    let type = 'Process';
                    if (node.shape === 'actor') type = 'Actor';
                    if (node.shape === 'store') type = 'Store';
                    // Fallback to name-based heuristic if shape is generic
                    if (node.data?.type) type = node.data.type;

                    const [comp] = await db.insert(threatModelComponents).values({
                        threatModelId: newModel.id,
                        name: node.data?.name || 'Unnamed',
                        type: type,
                        description: node.data?.description || '',
                        x: node.position?.x || 0,
                        y: node.position?.y || 0
                    } as any).returning();
                    componentMap.set(node.id, comp.id);
                }

                // 2. Import Flows (Edges)
                const edges = diagram.cells.filter((c: any) => c.shape === 'flow');
                for (const edge of edges) {
                    const sourceId = componentMap.get(edge.source?.cell);
                    const targetId = componentMap.get(edge.target?.cell);

                    if (sourceId && targetId) {
                        await db.insert(threatModelDataFlows).values({
                            threatModelId: newModel.id,
                            sourceComponentId: sourceId,
                            targetComponentId: targetId,
                            protocol: edge.data?.protocol || 'HTTP',
                            isEncrypted: edge.data?.isEncrypted || false,
                            description: edge.data?.name || ''
                        } as any);
                    }
                }

                await logActivity({
                    userId: ctx.user.id,
                    clientId: input.clientId,
                    action: "import",
                    entityType: "threat_model",
                    entityId: newModel.id,
                    details: { name: modelName, components: nodes.length }
                });

                return newModel;
            })
    });
};
