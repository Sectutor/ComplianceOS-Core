
import { z } from "zod";
import {
    privacyAssessments,
    incidents
} from "../../schema";
import { getDb } from "../../db";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createCyberRouter = (t: any, clientProcedure: any) => {
    return t.router({
        // ==================== NIS2 ASSESSMENT ====================

        getAssessment: clientProcedure
            .input(z.object({
                clientId: z.number()
            }))
            .query(async ({ input }: { input: any }) => {
                const db = await getDb();
                // We reuse the privacyAssessments table but with type 'nis2'
                const assessment = await db.query.privacyAssessments.findFirst({
                    where: and(
                        eq(privacyAssessments.clientId, input.clientId),
                        eq(privacyAssessments.type, 'nis2')
                    )
                });
                return assessment || null;
            }),

        saveAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                responses: z.record(z.object({
                    answer: z.string(),
                    notes: z.string().optional(),
                    owner: z.string().optional(),
                    dueDate: z.string().optional(),
                    lastReviewed: z.string().optional()
                })),
                status: z.enum(["not_started", "in_progress", "completed"]),
                score: z.number().optional()
            }))
            .mutation(async ({ ctx, input }: { ctx: any, input: any }) => {
                try {
                    const db = await getDb();

                    const existing = await db.query.privacyAssessments.findFirst({
                        where: and(
                            eq(privacyAssessments.clientId, input.clientId),
                            eq(privacyAssessments.type, 'nis2')
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
                            clientId: input.clientId,
                            type: 'nis2',
                            responses: input.responses,
                            status: input.status,
                            score: input.score
                        });
                    }

                    return { success: true };
                } catch (e: any) {
                    console.error("Error saving NIS2 assessment:", e);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: `Failed to save: ${e.message}`
                    });
                }
            }),

        // ==================== INCIDENT REPORTING ====================

        reportIncident: clientProcedure
            .input(z.object({
                clientId: z.number(),
                detectedAt: z.string(),
                severity: z.enum(["low", "medium", "high", "critical"]),
                cause: z.string(),
                description: z.string(),
                crossBorderImpact: z.boolean(),
                reporterName: z.string().optional(),
                affectedAssets: z.string().optional(),
                title: z.string().optional()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const db = await getDb();
                try {
                    const [incident] = await db.insert(incidents).values({
                        clientId: input.clientId,
                        title: input.title || `Incident Report - ${new Date().toLocaleDateString()}`,
                        detectedAt: new Date(input.detectedAt),
                        severity: input.severity,
                        cause: input.cause.length > 100 ? input.cause.substring(0, 100) : input.cause,
                        description: input.description,
                        crossBorderImpact: input.crossBorderImpact,
                        reporterName: input.reporterName || ctx.user.name,
                        affectedAssets: input.affectedAssets,
                        status: 'open'
                    }).returning();

                    // In a real scenario, this might trigger emails to CSIRT
                    console.log(`[INCIDENT] New incident reported: ID ${incident.id} for Client ${input.clientId}`);

                    return { success: true, incidentId: incident.id };
                } catch (e: any) {
                    console.error("Failed to report incident:", e);
                    throw new TRPCError({
                        code: "INTERNAL_SERVER_ERROR",
                        message: "Failed to submit incident report"
                    });
                }
            }),

        getIncidents: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                return await db.select().from(incidents)
                    .where(eq(incidents.clientId, input.clientId))
                    .orderBy(incidents.createdAt);
            }),

        getIncident: clientProcedure
            .input(z.object({
                clientId: z.number(),
                incidentId: z.number()
            }))
            .query(async ({ input }: any) => {
                const db = await getDb();
                const incident = await db.select().from(incidents)
                    .where(and(
                        eq(incidents.clientId, input.clientId),
                        eq(incidents.id, input.incidentId)
                    ))
                    .limit(1);

                if (!incident.length) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Incident not found"
                    });
                }
                return incident[0];
            }),

        updateIncident: clientProcedure
            .input(z.object({
                clientId: z.number(),
                incidentId: z.number(),
                title: z.string().optional(),
                severity: z.enum(["low", "medium", "high", "critical"]).optional(),
                cause: z.string().optional(),
                description: z.string().optional(),
                crossBorderImpact: z.boolean().optional(),
                affectedAssets: z.string().optional(),
                status: z.enum(["open", "investigating", "mitigated", "resolved", "reported"]).optional(),
                reportedToAuthorities: z.boolean().optional()
            }))
            .mutation(async ({ input }: any) => {
                const db = await getDb();

                const updateData: any = { updatedAt: new Date() };
                if (input.title !== undefined) updateData.title = input.title;
                if (input.severity !== undefined) updateData.severity = input.severity;
                if (input.cause !== undefined) updateData.cause = input.cause.length > 100 ? input.cause.substring(0, 100) : input.cause;
                if (input.description !== undefined) updateData.description = input.description;
                if (input.crossBorderImpact !== undefined) updateData.crossBorderImpact = input.crossBorderImpact;
                if (input.affectedAssets !== undefined) updateData.affectedAssets = input.affectedAssets;
                if (input.status !== undefined) updateData.status = input.status;
                if (input.reportedToAuthorities !== undefined) updateData.reportedToAuthorities = input.reportedToAuthorities;

                await db.update(incidents)
                    .set(updateData)
                    .where(and(
                        eq(incidents.clientId, input.clientId),
                        eq(incidents.id, input.incidentId)
                    ));

                console.log(`[INCIDENT] Updated incident ID ${input.incidentId}`);
                return { success: true };
            })
    });
};
