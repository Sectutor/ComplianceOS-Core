import { z } from 'zod';
import { CrmService } from './service';
import { TRPCError } from '@trpc/server';
import {
    createContactSchema,
    updateContactSchema,
    createActivitySchema,
    createEngagementSchema
} from './types';

export const createCrmRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // Contact Management
        getContacts: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getContacts(input.clientId);
            }),

        createContact: clientProcedure
            .input(createContactSchema.extend({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                return await CrmService.createContact(input);
            }),

        // Activity Management
        getActivities: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getActivities(input.clientId);
            }),

        logActivity: clientProcedure
            .input(createActivitySchema.extend({ clientId: z.number() }))
            .mutation(async ({ ctx, input }: any) => {
                return await CrmService.logActivity(ctx.user.id, input);
            }),

        // Engagement Management (formerly Deals)
        getEngagements: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getEngagements(input.clientId);
            }),

        createEngagement: clientProcedure
            .input(createEngagementSchema.extend({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                return await CrmService.createEngagement(input.clientId, input);
            }),

        updateEngagementStage: clientProcedure
            .input(z.object({
                clientId: z.number(),
                engagementId: z.number(),
                stage: z.enum(["planned", "gap_analysis", "remediation", "audit_prep", "audit_active", "certified", "maintenance"])
            }))
            .mutation(async ({ input }: any) => {
                return await CrmService.updateEngagementStage(input.clientId, input.engagementId, input.stage);
            }),

        getEngagementDetails: clientProcedure
            .input(z.object({ clientId: z.number(), engagementId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getEngagementDetails(input.clientId, input.engagementId);
            }),

        updateClientControlStatus: clientProcedure
            .input(z.object({
                clientId: z.number(),
                clientControlId: z.number(),
                status: z.enum(['not_implemented', 'in_progress', 'implemented', 'not_applicable'])
            }))
            .mutation(async ({ input }: any) => {
                return await CrmService.updateClientControlStatus(input.clientId, input.clientControlId, input.status);
            }),

        getStats: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getStats(input.clientId);
            }),

        getTasks: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await CrmService.getTasks(input.clientId);
            }),

        createTask: clientProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string().min(1),
                description: z.string().optional(),
                priority: z.enum(["low", "medium", "high", "critical"]),
                dueDate: z.date().optional(), // superjson handles dates
                status: z.enum(["open", "in_progress", "resolved", "closed"]),
                assigneeId: z.number().optional()
            }))
            .mutation(async ({ input }: any) => {
                return await CrmService.createTask(input);
            }),
    });
};
