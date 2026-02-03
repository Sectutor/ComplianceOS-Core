import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, and, desc, asc, ne, sql, count } from "drizzle-orm";
import { WorkflowEngine } from "../../lib/governance/workflow";

export const createRoadmapRouter = (t: any, publicProcedure: any, adminProcedure: any) => t.router({
    // Generate a new roadmap
    generate: adminProcedure
        .input(z.object({
            clientId: z.number(),
            title: z.string().optional(),
            targetDate: z.string().optional(), // '2025-12-31'
            monthsDuration: z.number().optional() // 3, 6, 12
        }))
        .mutation(async ({ input }: any) => {
            try {
                const dbConn = await getDb();

                // 1. Calculate Target Date if not provided
                let endDate = new Date();
                if (input.targetDate) {
                    endDate = new Date(input.targetDate);
                } else {
                    const months = input.monthsDuration || 6;
                    endDate.setMonth(endDate.getMonth() + months);
                }

                // 2. Fetch Gaps (Unimplemented Controls)
                const gaps = await dbConn.select({
                    gap_responses: schema.gapResponses
                }).from(schema.gapResponses)
                    .leftJoin(schema.gapAssessments, eq(schema.gapResponses.assessmentId, schema.gapAssessments.id))
                    .where(
                        and(
                            eq(schema.gapAssessments.clientId, input.clientId),
                            ne(schema.gapResponses.currentStatus, 'implemented'),
                            eq(schema.gapResponses.targetStatus, 'required')
                        )
                    );

                // 3. Create Plan Container
                const [plan] = await dbConn.insert(schema.remediationPlans).values({
                    clientId: input.clientId,
                    title: input.title || `Remediation Plan - ${new Date().toLocaleDateString()}`,
                    status: 'draft',
                    targetDate: endDate,
                }).returning();

                if (!plan) throw new Error("Failed to create plan record.");

                // 4. Match Playbooks & Generate Items
                const playbooks = await dbConn.select().from(schema.remediationPlaybooks);
                const roadmapItemsToInsert: any[] = [];
                const now = new Date();

                for (const gapRow of gaps) {
                    const gap = gapRow.gap_responses;
                    let matchingPlaybook = playbooks.find((p: typeof schema.remediationPlaybooks.$inferSelect) => {
                        try {
                            return new RegExp(p.gapPattern, 'i').test(gap.controlId);
                        } catch { return false; }
                    });

                    if (!matchingPlaybook) {
                        let phase = 3;
                        if (gap.gapSeverity === 'Critical') phase = 1;
                        else if (gap.gapSeverity === 'High') phase = 2;

                        roadmapItemsToInsert.push({
                            planId: plan.id,
                            controlId: gap.controlId,
                            gapResponseId: gap.id,
                            title: `Remediate ${gap.controlId}`,
                            description: gap.notes || "Implement required control.",
                            phase: phase,
                            status: 'pending',
                            estimatedDuration: 7,
                        });
                    } else {
                        let phase = 3;
                        if (gap.gapSeverity === 'Critical' || matchingPlaybook.severity === 'critical') phase = 1;
                        else if (gap.gapSeverity === 'High' || matchingPlaybook.severity === 'high') phase = 2;

                        roadmapItemsToInsert.push({
                            planId: plan.id,
                            controlId: gap.controlId,
                            gapResponseId: gap.id,
                            title: matchingPlaybook.title,
                            description: matchingPlaybook.steps ? JSON.stringify(matchingPlaybook.steps) : gap.notes,
                            phase: phase,
                            status: 'pending',
                            ownerRole: matchingPlaybook.ownerTemplate || "IT Security",
                            estimatedDuration: 14,
                        });
                    }
                }

                if (roadmapItemsToInsert.length > 0) {
                    await dbConn.insert(schema.roadmapItems).values(roadmapItemsToInsert);
                }

                return plan;
            } catch (error: any) {
                console.error("Roadmap generation failed:", error);
                throw new Error("Failed to generate roadmap: " + error.message);
            }
        }),

    // List plans for a client
    list: publicProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            return dbConn.select().from(schema.remediationPlans)
                .where(eq(schema.remediationPlans.clientId, input.clientId))
                .orderBy(desc(schema.remediationPlans.createdAt));
        }),

    // Get full plan details
    get: publicProcedure
        .input(z.object({ planId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            const [plan] = await dbConn.select().from(schema.remediationPlans)
                .where(eq(schema.remediationPlans.id, input.planId));

            if (!plan) return null;

            const items = await dbConn.select().from(schema.roadmapItems)
                .where(eq(schema.roadmapItems.planId, input.planId))
                .orderBy(asc(schema.roadmapItems.phase), asc(schema.roadmapItems.order));

            return { plan, items };
        }),

    // ==========================================
    // New Strategic Roadmap Operations
    // ==========================================

    // Create or update strategic roadmap
    createStrategic: adminProcedure
        .input(z.object({
            clientId: z.number(),
            roadmapId: z.number().optional(), // For updates
            title: z.string().min(1),
            description: z.string().optional(),
            vision: z.string().optional(),
            objectives: z.array(z.string()).min(1),
            framework: z.string().optional(),
            targetDate: z.date().optional(),
            kpiTargets: z.array(z.object({
                name: z.string(),
                target: z.number(),
                unit: z.string()
            })).optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                const dbConn = await getDb();

                // If roadmapId is provided, update that specific roadmap
                if (input.roadmapId) {
                    console.log(`[Roadmap] Updating existing roadmap ID ${input.roadmapId}`);
                    const [updated] = await dbConn.update(schema.roadmaps)
                        .set({
                            title: input.title,
                            description: input.description,
                            vision: input.vision,
                            objectives: input.objectives,
                            framework: input.framework,
                            targetDate: input.targetDate,
                            // kpiTargets: input.kpiTargets, // Optional update logic could go here
                            updatedAt: new Date()
                        })
                        .where(eq(schema.roadmaps.id, input.roadmapId))
                        .returning();
                    return updated;
                }

                // Otherwise, check if client already has a roadmap (legacy behavior)
                const existing = await dbConn.select().from(schema.roadmaps)
                    .where(eq(schema.roadmaps.clientId, input.clientId))
                    .limit(1);

                if (existing.length > 0) {
                    console.log(`[Roadmap] Client ${input.clientId} already has a roadmap. Updating existing one.`);
                    const [updated] = await dbConn.update(schema.roadmaps)
                        .set({
                            title: input.title,
                            description: input.description,
                            vision: input.vision,
                            objectives: input.objectives,
                            framework: input.framework,
                            targetDate: input.targetDate,
                            // kpiTargets: input.kpiTargets, // Optional update logic could go here
                            updatedAt: new Date()
                        })
                        .where(eq(schema.roadmaps.id, existing[0].id))
                        .returning();
                    return updated;
                }

                const [roadmap] = await dbConn.insert(schema.roadmaps).values({
                    clientId: input.clientId,
                    title: input.title,
                    description: input.description,
                    vision: input.vision,
                    objectives: input.objectives,
                    framework: input.framework,
                    targetDate: input.targetDate,
                    status: 'draft',
                    createdById: ctx.user.id,
                    kpiTargets: input.kpiTargets
                }).returning();

                return roadmap;
            } catch (error: any) {
                console.error("Roadmap creation failed:", error);
                throw new Error("Failed to create roadmap: " + error.message);
            }
        }),

    // List roadmaps for client
    listStrategic: publicProcedure
        .input(z.object({
            clientId: z.number(),
            status: z.enum(['draft', 'active', 'on_track', 'delayed', 'completed']).nullish()
        }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            let query = dbConn.select().from(schema.roadmaps)
                .where(eq(schema.roadmaps.clientId, input.clientId));

            if (input.status) {
                query = query.where(eq(schema.roadmaps.status, input.status));
            }

            return await query.orderBy(desc(schema.roadmaps.createdAt));
        }),

    // Get roadmap with details
    getStrategic: publicProcedure
        .input(z.object({ roadmapId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();

            // Get roadmap
            const [roadmap] = await dbConn.select().from(schema.roadmaps)
                .where(eq(schema.roadmaps.id, input.roadmapId));

            if (!roadmap) return null;

            // Get milestones
            const milestones = await dbConn.select().from(schema.roadmapMilestones)
                .where(eq(schema.roadmapMilestones.roadmapId, input.roadmapId))
                .orderBy(asc(schema.roadmapMilestones.targetDate));

            // Get linked implementation plans
            const implementationPlans = await dbConn.select().from(schema.implementationPlans)
                .where(eq(schema.implementationPlans.roadmapId, input.roadmapId));

            // Calculate progress
            const completedMilestones = milestones.filter((m: any) => m.status === 'completed').length;
            const overallProgress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

            // Parse description field to extract detailed objectives
            let detailedObjectives = [];
            try {
                if (roadmap.description) {
                    const parsedDescription = JSON.parse(roadmap.description);
                    detailedObjectives = parsedDescription.detailedObjectives || [];
                }
            } catch (error) {
                console.error("Error parsing roadmap description:", error);
                // If parsing fails, description might be plain text, not JSON
            }

            return {
                ...roadmap,
                milestones,
                implementationPlans,
                detailedObjectives, // Add parsed detailed objectives
                progress: {
                    overallProgress,
                    completedMilestones,
                    totalMilestones: milestones.length,
                    onTrackStatus: roadmap.status
                }
            };
        }),

    // Add milestone to roadmap
    addMilestone: adminProcedure
        .input(z.object({
            roadmapId: z.number(),
            title: z.string().min(1),
            description: z.string().optional(),
            targetDate: z.date(),
            isGate: z.boolean().default(false),
            priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
            dependencies: z.array(z.number()).optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                const dbConn = await getDb();

                const [milestone] = await dbConn.insert(schema.roadmapMilestones).values({
                    roadmapId: input.roadmapId,
                    title: input.title,
                    description: input.description,
                    targetDate: input.targetDate,
                    isGate: input.isGate,
                    priority: input.priority,
                    dependencies: input.dependencies || [],
                    status: 'pending'
                }).returning();

                return milestone;
            } catch (error: any) {
                console.error("Milestone creation failed:", error);
                throw new Error("Failed to create milestone: " + error.message);
            }
        }),

    // Update milestone status
    updateMilestone: adminProcedure
        .input(z.object({
            milestoneId: z.number(),
            status: z.enum(['pending', 'completed', 'delayed']),
            progressPercentage: z.number().min(0).max(100).optional(),
            actualDate: z.date().optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                const dbConn = await getDb();

                const [milestone] = await dbConn.update(schema.roadmapMilestones)
                    .set({
                        status: input.status,
                        progressPercentage: input.progressPercentage || (input.status === 'completed' ? 100 : 0),
                        actualDate: input.actualDate || (input.status === 'completed' ? new Date() : undefined)
                    })
                    .where(eq(schema.roadmapMilestones.id, input.milestoneId))
                    .returning();

                return milestone;
            } catch (error: any) {
                console.error("Milestone update failed:", error);
                throw new Error("Failed to update milestone: " + error.message);
            }
        }),

    // ==========================================
    // Implementation Plan Operations  
    // ==========================================

    // Create implementation plan
    createImplementation: adminProcedure
        .input(z.object({
            clientId: z.number(),
            roadmapId: z.number().optional(),
            title: z.string().min(1),
            description: z.string().optional(),
            plannedStartDate: z.date().optional(),
            plannedEndDate: z.date().optional(),
            estimatedHours: z.number().optional(),
            budgetAmount: z.number().optional(),
            projectManagerId: z.number().optional(),
            teamMemberIds: z.array(z.number()).optional(),
            linkedFramework: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                const dbConn = await getDb();

                const [plan] = await dbConn.insert(schema.implementationPlans).values({
                    clientId: input.clientId,
                    roadmapId: input.roadmapId,
                    title: input.title,
                    description: input.description,
                    plannedStartDate: input.plannedStartDate,
                    plannedEndDate: input.plannedEndDate,
                    estimatedHours: input.estimatedHours,
                    budgetAmount: input.budgetAmount,
                    projectManagerId: input.projectManagerId,
                    teamMemberIds: input.teamMemberIds || [],
                    linkedFramework: input.linkedFramework,
                    status: 'not_started',
                    priority: input.priority,
                    createdById: ctx.user.id
                }).returning();

                return plan;
            } catch (error: any) {
                console.error("Implementation plan creation failed:", error);
                throw new Error("Failed to create implementation plan: " + error.message);
            }
        }),

    // List implementation plans
    listImplementation: publicProcedure
        .input(z.object({
            clientId: z.number(),
            roadmapId: z.number().optional(),
            status: z.enum(['not_started', 'planning', 'in_progress', 'testing', 'completed', 'blocked']).optional()
        }))
        .query(async ({ input }: any) => {
            const dbConn = await getDb();
            let query = dbConn.select().from(schema.implementationPlans)
                .where(eq(schema.implementationPlans.clientId, input.clientId));

            if (input.roadmapId) {
                query = query.where(eq(schema.implementationPlans.roadmapId, input.roadmapId));
            }

            if (input.status) {
                query = query.where(eq(schema.implementationPlans.status, input.status));
            }

            return await query.orderBy(desc(schema.implementationPlans.createdAt));
        }),

    // Add task to implementation plan
    addTask: adminProcedure
        .input(z.object({
            implementationPlanId: z.number(),
            title: z.string().min(1),
            description: z.string().optional(),
            assigneeId: z.number().optional(),
            estimatedHours: z.number().optional(),
            plannedStartDate: z.date().optional(),
            plannedEndDate: z.date().optional(),
            acceptanceCriteria: z.string().optional(),
            deliverables: z.array(z.string()).optional(),
            dependencies: z.array(z.number()).optional(),
            priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                const dbConn = await getDb();

                const [task] = await dbConn.insert(schema.implementationTasks).values({
                    implementationPlanId: input.implementationPlanId,
                    title: input.title,
                    description: input.description,
                    assigneeId: input.assigneeId,
                    estimatedHours: input.estimatedHours,
                    plannedStartDate: input.plannedStartDate,
                    plannedEndDate: input.plannedEndDate,
                    acceptanceCriteria: input.acceptanceCriteria,
                    deliverables: input.deliverables || [],
                    dependencies: input.dependencies || [],
                    priority: input.priority,
                    status: 'todo',
                    createdById: ctx.user.id
                }).returning();

                return task;
            } catch (error: any) {
                console.error("Task creation failed:", error);
                throw new Error("Failed to create task: " + error.message);
            }
        }),

    // ==========================================
    // Workflow Transitions
    // ==========================================

    // Apply workflow transition
    transition: adminProcedure
        .input(z.object({
            entityType: z.enum(['roadmap', 'implementation_plan']),
            entityId: z.number(),
            toStatus: z.string(),
            metadata: z.record(z.any()).optional()
        }))
        .mutation(async ({ input, ctx }: any) => {
            try {
                // Get current status
                const dbConn = await getDb();
                let currentStatus = null;

                if (input.entityType === 'roadmap') {
                    const [roadmap] = await dbConn.select().from(schema.roadmaps)
                        .where(eq(schema.roadmaps.id, input.entityId));
                    currentStatus = roadmap?.status;
                } else if (input.entityType === 'implementation_plan') {
                    const [plan] = await dbConn.select().from(schema.implementationPlans)
                        .where(eq(schema.implementationPlans.id, input.entityId));
                    currentStatus = plan?.status;
                }

                if (!currentStatus) {
                    throw new Error(`Entity not found: ${input.entityType} ${input.entityId}`);
                }

                // Apply transition
                const result = await WorkflowEngine.applyTransition({
                    entityType: input.entityType,
                    entityId: input.entityId,
                    clientId: ctx.user.clientId || 0,
                    fromStatus: currentStatus,
                    toStatus: input.toStatus,
                    userId: ctx.user.id,
                    userName: ctx.user.name,
                    metadata: input.metadata
                });

                if (!result.success) {
                    throw new Error(result.error || 'Transition failed');
                }

                return result;
            } catch (error: any) {
                console.error("Workflow transition failed:", error);
                throw new Error("Failed to apply transition: " + error.message);
            }
        }),

    // Preview transition
    previewTransition: adminProcedure
        .input(z.object({
            entityType: z.enum(['roadmap', 'implementation_plan']),
            entityId: z.number(),
            toStatus: z.string(),
            metadata: z.record(z.any()).optional()
        }))
        .query(async ({ input, ctx }: any) => {
            try {
                // Get current status
                const dbConn = await getDb();
                let currentStatus = null;

                if (input.entityType === 'roadmap') {
                    const [roadmap] = await dbConn.select().from(schema.roadmaps)
                        .where(eq(schema.roadmaps.id, input.entityId));
                    currentStatus = roadmap?.status;
                } else if (input.entityType === 'implementation_plan') {
                    const [plan] = await dbConn.select().from(schema.implementationPlans)
                        .where(eq(schema.implementationPlans.id, input.entityId));
                    currentStatus = plan?.status;
                }

                if (!currentStatus) {
                    throw new Error(`Entity not found: ${input.entityType} ${input.entityId}`);
                }

                // Preview transition
                const result = await WorkflowEngine.previewTransition({
                    entityType: input.entityType,
                    entityId: input.entityId,
                    clientId: ctx.user.clientId || 0,
                    fromStatus: currentStatus,
                    toStatus: input.toStatus,
                    userId: ctx.user.id,
                    userName: ctx.user.name,
                    metadata: input.metadata
                });

                return result;
            } catch (error: any) {
                console.error("Transition preview failed:", error);
                throw new Error("Failed to preview transition: " + error.message);
            }
        })
});
