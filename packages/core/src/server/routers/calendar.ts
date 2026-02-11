
import { z } from "zod";
import { getDb } from "../../db";
import * as schema from "../../schema";
import {
    projectTasks,
    poamItems,
    federalPoams,
} from "../../schema";
import { eq, and, sql, desc, or, gte, lte, lt } from "drizzle-orm";

export const createCalendarRouter = (t: any, clientProcedure: any) => t.router({
    events: clientProcedure
        .input(z.object({
            clientId: z.number(),
            startDate: z.string(),
            endDate: z.string(),
        }))
        .query(async ({ input, ctx }: any) => {
            const db = await getDb();
            const { clientId } = input;
            const start = new Date(input.startDate);
            const end = new Date(input.endDate);

            // Get standard compliance events from db.ts
            const { getCalendarEvents } = await import("../../db");
            const complianceEvents = await getCalendarEvents(clientId, start, end);

            // 1. Project Tasks
            const pTasks = await db.select().from(projectTasks).where(and(eq(projectTasks.clientId, clientId), gte(projectTasks.dueDate, start), lte(projectTasks.dueDate, end)));

            // 2. Roadmap Items (Remediation) - Aligned with Actions Router
            const rItems = await db.select({
                item: schema.roadmapItems,
                plan: schema.remediationPlans
            })
                .from(schema.roadmapItems)
                .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                .where(and(
                    eq(schema.remediationPlans.clientId, clientId),
                    gte(schema.remediationPlans.targetDate, start),
                    lte(schema.remediationPlans.targetDate, end)
                ));

            // 3. POA&M items
            const poam = await db.select({ item: poamItems }).from(poamItems).innerJoin(federalPoams, eq(poamItems.poamId, federalPoams.id)).where(and(eq(federalPoams.clientId, clientId), gte(poamItems.scheduledCompletionDate, start), lte(poamItems.scheduledCompletionDate, end)));

            const events = [
                ...complianceEvents,
                ...pTasks.map((t: any) => ({
                    id: `project_${t.id}`,
                    type: 'project_task',
                    title: t.title,
                    description: t.description || 'Project Task',
                    date: t.dueDate,
                    clientId: t.clientId,
                    clientName: 'Client',
                    status: t.status,
                    entityId: t.id,
                    priority: t.priority,
                    completed: t.status === 'completed'
                })),
                ...rItems.map(({ item, plan }: any) => ({
                    id: `roadmap_${item.id}`,
                    type: 'remediation',
                    title: item.title,
                    description: item.description || 'Remediation Task',
                    date: plan.targetDate,
                    clientId: clientId,
                    clientName: 'Client',
                    status: item.status,
                    entityId: item.id,
                    priority: item.phase === 1 ? 'critical' : 'medium',
                    completed: item.status === 'completed'
                })),
                ...poam.map(({ item }: any) => ({
                    id: `poam_${item.id}`,
                    type: 'poam',
                    title: `POA&M: ${item.weaknessName || item.id}`,
                    description: item.weaknessDescription || 'POA&M Item',
                    date: item.scheduledCompletionDate,
                    clientId: clientId,
                    clientName: 'Client',
                    status: item.status,
                    entityId: item.id,
                    priority: 'high',
                    completed: item.status === 'completed'
                }))
            ];
            return events;
        }),

    upcoming: clientProcedure
        .input(z.object({
            clientId: z.number(),
            limit: z.number().default(5)
        }))
        .query(async ({ input }: any) => {
            const db = await getDb();
            const now = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(now.getDate() + 30);

            // Fetch from all sources
            const pTasks = await db.select().from(projectTasks).where(and(eq(projectTasks.clientId, input.clientId), gte(projectTasks.dueDate, now), lte(projectTasks.dueDate, nextWeek)));

            const rItems = await db.select({
                item: schema.roadmapItems,
                plan: schema.remediationPlans
            })
                .from(schema.roadmapItems)
                .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                .where(and(
                    eq(schema.remediationPlans.clientId, input.clientId),
                    gte(schema.remediationPlans.targetDate, now),
                    lte(schema.remediationPlans.targetDate, nextWeek)
                ));

            const pItems = await db.select({ item: poamItems }).from(poamItems).innerJoin(federalPoams, eq(poamItems.poamId, federalPoams.id)).where(and(eq(federalPoams.clientId, input.clientId), gte(poamItems.scheduledCompletionDate, now), lte(poamItems.scheduledCompletionDate, nextWeek)));

            const all = [
                ...pTasks.map((t: any) => ({ id: `project_${t.id}`, type: 'project_task', title: t.title, description: t.description, dueDate: t.dueDate, clientId: t.clientId, clientName: 'Client', status: t.status, entityId: t.id, priority: t.priority })),
                ...rItems.map(({ item, plan }: any) => ({ id: `roadmap_${item.id}`, type: 'remediation', title: item.title, description: item.description, dueDate: plan.targetDate, clientId: input.clientId, clientName: 'Client', status: item.status, entityId: item.id, priority: item.phase === 1 ? 'critical' : 'medium' })),
                ...pItems.map(({ item }: any) => ({ id: `poam_${item.id}`, type: 'poam', title: `POA&M: ${item.weaknessName}`, description: item.weaknessDescription, dueDate: item.scheduledCompletionDate, clientId: input.clientId, clientName: 'Client', status: item.status, entityId: item.id, priority: 'high' }))
            ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, input.limit);

            return all;
        }),

    overdue: clientProcedure
        .input(z.object({
            clientId: z.number(),
            limit: z.number().default(5)
        }))
        .query(async ({ input }: any) => {
            const db = await getDb();
            const now = new Date();

            const pTasks = await db.select().from(projectTasks).where(and(eq(projectTasks.clientId, input.clientId), lt(projectTasks.dueDate, now), or(eq(projectTasks.status, 'todo'), eq(projectTasks.status, 'in_progress'))));

            const rItems = await db.select({
                item: schema.roadmapItems,
                plan: schema.remediationPlans
            })
                .from(schema.roadmapItems)
                .innerJoin(schema.remediationPlans, eq(schema.roadmapItems.planId, schema.remediationPlans.id))
                .where(and(
                    eq(schema.remediationPlans.clientId, input.clientId),
                    lt(schema.remediationPlans.targetDate, now),
                    or(eq(schema.roadmapItems.status, 'pending'), eq(schema.roadmapItems.status, 'in_progress'))
                ));

            const pItems = await db.select({ item: poamItems }).from(poamItems).innerJoin(federalPoams, eq(poamItems.poamId, federalPoams.id)).where(and(eq(federalPoams.clientId, input.clientId), lt(poamItems.scheduledCompletionDate, now), eq(poamItems.status, 'open')));

            const all = [
                ...pTasks.map((t: any) => ({ id: `project_${t.id}`, type: 'project_task', title: t.title, description: t.description, dueDate: t.dueDate, clientId: t.clientId, clientName: 'Client', status: t.status, entityId: t.id, priority: t.priority })),
                ...rItems.map(({ item, plan }: any) => ({ id: `roadmap_${item.id}`, type: 'remediation', title: item.title, description: item.description, dueDate: plan.targetDate, clientId: input.clientId, clientName: 'Client', status: item.status, entityId: item.id, priority: item.phase === 1 ? 'critical' : 'medium' })),
                ...pItems.map(({ item }: any) => ({ id: `poam_${item.id}`, type: 'poam', title: `POA&M: ${item.weaknessName}`, description: item.weaknessDescription, dueDate: item.scheduledCompletionDate, clientId: input.clientId, clientName: 'Client', status: item.status, entityId: item.id, priority: 'high' }))
            ].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, input.limit);

            return all;
        })
});
