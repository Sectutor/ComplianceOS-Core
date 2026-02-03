import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as schema from "../../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getDb } from "../../db";

export const createFindingsRouter = (
    t: any,
    protectedProcedure: any
) => {
    return t.router({
        list: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                status: z.enum(["open", "remediated", "accepted", "closed", "all"]).optional()
            }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                let conditions = [eq(schema.auditFindings.clientId, input.clientId)];

                if (input.status && input.status !== 'all') {
                    conditions.push(eq(schema.auditFindings.status, input.status));
                }

                return await dbConn.query.auditFindings.findMany({
                    where: and(...conditions),
                    orderBy: [desc(schema.auditFindings.createdAt)],
                    with: {
                        // We might want to fetch author details if relations were set up generally
                    }
                });
            }),

        create: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                title: z.string().min(1),
                description: z.string().optional(),
                severity: z.enum(["low", "medium", "high", "critical"]),
                evidenceId: z.number().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                const [finding] = await dbConn.insert(schema.auditFindings).values({
                    clientId: input.clientId,
                    title: input.title,
                    description: input.description,
                    severity: input.severity,
                    evidenceId: input.evidenceId,
                    authorId: ctx.user.id,
                    status: "open"
                }).returning();

                return finding;
            }),

        update: protectedProcedure
            .input(z.object({
                id: z.number(),
                status: z.enum(["open", "remediated", "accepted", "closed"]).optional(),
                severity: z.enum(["low", "medium", "high", "critical"]).optional(),
                description: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                const updates: any = { updatedAt: new Date() };
                if (input.status) updates.status = input.status;
                if (input.severity) updates.severity = input.severity;
                if (input.description) updates.description = input.description;

                const [updated] = await dbConn.update(schema.auditFindings)
                    .set(updates)
                    .where(eq(schema.auditFindings.id, input.id))
                    .returning();

                return updated;
            }),

        stats: protectedProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await getDb();

                // Group by severity
                const severityStats = await dbConn
                    .select({
                        severity: schema.auditFindings.severity,
                        count: sql<number>`count(*)`
                    })
                    .from(schema.auditFindings)
                    .where(eq(schema.auditFindings.clientId, input.clientId))
                    .groupBy(schema.auditFindings.severity);

                // Group by status
                const statusStats = await dbConn
                    .select({
                        status: schema.auditFindings.status,
                        count: sql<number>`count(*)`
                    })
                    .from(schema.auditFindings)
                    .where(eq(schema.auditFindings.clientId, input.clientId))
                    .groupBy(schema.auditFindings.status);

                return {
                    bySeverity: severityStats,
                    byStatus: statusStats
                };
            })
    });
};
