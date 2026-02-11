import { z } from "zod";
import { employeeTrainingRecords, employeeAcknowledgments, employeeSecuritySetup, employeeAssetReceipts, employees, complianceRequirements, policyExceptions, policyAssignments, clientPolicies } from "../../schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getDb } from "../../db";
import { TRPCError } from "@trpc/server";
import { logActivity } from "../../lib/audit";
import { llmService } from "../../lib/llm/service";

export const createOnboardingRouter = (t: any, clientProcedure: any, clientEditorProcedure: any) => {
    return t.router({
        /**
         * Get comprehensive onboarding status for an employee
         * Aggregates data from policies, training, and assets
         */
        getOnboardingStatus: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId, employeeId } = input;

                // 0. Fetch configured requirements
                // If none exist, we'll return the default hardcoded set for backward compatibility/initial state
                // but ideally, we should seed these when a client is created.
                let requirements = await db.select()
                    .from(complianceRequirements)
                    .where(eq(complianceRequirements.clientId, clientId))
                    .orderBy(complianceRequirements.displayOrder);

                // Fallback for existing clients without data (Dynamic Seeding)
                if (requirements.length === 0) {
                    requirements = [
                        { key: 'code_of_conduct', title: 'Code of Conduct', isMandatory: true, description: '<h3>Code of Conduct</h3><p>Standard Code of Conduct...</p>' },
                        { key: 'aup', title: 'Acceptable Use Policy', isMandatory: true, description: '<h3>Acceptable Use Policy</h3><p>Standard AUP...</p>' },
                        { key: 'data_protection', title: 'Data Protection Agreement', isMandatory: true, description: '<h3>Data Protection</h3><p>Standard DPA...</p>' },
                        { key: 'confidentiality', title: 'Confidentiality Agreement', isMandatory: true, description: '<h3>Confidentiality</h3><p>Standard NDA...</p>' }
                    ];
                }

                // 1. Fetch training records
                const trainingRecords = await db.select()
                    .from(employeeTrainingRecords)
                    .where(and(
                        eq(employeeTrainingRecords.clientId, clientId),
                        eq(employeeTrainingRecords.employeeId, employeeId)
                    ));

                // 2. Fetch acknowledgments
                const acknowledgments = await db.select()
                    .from(employeeAcknowledgments)
                    .where(eq(employeeAcknowledgments.employeeId, employeeId));

                // 3. Fetch security setup
                const [securitySetup] = await db.select()
                    .from(employeeSecuritySetup)
                    .where(eq(employeeSecuritySetup.employeeId, employeeId));

                // 4. Fetch asset receipts
                const assetReceipts = await db.select()
                    .from(employeeAssetReceipts)
                    .where(eq(employeeAssetReceipts.employeeId, employeeId));

                // 5. Fetch policy exceptions
                const exceptions = await db.select()
                    .from(policyExceptions)
                    .where(eq(policyExceptions.employeeId, employeeId))
                    .orderBy(desc(policyExceptions.createdAt));

                // 6. Fetch assigned policies
                const assignedPolicies = await db.select({
                    id: clientPolicies.id,
                    name: clientPolicies.name,
                    content: clientPolicies.content,
                    version: clientPolicies.version,
                    assignmentId: policyAssignments.id,
                    status: policyAssignments.status
                })
                    .from(policyAssignments)
                    .innerJoin(clientPolicies, eq(policyAssignments.policyId, clientPolicies.id))
                    .where(eq(policyAssignments.employeeId, employeeId));

                // Merge assigned policies into requirements
                // We use a prefix 'policy_' to distinguish them from standard onboarding requirements
                const policyRequirements = assignedPolicies.map((p: any) => ({
                    id: p.id,
                    key: `policy_${p.id}`,
                    title: p.name,
                    description: p.content,
                    isMandatory: true,
                    isPolicy: true, // Flag to distinguish in frontend
                    assignmentId: p.assignmentId
                }));

                const allRequirements = [...requirements, ...policyRequirements];

                // Process acknowledgments against requirements
                const ackItems: Record<string, boolean> = {};
                let completedAcks = 0;

                allRequirements.forEach((req: any) => {
                    // Find the latest acknowledgment for this requirement
                    let isAck = false;

                    if (req.isPolicy) {
                        // Check policy_assignments table
                        const assignment = assignedPolicies.find((p: any) => p.id === req.id);
                        isAck = assignment?.status === 'attested';
                    } else {
                        // Check employee_acknowledgments table
                        const latestAck = acknowledgments
                            .filter((a: any) => a.acknowledgmentType === req.key)
                            .sort((a: any, b: any) => new Date(b.acknowledgedAt).getTime() - new Date(a.acknowledgedAt).getTime())[0];

                        // Check if it exists AND is recent enough (acknowledged AFTER the requirement was last updated)
                        if (latestAck) {
                            if (req.updatedAt) {
                                isAck = new Date(latestAck.acknowledgedAt).getTime() >= (new Date(req.updatedAt).getTime() - 5000);
                            } else {
                                isAck = true;
                            }
                        }
                    }

                    // For policies, we check policyId in exceptions. For documents, we will now check requirementId.
                    const hasException = exceptions.find((ex: any) =>
                        (req.isPolicy ? ex.policyId === req.id : ex.requirementId === req.id) &&
                        ex.status === 'approved'
                    );

                    const isSatisfied = isAck || !!hasException;

                    ackItems[req.key] = isSatisfied;
                    if (isSatisfied) completedAcks++;
                });

                // Build tasks object with all sections
                const tasks = {
                    policies: {
                        complete: false, // Will be determined by frontend
                        total: 0,
                        pending: 0
                    },
                    training: {
                        complete: trainingRecords.length >= 5, // Minimum 5 sections
                        completed: trainingRecords.length,
                        required: 5
                    },
                    device: {
                        complete: false, // Placeholder
                        assigned: 0
                    },
                    acknowledgments: {
                        complete: completedAcks >= allRequirements.length,
                        items: ackItems,
                        requirements: allRequirements.map((req: any) => ({
                            ...req,
                            exception: exceptions.find((ex: any) =>
                                (req.isPolicy ? ex.policyId === req.id : ex.requirementId === req.id)
                            ) || null
                        })) // Pass requirements with exception status
                    },
                    security: {
                        complete: securitySetup?.mfaEnrolled && securitySetup?.passwordManagerSetup && securitySetup?.securityQuestionsSet,
                        mfaEnrolled: securitySetup?.mfaEnrolled || false,
                        passwordManagerSetup: securitySetup?.passwordManagerSetup || false,
                        securityQuestionsSet: securitySetup?.securityQuestionsSet || false
                    },
                    assets: {
                        complete: assetReceipts.length > 0 && assetReceipts.every((a: any) => a.status === 'confirmed' || (a.confirmedAt && a.status !== 'returned')),
                        items: assetReceipts.map((a: any) => ({
                            type: a.assetType,
                            status: a.confirmedAt && a.status !== 'returned' ? 'confirmed' : a.status,
                            confirmedAt: a.confirmedAt
                        })),
                        hasAssignments: assetReceipts.length > 0
                    }
                };

                // Calculate percentage across all tasks
                const completedCount = [
                    tasks.training.complete,
                    tasks.acknowledgments.complete,
                    tasks.security.complete,
                    tasks.assets.complete
                ].filter(Boolean).length;

                const totalCount = 4; // training, acknowledgments, security, assets (policies and device excluded for now)
                const percentage = Math.round((completedCount / totalCount) * 100);

                return {
                    percentage,
                    completedCount,
                    totalCount,
                    tasks,
                    trainingRecords,
                    lastUpdated: new Date()
                };
            }),

        /**
         * Get detailed training progress for an employee
         */
        getTrainingProgress: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId, employeeId } = input;

                const records = await db.select()
                    .from(employeeTrainingRecords)
                    .where(and(
                        eq(employeeTrainingRecords.clientId, clientId),
                        eq(employeeTrainingRecords.employeeId, employeeId)
                    ))
                    .orderBy(desc(employeeTrainingRecords.completedAt));

                // Group by framework
                const byFramework = records.reduce((acc: Record<string, any[]>, record: any) => {
                    if (!acc[record.frameworkId]) {
                        acc[record.frameworkId] = [];
                    }
                    acc[record.frameworkId].push(record);
                    return acc;
                }, {});

                return {
                    records,
                    byFramework,
                    totalCompleted: records.length
                };
            }),

        /**
         * Attest/complete a training section
         */
        attestTraining: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                frameworkId: z.string(),
                sectionId: z.string(),
                timeSpentSeconds: z.number().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                const { clientId, employeeId, frameworkId, sectionId, timeSpentSeconds } = input;

                // Check if already completed
                const existing = await db.select()
                    .from(employeeTrainingRecords)
                    .where(and(
                        eq(employeeTrainingRecords.employeeId, employeeId),
                        eq(employeeTrainingRecords.frameworkId, frameworkId),
                        eq(employeeTrainingRecords.sectionId, sectionId)
                    ))
                    .limit(1);

                if (existing.length > 0) {
                    // Update existing record
                    const [updated] = await db.update(employeeTrainingRecords)
                        .set({
                            completedAt: new Date(),
                            timeSpentSeconds: timeSpentSeconds || existing[0].timeSpentSeconds,
                        })
                        .where(eq(employeeTrainingRecords.id, existing[0].id))
                        .returning();

                    return updated;
                }

                // Insert new training record
                const [record] = await db.insert(employeeTrainingRecords)
                    .values({
                        clientId,
                        employeeId,
                        frameworkId,
                        sectionId,
                        completedAt: new Date(),
                        completedByUserId: ctx.user.id,
                        ipAddress: ctx.req?.ip || null,
                        userAgent: ctx.req?.headers?.['user-agent'] || null,
                        timeSpentSeconds: timeSpentSeconds || null,
                    })
                    .returning();

                // Log activity
                await logActivity({
                    clientId,
                    userId: ctx.user.id,
                    action: "update",
                    entityType: "user",
                    entityId: record.id,
                    details: { frameworkId, sectionId }
                });

                return record;
            }),

        /**
         * Get bulk onboarding status for all employees (admin view)
         */
        getBulkOnboardingStatus: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId } = input;

                // Fetch all training records for this client
                const allRecords = await db.select()
                    .from(employeeTrainingRecords)
                    .where(eq(employeeTrainingRecords.clientId, clientId));

                // Group by employee
                const byEmployee = allRecords.reduce((acc: Record<number, any[]>, record: any) => {
                    if (!acc[record.employeeId]) {
                        acc[record.employeeId] = [];
                    }
                    acc[record.employeeId].push(record);
                    return acc;
                }, {});

                // Calculate status for each employee
                const employeeStatuses = (Object.entries(byEmployee) as [string, any[]][]).map(([employeeId, records]) => {
                    const trainingComplete = records.length >= 5;
                    const percentage = trainingComplete ? 100 : Math.round((records.length / 5) * 100);

                    return {
                        employeeId: parseInt(employeeId),
                        trainingCompleted: records.length,
                        trainingRequired: 5,
                        percentage,
                        isComplete: trainingComplete,
                        lastActivity: records.length > 0
                            ? new Date(Math.max(...(records as any[]).map((r: any) => new Date(r.completedAt).getTime())))
                            : null
                    };
                });

                // Calculate summary
                const summary = {
                    total: employeeStatuses.length,
                    complete: employeeStatuses.filter(s => s.isComplete).length,
                    inProgress: employeeStatuses.filter(s => s.percentage > 0 && s.percentage < 100).length,
                    notStarted: employeeStatuses.filter(s => s.percentage === 0).length,
                };

                return {
                    employees: employeeStatuses,
                    summary
                };
            }),

        /**
         * Get onboarding status for all employees in a client
         * Optimized for dashboard view
         */
        getCompanyOnboardingStatus: clientProcedure
            .input(z.object({
                clientId: z.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const { clientId } = input;

                // 1. Fetch all employees
                const clientEmployees = await db.select()
                    .from(employees)
                    .where(eq(employees.clientId, clientId));

                if (clientEmployees.length === 0) {
                    return [];
                }

                const employeeIds = clientEmployees.map((e: any) => e.id);

                // 2. Bulk fetch all related records
                const requirements = await db.select()
                    .from(complianceRequirements)
                    .where(eq(complianceRequirements.clientId, clientId));

                const trainingRecords = await db.select()
                    .from(employeeTrainingRecords)
                    .where(eq(employeeTrainingRecords.clientId, clientId));

                const acknowledgments = await db.select()
                    .from(employeeAcknowledgments)
                    .where(eq(employeeAcknowledgments.clientId, clientId));

                const securitySetups = await db.select()
                    .from(employeeSecuritySetup)
                    .where(eq(employeeSecuritySetup.clientId, clientId));

                const assetReceipts = await db.select()
                    .from(employeeAssetReceipts)
                    .where(eq(employeeAssetReceipts.clientId, clientId));

                const allAssignments = await db.select()
                    .from(policyAssignments)
                    .where(inArray(policyAssignments.employeeId, employeeIds.length > 0 ? employeeIds : [-1]));

                const allExceptions = await db.select()
                    .from(policyExceptions)
                    .where(inArray(policyExceptions.employeeId, employeeIds.length > 0 ? employeeIds : [-1]));

                // 3. Map data to employees
                const employeeStatuses = clientEmployees.map((employee: any) => {
                    // Filter records for this employee
                    const empTraining = trainingRecords.filter((r: any) => r.employeeId === employee.id);
                    const empAcks = acknowledgments.filter((a: any) => a.employeeId === employee.id);
                    const empSecurity = securitySetups.find((s: any) => s.employeeId === employee.id);
                    const empAssets = assetReceipts.filter((a: any) => a.employeeId === employee.id);

                    // Calculate basic status
                    const trainingComplete = empTraining.length >= 5;

                    // Dynamically calculate acknowledgment completion (including assigned policies)
                    const empAssignments = allAssignments.filter((a: any) => a.employeeId === employee.id);
                    const empExceptions = allExceptions.filter((e: any) => e.employeeId === employee.id);

                    const mandatoryReqs = requirements.filter((r: any) => r.isMandatory !== false).map((r: any) => r.key);
                    const docsComplete = mandatoryReqs.length > 0
                        ? mandatoryReqs.every((key: string) => {
                            const req = requirements.find((r: any) => r.key === key);
                            const hasAck = empAcks.some((a: any) => a.acknowledgmentType === key);
                            const hasException = empExceptions.some((ex: any) => ex.requirementId === req?.id && ex.status === 'approved');
                            return hasAck || hasException;
                        })
                        : true;

                    const policiesComplete = empAssignments.length > 0
                        ? empAssignments.every((a: any) => {
                            const hasException = empExceptions.some((ex: any) => ex.policyId === a.policyId && ex.status === 'approved');
                            return a.status === 'attested' || hasException;
                        })
                        : true;

                    const acksComplete = docsComplete && policiesComplete;

                    const securityComplete = empSecurity?.mfaEnrolled && empSecurity?.passwordManagerSetup && empSecurity?.securityQuestionsSet;
                    const assetsComplete = empAssets.length > 0 && empAssets.every((a: any) => a.status === 'confirmed' || (a.confirmedAt && a.status !== 'returned'));

                    // Calculate percentage
                    const completedCount = [
                        trainingComplete,
                        acksComplete,
                        securityComplete,
                        assetsComplete
                    ].filter(Boolean).length;

                    const totalCount = 4;
                    const percentage = Math.round((completedCount / totalCount) * 100);

                    return {
                        employeeId: employee.id,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        email: employee.email,
                        percentage,
                        tasks: {
                            training: { complete: trainingComplete, count: empTraining.length, total: 5 },
                            acknowledgments: {
                                complete: acksComplete,
                                count: empAcks.length + empAssignments.filter((a: any) => a.status === 'attested').length,
                                total: requirements.length + empAssignments.length
                            },
                            security: { complete: !!securityComplete },
                            assets: { complete: assetsComplete, count: empAssets.filter((a: any) => a.status === 'confirmed' || (a.confirmedAt && a.status !== 'returned')).length, total: empAssets.length }
                        },
                        updatedAt: new Date()
                    };
                });

                return employeeStatuses;
            }),

        /**
         * Get compliance requirements for configuration
         */
        getRequirements: clientProcedure
            .input(z.object({
                clientId: z.number(),
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select()
                    .from(complianceRequirements)
                    .where(eq(complianceRequirements.clientId, input.clientId))
                    .orderBy(complianceRequirements.displayOrder);
            }),

        /**
         * Create a new compliance requirement
         */
        createRequirement: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string().min(1),
                description: z.string().optional(),
                key: z.string().min(1).regex(/^[a-z0-9_]+$/, "Key must be lowercase alphanumeric with underscores"),
                isMandatory: z.boolean().default(true),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Get next display order
                const [last] = await db.select({ displayOrder: complianceRequirements.displayOrder })
                    .from(complianceRequirements)
                    .where(eq(complianceRequirements.clientId, input.clientId))
                    .orderBy(desc(complianceRequirements.displayOrder))
                    .limit(1);

                const nextOrder = (last?.displayOrder || 0) + 1;

                const [req] = await db.insert(complianceRequirements)
                    .values({
                        clientId: input.clientId,
                        title: input.title,
                        description: input.description,
                        key: input.key,
                        isMandatory: input.isMandatory,
                        displayOrder: nextOrder
                    })
                    .returning();

                return req;
            }),

        /**
         * Update a compliance requirement
         */
        updateRequirement: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number(),
                title: z.string().optional(),
                description: z.string().optional(),
                isMandatory: z.boolean().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [updated] = await db.update(complianceRequirements)
                    .set({
                        title: input.title,
                        description: input.description,
                        isMandatory: input.isMandatory,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(complianceRequirements.id, input.id),
                        eq(complianceRequirements.clientId, input.clientId)
                    ))
                    .returning();

                return updated;
            }),

        /**
         * Delete a compliance requirement
         */
        deleteRequirement: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                id: z.number()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                await db.delete(complianceRequirements)
                    .where(and(
                        eq(complianceRequirements.id, input.id),
                        eq(complianceRequirements.clientId, input.clientId)
                    ));

                return { success: true };
            }),

        /**
         * Generate compliance requirement content using AI
         */
        generateRequirementContent: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string(),
                industry: z.string().optional(),
                tone: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const prompt = `
Generate a comprehensive, high-quality compliance document or policy content for: "${input.title}".
Industry context: ${input.industry || 'General Business'}
Tone: ${input.tone || 'Professional and Legalistic'}

The output MUST be formatted as semantic HTML content.
- Use <h3> for section headers.
- Use <p> for body text.
- Use <ul> and <li> for bulleted lists.
- Use <strong> for key requirements, deadlines, or emphasized terms.
- Ensure proper spacing between sections.

Do not include <html>, <head>, or <body> tags. Start directly with the content.
Include standard sections relevant to this type of document:
1. Purpose
2. Scope
3. Detailed Policy/Requirements
4. Compliance Monitoring
5. Violations and Enforcement
`;

                try {
                    const response = await llmService.generate({
                        userPrompt: prompt,
                        systemPrompt: "You are an expert compliance officer and legal aide. detailed, accurate, and legally sound compliance documents.",
                        temperature: 0.3,
                        maxTokens: 2000,
                        feature: 'compliance_generation'
                    }, {
                        clientId: input.clientId,
                        userId: ctx.user.id,
                        endpoint: 'onboarding.generateRequirementContent'
                    });

                    return { content: response.text };
                } catch (error: any) {
                    console.error("AI Generation Failed:", error);

                    if (error.message && error.message.includes("No enabled LLM provider")) {
                        throw new TRPCError({
                            code: 'BAD_REQUEST',
                            message: "AI capabilities are not configured. Please enable an AI provider in Settings > AI Integration."
                        });
                    }

                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to generate content: ${error.message}`
                    });
                }
            }),

        /**
         * Submit compliance acknowledgment
         */
        submitAcknowledgment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                acknowledgmentType: z.string(), // Changed from enum to string for dynamic support
                ipAddress: z.string().optional(),
                userAgent: z.string().optional(),
                version: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const [result] = await db.insert(employeeAcknowledgments)
                    .values({
                        clientId: input.clientId,
                        employeeId: input.employeeId,
                        acknowledgmentType: input.acknowledgmentType,
                        ipAddress: input.ipAddress,
                        userAgent: input.userAgent,
                        acknowledgedAt: new Date()
                    })
                    .onConflictDoNothing()
                    .returning();

                await logActivity({
                    userId: ctx.user?.id,
                    action: 'acknowledge_compliance',
                    entityType: 'employee_acknowledgment',
                    entityId: result?.id,
                    details: { acknowledgmentType: input.acknowledgmentType }
                });

                return result;
            }),

        /**
         * Update security setup status
         */
        updateSecuritySetup: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                field: z.enum(['mfaEnrolled', 'passwordManagerSetup', 'securityQuestionsSet']),
                value: z.boolean()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                // Build update data dynamically
                const updateData: any = {
                    [input.field]: input.value,
                    updatedAt: new Date()
                };

                // Add timestamp field if setting to true
                if (input.value) {
                    const timestampField = `${input.field}At`;
                    updateData[timestampField] = new Date();
                }

                // Try to update first
                const existing = await db.select()
                    .from(employeeSecuritySetup)
                    .where(eq(employeeSecuritySetup.employeeId, input.employeeId))
                    .limit(1);

                let result;
                if (existing.length > 0) {
                    [result] = await db.update(employeeSecuritySetup)
                        .set(updateData)
                        .where(eq(employeeSecuritySetup.employeeId, input.employeeId))
                        .returning();
                } else {
                    [result] = await db.insert(employeeSecuritySetup)
                        .values({
                            clientId: input.clientId,
                            employeeId: input.employeeId,
                            ...updateData
                        })
                        .returning();
                }

                await logActivity({
                    userId: ctx.user?.id,
                    action: 'update_security_setup',
                    entityType: 'employee_security',
                    entityId: result?.id,
                    details: { field: input.field, value: input.value }
                });

                return result;
            }),

        /**
         * Assign an asset to an employee
         */
        assignAsset: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                assetType: z.string(),
                serialNumber: z.string().optional(),
                notes: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const existing = await db.select()
                    .from(employeeAssetReceipts)
                    .where(and(
                        eq(employeeAssetReceipts.employeeId, input.employeeId),
                        eq(employeeAssetReceipts.assetType, input.assetType)
                    ))
                    .limit(1);

                let result;
                if (existing.length > 0) {
                    [result] = await db.update(employeeAssetReceipts)
                        .set({
                            status: 'assigned',
                            serialNumber: input.serialNumber,
                            notes: input.notes,
                            assignedBy: ctx.user.id,
                            assignedAt: new Date(),
                            confirmedAt: null
                        })
                        .where(eq(employeeAssetReceipts.id, existing[0].id))
                        .returning();
                } else {
                    [result] = await db.insert(employeeAssetReceipts)
                        .values({
                            clientId: input.clientId,
                            employeeId: input.employeeId,
                            assetType: input.assetType,
                            status: 'assigned',
                            serialNumber: input.serialNumber,
                            notes: input.notes,
                            assignedBy: ctx.user.id,
                            assignedAt: new Date()
                        })
                        .returning();
                }

                await logActivity({
                    userId: ctx.user?.id,
                    action: 'update',
                    entityType: 'employee_asset',
                    entityId: result.id,
                    details: { assetType: input.assetType, serialNumber: input.serialNumber, status: 'assigned' }
                });

                return result;
            }),

        /**
         * Confirm asset receipt
         */
        confirmAssetReceipt: clientProcedure
            .input(z.object({
                clientId: z.number(),
                employeeId: z.number(),
                assetType: z.string(),
                assetId: z.number().optional(),
                notes: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();

                const existing = await db.select()
                    .from(employeeAssetReceipts)
                    .where(and(
                        eq(employeeAssetReceipts.employeeId, input.employeeId),
                        eq(employeeAssetReceipts.assetType, input.assetType)
                    ))
                    .limit(1);

                let result;
                if (existing.length > 0) {
                    [result] = await db.update(employeeAssetReceipts)
                        .set({
                            status: 'confirmed',
                            confirmedAt: new Date(),
                            notes: input.notes ? input.notes : undefined
                        })
                        .where(eq(employeeAssetReceipts.id, existing[0].id))
                        .returning();
                } else {
                    [result] = await db.insert(employeeAssetReceipts)
                        .values({
                            clientId: input.clientId,
                            employeeId: input.employeeId,
                            assetType: input.assetType,
                            assetId: input.assetId,
                            notes: input.notes,
                            status: 'confirmed',
                            confirmedAt: new Date(),
                            assignedAt: new Date()
                        })
                        .returning();
                }

                await logActivity({
                    userId: ctx.user?.id,
                    action: 'confirm_asset_receipt',
                    entityType: 'employee_asset',
                    entityId: result?.id,
                    details: { assetType: input.assetType }
                });

                return result;
            }),
    });
};
