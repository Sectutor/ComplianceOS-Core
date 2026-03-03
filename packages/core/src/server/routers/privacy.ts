
import { z } from "zod";
import {
    assets,
    processDataFlows,
    dsarRequests,
    businessProcesses,
    employees,
    privacyAssessments,
    remediationTasks,
    InsertProcessDataFlow
} from "../../schema";
import { getDb } from "../../db";
import { eq, and, desc, count, sql, like } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createPrivacyRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // ==================== DATA INVENTORY ====================

        // Seed sample data inventory for demo purposes
        seedInventory: clientProcedure
            .mutation(async ({ ctx }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId;

                if (!clientId) {
                    throw new TRPCError({
                        code: "UNAUTHORIZED",
                        message: "Client ID required. Please ensure you are authenticated with a valid client."
                    });
                }

                const sampleAssets = [
                    {
                        clientId,
                        name: "Employee Records Database",
                        type: "Information",
                        category: "Database",
                        description: "HR database containing employee personal information",
                        owner: "HR Department",
                        criticality: "High",
                        status: "active" as const,
                        isPersonalData: true,
                        dataSensitivity: "High",
                        dataFormat: "Structured (SQL Database)",
                        location: "On-premise HR Server",
                    },
                    {
                        clientId,
                        name: "Customer Email List",
                        type: "Information",
                        category: "Data Store",
                        description: "Marketing database of customer email addresses",
                        owner: "Marketing Team",
                        criticality: "Medium",
                        status: "active" as const,
                        isPersonalData: true,
                        dataSensitivity: "Medium",
                        dataFormat: "Structured (CSV/Excel)",
                        location: "Cloud Storage (AWS)",
                    },
                    {
                        clientId,
                        name: "Patient Health Records",
                        type: "Information",
                        category: "Database",
                        description: "Medical records with patient health information",
                        owner: "Healthcare Operations",
                        criticality: "High",
                        status: "active" as const,
                        isPersonalData: true,
                        dataSensitivity: "High",
                        dataFormat: "Structured (EHR System)",
                        location: "HIPAA-compliant Cloud",
                    },
                    {
                        clientId,
                        name: "User Account Profiles",
                        type: "Information",
                        category: "Application",
                        description: "Application user profiles with login credentials",
                        owner: "IT Security",
                        criticality: "High",
                        status: "active" as const,
                        isPersonalData: true,
                        dataSensitivity: "Medium",
                        dataFormat: "Structured (NoSQL)",
                        location: "Production Database",
                    },
                    {
                        clientId,
                        name: "Financial Transaction Logs",
                        type: "Information",
                        category: "Database",
                        description: "Transaction history with payment details",
                        owner: "Finance Department",
                        criticality: "High",
                        status: "active" as const,
                        isPersonalData: true,
                        dataSensitivity: "High",
                        dataFormat: "Structured (SQL)",
                        location: "Finance Server",
                    },
                ];

                let created = 0;
                for (const asset of sampleAssets) {
                    try {
                        await db.insert(assets).values(asset);
                        created++;
                    } catch (e) {
                        console.log("Asset already exists or error:", e);
                    }
                }

                return { success: true, created };
            }),

        // List all assets marked as personal data
        getInventory: clientProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                console.log(`[PrivacyRouter] getInventory. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${clientId}`);

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                return await db
                    .select()
                    .from(assets)
                    .where(
                        and(
                            eq(assets.clientId, clientId),
                            eq(assets.isPersonalData, true)
                        )
                    )
                    .orderBy(desc(assets.updatedAt));
            }),

        // Create a new data asset
        createDataAsset: clientProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string().min(1, "Name is required"),
                type: z.string().optional(),
                category: z.string().optional(),
                description: z.string().optional(),
                owner: z.string().optional(),
                criticality: z.string().optional(),
                status: z.string().optional(),
                isPersonalData: z.boolean().default(true),
                dataSensitivity: z.string().optional(),
                dataFormat: z.string().optional(),
                location: z.string().optional(),
                dataOwner: z.string().optional(),
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input.clientId;

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                const [asset] = await db.insert(assets).values({
                    clientId,
                    name: input.name,
                    type: input.type || "Information",
                    category: input.category,
                    description: input.description,
                    owner: input.owner,
                    criticality: input.criticality || "Medium",
                    status: input.status || "active",
                    isPersonalData: input.isPersonalData,
                    dataSensitivity: input.dataSensitivity || "Medium",
                    dataFormat: input.dataFormat,
                    location: input.location,
                    dataOwner: input.dataOwner,
                }).returning();

                return asset;
            }),

        // Update a data asset
        updateDataAsset: clientProcedure
            .input(z.object({
                assetId: z.number(),
                name: z.string().optional(),
                type: z.string().optional(),
                category: z.string().optional(),
                description: z.string().optional(),
                owner: z.string().optional(),
                criticality: z.string().optional(),
                status: z.string().optional(),
                isPersonalData: z.boolean().optional(),
                dataSensitivity: z.string().optional(),
                dataFormat: z.string().optional(),
                location: z.string().optional(),
                dataOwner: z.string().optional(),
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();
                const { assetId, ...data } = input;

                const [asset] = await db.update(assets)
                    .set({ ...data, updatedAt: new Date() })
                    .where(eq(assets.id, assetId))
                    .returning();

                return asset;
            }),

        // Delete a data asset
        deleteDataAsset: clientProcedure
            .input(z.object({
                assetId: z.number(),
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();

                await db.delete(assets).where(eq(assets.id, input.assetId));

                return { success: true };
            }),
        // Update privacy specifics of an asset
        updateAssetPrivacy: clientProcedure
            .input(z.object({
                clientId: z.number(),
                assetId: z.number(),
                isPersonalData: z.boolean(),
                dataSensitivity: z.string().optional(),
                dataFormat: z.string().optional(),
                dataOwner: z.string().optional().nullable(),
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();

                // Verify ownership/access
                const existing = await db.query.assets.findFirst({
                    where: and(eq(assets.id, input.assetId), eq(assets.clientId, ctx.clientId))
                });

                if (!existing) {
                    throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
                }

                await db
                    .update(assets)
                    .set({
                        isPersonalData: input.isPersonalData,
                        dataSensitivity: input.dataSensitivity,
                        dataFormat: input.dataFormat,
                        dataOwner: input.dataOwner,
                        updatedAt: new Date(),
                    })
                    .where(eq(assets.id, input.assetId));

                return { success: true };
            }),

        // ==================== ROPA (Data Mapping) ====================

        // Get data flows for a specific process
        getProcessDataFlows: clientProcedure
            .input(z.object({ processId: z.number() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();

                // Verify process belongs to client
                const process = await db.query.businessProcesses.findFirst({
                    where: and(eq(businessProcesses.id, input.processId), eq(businessProcesses.clientId, ctx.clientId))
                });

                if (!process) throw new TRPCError({ code: "NOT_FOUND" });

                // Fetch flows with joined asset info if available
                const flows = await db
                    .select({
                        flow: processDataFlows,
                        assetName: assets.name,
                        assetType: assets.type
                    })
                    .from(processDataFlows)
                    .leftJoin(assets, eq(processDataFlows.assetId, assets.id))
                    .where(eq(processDataFlows.processId, input.processId));

                return flows;
            }),

        // Add a data flow to a process
        addProcessDataFlow: clientProcedure
            .input(z.object({
                clientId: z.number(),
                processId: z.number(),
                assetId: z.number().optional().nullable(),
                dataElements: z.string().optional().nullable(),
                interactionType: z.string().optional(),
                legalBasis: z.string().optional(),
                purpose: z.string().optional(),
                dataSubjectType: z.string().optional(),
                recipients: z.string().optional(),
                isCrossBorder: z.boolean().optional(),
                transferMechanism: z.string().optional(),
                retentionPeriod: z.string().optional(),
                disposalMethod: z.string().optional()
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();

                // Validation: Ensure process belongs to client
                const process = await db.query.businessProcesses.findFirst({
                    where: and(eq(businessProcesses.id, input.processId), eq(businessProcesses.clientId, ctx.clientId))
                });
                if (!process) throw new TRPCError({ code: "FORBIDDEN", message: "Invalid Process ID" });

                await db.insert(processDataFlows).values({
                    processId: input.processId,
                    assetId: input.assetId,
                    dataElements: input.dataElements,
                    interactionType: input.interactionType,
                    legalBasis: input.legalBasis,
                    purpose: input.purpose,
                    dataSubjectType: input.dataSubjectType,
                    recipients: input.recipients,
                    isCrossBorder: input.isCrossBorder,
                    transferMechanism: input.transferMechanism,
                    retentionPeriod: input.retentionPeriod,
                    disposalMethod: input.disposalMethod
                });

                return { success: true };
            }),

        // Delete a data flow
        deleteProcessDataFlow: clientProcedure
            .input(z.object({
                clientId: z.number(),
                flowId: z.number()
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();
                // Ideally we check ownership via join to process -> client, but for speed skipping strict check if ID is obscure. 
                // Better practice:
                const flow = await db.select({ clientId: businessProcesses.clientId })
                    .from(processDataFlows)
                    .innerJoin(businessProcesses, eq(processDataFlows.processId, businessProcesses.id))
                    .where(eq(processDataFlows.id, input.flowId))
                    .limit(1);

                if (!flow.length || flow[0].clientId !== ctx.clientId) {
                    throw new TRPCError({ code: "FORBIDDEN" });
                }

                await db.delete(processDataFlows).where(eq(processDataFlows.id, input.flowId));
                return { success: true };
            }),

        // Get all data flows for a client (across all processes)
        getAllDataFlows: clientProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                const flows = await db
                    .select({
                        flow: processDataFlows,
                        asset: assets,
                        processName: businessProcesses.name,
                        processId: businessProcesses.id
                    })
                    .from(processDataFlows)
                    .innerJoin(businessProcesses, eq(processDataFlows.processId, businessProcesses.id))
                    .leftJoin(assets, eq(processDataFlows.assetId, assets.id))
                    .where(eq(businessProcesses.clientId, clientId));

                return flows;
            }),

        // ==================== DSAR MANAGEMENT ====================

        getDsarRequests: clientProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                console.log(`[PrivacyRouter] getDsarRequests. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${clientId}`);

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                return await db
                    .select()
                    .from(dsarRequests)
                    .where(eq(dsarRequests.clientId, clientId))
                    .orderBy(desc(dsarRequests.requestDate));
            }),

        getDsarRequest: clientProcedure
            .input(z.object({ id: z.number(), clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                console.log(`[PrivacyRouter] getDsarRequest. ctx.clientId: ${ctx.clientId}, input.id: ${input.id}, clientId: ${clientId}`);

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                const req = await db.query.dsarRequests.findFirst({
                    where: and(eq(dsarRequests.id, input.id), eq(dsarRequests.clientId, clientId))
                });
                return req || null;
            }),

        createDsarRequest: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                requestType: z.string(),
                subjectEmail: z.string().email(),
                subjectName: z.string().optional(),
                requestDate: z.string().optional(),
                dueDate: z.string().optional(),
                submissionMethod: z.string().optional(),
                priority: z.string().optional(),
                assignedTo: z.string().optional(), // User ID as string/int
            }))
            .mutation(async ({ ctx, input }: any) => {
                try {
                    const db = await getDb();
                    const clientId = ctx.clientId || input?.clientId;
                    console.log(`[PrivacyRouter] createDsarRequest. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${clientId}`);

                    if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                    // Generate ID
                    const year = new Date().getFullYear();
                    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    const requestId = `DSAR-${year}-${randomPart}`;

                    await db.insert(dsarRequests).values({
                        clientId: clientId,
                        requestId,
                        requestType: input.requestType,
                        subjectEmail: input.subjectEmail,
                        subjectName: input.subjectName ?? null,
                        requestDate: input.requestDate ? new Date(input.requestDate) : new Date(),
                        dueDate: input.dueDate ? new Date(input.dueDate) : null,
                        submissionMethod: input.submissionMethod ?? 'manual',
                        priority: input.priority ?? 'medium',
                        status: 'New',
                        auditLog: [{
                            action: 'created',
                            user: ctx.user?.email || 'system',
                            timestamp: new Date().toISOString(),
                            details: `Request created via ${input.submissionMethod || 'system'}`
                        }]
                    });

                    return { success: true, requestId };
                } catch (error: any) {
                    console.error("[PrivacyRouter] createDsarRequest error:", error);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to create DSAR request: ${error.message}`
                    });
                }
            }),

        updateDsarStatus: clientProcedure
            .input(z.object({
                id: z.number(),
                status: z.string().optional(),
                verificationStatus: z.string().optional(),
                resolutionNotes: z.string().optional(),
                assignedTo: z.any().optional(), // Can be string or number depending on UI
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();

                const existing = await db.query.dsarRequests.findFirst({
                    where: and(eq(dsarRequests.id, input.id), eq(dsarRequests.clientId, ctx.clientId))
                });
                if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

                const updateData: any = {
                    updatedAt: new Date()
                };

                const auditEntry = {
                    action: 'updated',
                    user: ctx.user?.email || 'system',
                    timestamp: new Date().toISOString(),
                    details: ''
                };

                if (input.status) {
                    updateData.status = input.status;
                    auditEntry.details += `Status changed to ${input.status}. `;
                    if (['Completed', 'Rejected'].includes(input.status)) {
                        updateData.completedDate = new Date();
                    }
                }

                if (input.verificationStatus) {
                    updateData.verificationStatus = input.verificationStatus;
                    auditEntry.details += `Verification status: ${input.verificationStatus}. `;
                }

                if (input.resolutionNotes !== undefined) {
                    updateData.resolutionNotes = input.resolutionNotes;
                }

                if (input.assignedTo !== undefined) {
                    // Ensure it's stored as null if empty, or string ID
                    updateData.assigneeId = input.assignedTo ? Number(input.assignedTo) : null;
                    auditEntry.details += `Assignee updated. `;
                }

                // Append audit log
                const currentLog = (existing.auditLog as any[]) || [];
                updateData.auditLog = [...currentLog, auditEntry];

                await db.update(dsarRequests)
                    .set(updateData)
                    .where(eq(dsarRequests.id, input.id));

                return { success: true };
            }),

        updateDsarResponseData: clientProcedure
            .input(z.object({
                id: z.number(),
                responseData: z.object({
                    personalDataFound: z.boolean(),
                    dataCategories: z.array(z.string()),
                    purposes: z.array(z.string()),
                    recipients: z.array(z.string()),
                    lawfulBasis: z.array(z.string()),
                    retentionPeriod: z.string(),
                    sources: z.string(),
                    rightsInfo: z.string(),
                })
            }))
            .mutation(async ({ ctx, input }: any) => {
                const db = await getDb();

                const existing = await db.query.dsarRequests.findFirst({
                    where: and(eq(dsarRequests.id, input.id), eq(dsarRequests.clientId, ctx.clientId))
                });
                if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

                await db.update(dsarRequests)
                    .set({
                        responseData: input.responseData,
                        updatedAt: new Date()
                    })
                    .where(eq(dsarRequests.id, input.id));

                return { success: true };
            }),

        // Stats for Dashboard
        getPrivacyStats: clientProcedure
            .input(z.object({ clientId: z.number().optional() }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                console.log(`[PrivacyRouter] getPrivacyStats. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${clientId}`);

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                // Count personal data assets
                const [piiAssets] = await db
                    .select({ count: count() })
                    .from(assets)
                    .where(and(eq(assets.clientId, clientId), eq(assets.isPersonalData, true)));

                // Count active DSARs
                const [activeDsar] = await db
                    .select({ count: count() })
                    .from(dsarRequests)
                    .where(and(eq(dsarRequests.clientId, clientId), sql`status NOT IN ('Completed', 'Rejected')`));

                return {
                    piiAssetCount: piiAssets?.count ?? 0,
                    activeDsarCount: activeDsar?.count ?? 0
                };
            }),
        // ==================== ASSESSMENTS ====================

        listAssessments: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                typePrefix: z.string().optional()
            }))
            .query(async ({ ctx, input }: any) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                if (input.typePrefix) {
                    return await db.select()
                        .from(privacyAssessments)
                        .where(and(
                            eq(privacyAssessments.clientId, clientId),
                            like(privacyAssessments.type, `${input.typePrefix}%`)
                        ))
                        .orderBy(desc(privacyAssessments.updatedAt));
                }

                return await db.select()
                    .from(privacyAssessments)
                    .where(eq(privacyAssessments.clientId, clientId))
                    .orderBy(desc(privacyAssessments.updatedAt));
            }),

        getAssessment: clientProcedure
            .input(z.object({
                clientId: z.number().optional(),
                type: z.string()
            }))
            .query(async ({ ctx, input }: { ctx: any, input: any }) => {
                const db = await getDb();
                const clientId = ctx.clientId || input?.clientId;
                console.log(`[PrivacyRouter] getAssessment. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${clientId}, type: ${input.type}`);

                if (!clientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                const assessment = await db.query.privacyAssessments.findFirst({
                    where: and(
                        eq(privacyAssessments.clientId, clientId),
                        eq(privacyAssessments.type, input.type)
                    )
                });
                return assessment || null;
            }),

        saveAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                type: z.string(),
                responses: z.any().optional(),
                status: z.enum(["not_started", "in_progress", "completed"]),
                score: z.number().optional()
            }))
            .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
                try {
                    console.log("Saving assessment...", input);
                    const db = await getDb();

                    if (!db.query.privacyAssessments) {
                        console.error("privacyAssessments not found in db.query keys:", Object.keys(db.query));
                        throw new Error("SERVER CONFIG ERROR: privacyAssessments table not registered in schema.");
                    }

                    const assessmentClientId = ctx.clientId || input?.clientId;
                    console.log(`[PrivacyRouter] saveAssessment. ctx.clientId: ${ctx.clientId}, input.clientId: ${input?.clientId}, final: ${assessmentClientId}`);

                    if (!assessmentClientId) throw new TRPCError({ code: "BAD_REQUEST", message: "Client ID required" });

                    const existing = await db.query.privacyAssessments.findFirst({
                        where: and(
                            eq(privacyAssessments.clientId, assessmentClientId),
                            eq(privacyAssessments.type, input.type)
                        )
                    });

                    if (existing) {
                        await db.update(privacyAssessments)
                            .set({
                                responses: input.responses,
                                status: input.status,
                                score: input.score,
                                updatedAt: new Date()
                            })
                            .where(eq(privacyAssessments.id, existing.id));
                    } else {
                        await db.insert(privacyAssessments).values({
                            clientId: assessmentClientId,
                            type: input.type,
                            responses: input.responses,
                            status: input.status,
                            score: input.score
                        });
                    }

                    // --- TASK INTEGRATION ---
                    // Automatically create remediation tasks for "No" or "Partial" answers
                    console.log("[PrivacyRouter] Checking for gaps to create tasks...");
                    const gapEntries = Object.entries(input.responses).filter(
                        ([_, res]: [string, any]) => res.answer === "No" || res.answer === "Partial"
                    );

                    if (gapEntries.length > 0) {
                        // Check for existing tasks to avoid duplicates? 
                        // For simplicity, we'll search by title pattern for now.
                        for (const [qId, res] of gapEntries as [string, any][]) {
                            const taskTitle = `[Privacy Gap - ${input.type.toUpperCase()}] Resolve ${qId}`;

                            // Check if task already exists
                            const existingTask = await db.query.remediationTasks.findFirst({
                                where: and(
                                    eq(remediationTasks.clientId, assessmentClientId),
                                    eq(remediationTasks.title, taskTitle),
                                    sql`status NOT IN ('resolved', 'closed')`
                                )
                            });

                            if (!existingTask) {
                                console.log(`[PrivacyRouter] Creating task for gap: ${qId}`);
                                await db.insert(remediationTasks).values({
                                    clientId: assessmentClientId,
                                    title: taskTitle,
                                    description: `Privacy gap identified in ${input.type} assessment for question ${qId}.\n\nNotes: ${res.notes || 'No notes provided'}.`,
                                    priority: res.answer === "No" ? "high" : "medium",
                                    status: "open",
                                    dueDate: res.dueDate ? new Date(res.dueDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days default
                                });
                            }
                        }
                    }

                    return { success: true };
                } catch (e: any) {
                    console.error("Error saving assessment:", e);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to save: ${e.message}`
                    });
                }
            }),
    });
};
