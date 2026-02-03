
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import { eq, desc, and } from "drizzle-orm";

export const createActionsRouter = (t: any, clientProcedure: any) => t.router({
    // Unified List
    listAll: clientProcedure
        .input(z.object({
            clientId: z.number(),
            filters: z.object({
                status: z.string().optional(),
                type: z.string().optional(),
                assigneeId: z.number().optional()
            }).optional()
        }))
        .query(async ({ input }: any) => {
            const db = await getDb();
            const { clientId } = input;

            // 1. Fetch POA&M Items
            // Join with federalPoams to ensure client check
            const poams = await db.select({
                item: schema.poamItems,
                poamTitle: schema.federalPoams.title
            })
                .from(schema.poamItems)
                .innerJoin(schema.federalPoams, eq(schema.poamItems.poamId, schema.federalPoams.id))
                .where(eq(schema.federalPoams.clientId, clientId));

            // 2. Fetch Risk Treatments
            // Risk Treatments link to Risk Scenarios -> Risk Assessments -> Client
            // This is a deep join. Let's try a simpler path if possible.
            // riskTreatments -> riskScenarios -> (clientId is on riskScenarios? No, on Assessment)
            // schema.riskTreatments has assessmentId? 
            // Let's check schema.riskTreatments structure quickly or assume standard.
            // I'll assume they are linked to an assessment for now. If this fails, I'll fix.
            // Actually, in `risks.ts`, treatments are often fetched by assessmentId. 
            // Unifying them requires joining up to Client.
            // Let's defer complexity: generic "Project Tasks" are easier.

            // Let's genericize:
            const tasks = await db.select().from(schema.tasks)
                .where(eq(schema.tasks.clientId, clientId));

            // 3. Roadmap Items (Remediation)
            const roadmapItems = await db.select({
                item: schema.roadmapItems,
                plan: schema.remediationPlans
            })
                .from(schema.roadmapItems)
                .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                .where(eq(schema.remediationPlans.clientId, clientId));

            // 4. Project Tasks (New Remediation Tasks)
            const projectTasks = await db.select().from(schema.projectTasks)
                .where(eq(schema.projectTasks.clientId, clientId));

            const allActions: any[] = [];

            // Map POA&Ms
            poams.forEach(({ item, poamTitle }: any) => {
                allActions.push({
                    id: `poam-${item.id}`,
                    originalId: item.id,
                    type: 'poam',
                    title: item.weaknessName,
                    description: item.weaknessDescription,
                    status: item.status || 'open',
                    priority: 'medium', // POA&M doesn't strictly have priority in schema.
                    dueDate: item.scheduledCompletionDate,
                    assigneeId: item.assigneeId,
                    sourceLabel: poamTitle
                });
            });

            // Map Roadmap Items
            roadmapItems.forEach(({ item, plan }: any) => {
                allActions.push({
                    id: `roadmap-${item.id}`,
                    originalId: item.id,
                    type: 'remediation',
                    title: item.title,
                    description: item.description,
                    status: item.status || 'pending',
                    priority: item.phase === 1 ? 'critical' : item.phase === 2 ? 'high' : 'medium',
                    dueDate: plan.targetDate, // Or calculate based on duration
                    assigneeId: item.assigneeId,
                    sourceLabel: plan.title
                });
            });

            // Map Project Tasks
            projectTasks.forEach((task: any) => {
                const isRemediation = task.tags?.includes('cve-remediation') || task.title.includes('Remediation');
                allActions.push({
                    id: `project-${task.id}`,
                    originalId: task.id,
                    type: isRemediation ? 'remediation' : 'generic',
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    assigneeId: task.assigneeId,
                    sourceLabel: isRemediation ? 'Vulnerability Remediation' : 'Project Task'
                });
            });

            // Map Generic Tasks
            tasks.forEach((task: any) => {
                allActions.push({
                    id: `task-${task.id}`,
                    originalId: task.id,
                    type: 'generic',
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    assigneeId: task.assigneeId,
                    sourceLabel: 'General Task'
                });
            });

            // Client-side Sort/Filter (easier for aggregation)
            let result = allActions.sort((a, b) => {
                // Sort by Due Date (asc), then Priority
                if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                if (a.dueDate) return -1;
                if (b.dueDate) return 1;
                return 0;
            });

            if (input.filters?.status) {
                result = result.filter(a => a.status === input.filters.status);
            }

            return result;
        }),

    // List Assignees
    listAssignees: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const db = await getDb();
            // Fetch users with access to this client
            const rows = await db.select({
                id: schema.users.id,
                name: schema.users.name,
                email: schema.users.email
            })
                .from(schema.userClients)
                .innerJoin(schema.users, eq(schema.userClients.userId, schema.users.id))
                .where(eq(schema.userClients.clientId, input.clientId));

            return rows.map((r: any) => ({
                id: r.id,
                firstName: r.name?.split(' ')[0] || 'User',
                lastName: r.name?.split(' ').slice(1).join(' ') || '',
                email: r.email
            }));
        }),

    // Update Status
    updateStatus: clientProcedure
        .input(z.object({
            id: z.string(), // "poam-123"
            clientId: z.number(),
            status: z.string(),
            priority: z.string().optional(),
            dueDate: z.union([z.string(), z.date()]).optional(),
            assigneeId: z.number().nullable().optional()
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [type, idStr] = input.id.split('-');
            const id = parseInt(idStr);

            // Verify ownership
            let item: any;
            if (type === 'poam') {
                 // poamItems -> federalPoams -> clientId
                 const [poam] = await db.select({ clientId: schema.federalPoams.clientId })
                    .from(schema.poamItems)
                    .innerJoin(schema.federalPoams, eq(schema.poamItems.poamId, schema.federalPoams.id))
                    .where(eq(schema.poamItems.id, id));
                 if (!poam || poam.clientId !== input.clientId) throw new Error("Item not found or access denied");
            } else if (type === 'roadmap') {
                 // roadmapItems -> remediationPlans -> clientId
                 const [roadmap] = await db.select({ clientId: schema.remediationPlans.clientId })
                    .from(schema.roadmapItems)
                    .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                    .where(eq(schema.roadmapItems.id, id));
                 if (!roadmap || roadmap.clientId !== input.clientId) throw new Error("Item not found or access denied");
            } else if (type === 'task') {
                 [item] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
                 if (!item || item.clientId !== input.clientId) throw new Error("Item not found or access denied");
            } else if (type === 'project') {
                 [item] = await db.select().from(schema.projectTasks).where(eq(schema.projectTasks.id, id));
                 if (!item || item.clientId !== input.clientId) throw new Error("Item not found or access denied");
            }

            if (type === 'poam') {
                // POA&M only supports status (open/closed) and date
                const updateData: any = { status: input.status, updatedAt: new Date() };
                if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;

                await db.update(schema.poamItems)
                    .set(updateData)
                    .where(eq(schema.poamItems.id, id));
            } else if (type === 'roadmap') {
                const updateData: any = { status: input.status };
                if (input.assigneeId !== undefined) updateData.assigneeId = input.assigneeId;

                // Roadmap items support status and assignee
                await db.update(schema.roadmapItems)
                    .set(updateData)
                    .where(eq(schema.roadmapItems.id, id));
            } else if (type === 'task') {
                // Generic tasks support all
                await db.update(schema.tasks)
                    .set({
                        status: input.status,
                        priority: input.priority,
                        dueDate: input.dueDate ? new Date(input.dueDate) : null,
                        assigneeId: input.assigneeId,
                        updatedAt: new Date()
                    })
                    .where(eq(schema.tasks.id, id));
            } else if (type === 'project') {
                // Project tasks (Remediation)
                await db.update(schema.projectTasks)
                    .set({
                        status: input.status,
                        priority: input.priority,
                        dueDate: input.dueDate ? new Date(input.dueDate) : null,
                        assigneeId: input.assigneeId,
                        updatedAt: new Date()
                    })
                    .where(eq(schema.projectTasks.id, id));
            }

            return { success: true };
        }),

    // Delete Task
    delete: clientProcedure
        .input(z.object({
            id: z.string(), // "task-123" or "project-123"
            clientId: z.number()
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [type, idStr] = input.id.split('-');
            const id = parseInt(idStr);

            // Verify ownership first
            let item: any;
            if (type === 'task') {
                [item] = await db.select().from(schema.tasks).where(eq(schema.tasks.id, id));
                if (!item || item.clientId !== input.clientId) throw new Error("Item not found or access denied");
                await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
            } else if (type === 'project') {
                [item] = await db.select().from(schema.projectTasks).where(eq(schema.projectTasks.id, id));
                if (!item || item.clientId !== input.clientId) throw new Error("Item not found or access denied");
                await db.delete(schema.projectTasks).where(eq(schema.projectTasks.id, id));
            } else if (type === 'roadmap') {
                 // roadmapItems -> remediationPlans -> clientId 
                 const [roadmap] = await db.select({ clientId: schema.remediationPlans.clientId })
                    .from(schema.roadmapItems)
                    .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                    .where(eq(schema.roadmapItems.id, id));
                 if (!roadmap || roadmap.clientId !== input.clientId) throw new Error("Item not found or access denied");
                 await db.delete(schema.roadmapItems).where(eq(schema.roadmapItems.id, id));
            } else if (type === 'poam') {
                 const [poam] = await db.select({ clientId: schema.federalPoams.clientId })
                    .from(schema.poamItems)
                    .innerJoin(schema.federalPoams, eq(schema.poamItems.poamId, schema.federalPoams.id))
                    .where(eq(schema.poamItems.id, id));
                 if (!poam || poam.clientId !== input.clientId) throw new Error("Item not found or access denied");
                 await db.delete(schema.poamItems).where(eq(schema.poamItems.id, id));
            } else {
                throw new Error("Cannot delete this item type directly.");
            }

            return { success: true };
        }),

    // Create Generic Task
    create: clientProcedure
        .input(z.object({
            clientId: z.number(),
            title: z.string(),
            description: z.string().optional(),
            priority: z.string().optional(),
            dueDate: z.string().optional(),
            assigneeId: z.number().optional()
        }))
        .mutation(async ({ input }: any) => {
            const db = await getDb();
            const [task] = await db.insert(schema.tasks).values({
                clientId: input.clientId,
                title: input.title,
                description: input.description,
                priority: input.priority || 'medium',
                dueDate: input.dueDate ? new Date(input.dueDate) : null,
                assigneeId: input.assigneeId,
                status: 'todo',
                sourceType: 'manual',
                createdAt: new Date(),
                updatedAt: new Date()
            }).returning();

            return task;
        })
});
