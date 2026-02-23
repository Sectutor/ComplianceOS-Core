import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../schema";
import { getDb } from "../../db";

export function createNist80030Router(t: any, clientProcedure: any) {
    return t.router({
        // ==========================================
        //  THREAT SOURCES (T-1)
        // ==========================================
        listThreatSources: clientProcedure
            .input(z.object({ clientId: z.number(), fismaSystemId: z.number().optional() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const filters = [eq(schema.nist80030ThreatSources.clientId, input.clientId)];
                if (input.fismaSystemId) filters.push(eq(schema.nist80030ThreatSources.fismaSystemId, input.fismaSystemId));

                return await dbConn.select().from(schema.nist80030ThreatSources)
                    .where(and(...filters))
                    .orderBy(desc(schema.nist80030ThreatSources.updatedAt));
            }),

        saveThreatSource: clientProcedure
            .input(z.object({
                clientId: z.number(),
                fismaSystemId: z.number().optional(),
                id: z.number().optional(),
                type: z.string(),
                name: z.string(),
                description: z.string().optional(),
                capability: z.string().optional(),
                intent: z.string().optional(),
                targeting: z.string().optional(),
                motive: z.string().optional(),
                rangeOfEffects: z.string().optional(),
                status: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...data } = input;

                if (id) {
                    const [updated] = await dbConn.update(schema.nist80030ThreatSources)
                        .set({ ...data, updatedAt: new Date() })
                        .where(and(
                            eq(schema.nist80030ThreatSources.id, id),
                            eq(schema.nist80030ThreatSources.clientId, input.clientId)
                        ))
                        .returning();
                    return updated;
                } else {
                    const [created] = await dbConn.insert(schema.nist80030ThreatSources)
                        .values(data)
                        .returning();
                    return created;
                }
            }),

        deleteThreatSource: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.nist80030ThreatSources)
                    .where(and(
                        eq(schema.nist80030ThreatSources.id, input.id),
                        eq(schema.nist80030ThreatSources.clientId, input.clientId)
                    ));
                return { success: true };
            }),

        // ==========================================
        //  THREAT EVENTS (T-2)
        // ==========================================
        listThreatEvents: clientProcedure
            .input(z.object({ clientId: z.number(), fismaSystemId: z.number().optional() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const filters = [eq(schema.nist80030ThreatEvents.clientId, input.clientId)];
                if (input.fismaSystemId) filters.push(eq(schema.nist80030ThreatEvents.fismaSystemId, input.fismaSystemId));

                return await dbConn.select().from(schema.nist80030ThreatEvents)
                    .where(and(...filters))
                    .orderBy(desc(schema.nist80030ThreatEvents.updatedAt));
            }),

        saveThreatEvent: clientProcedure
            .input(z.object({
                clientId: z.number(),
                fismaSystemId: z.number().optional(),
                id: z.number().optional(),
                threatSourceId: z.number().optional(),
                eventId: z.string().optional(),
                name: z.string(),
                description: z.string().optional(),
                sourceType: z.string().optional(),
                relevance: z.string().optional(),
                likelihood: z.string().optional(),
                vulnerabilitiesPredispositions: z.string().optional(),
                targetedAssets: z.string().optional(),
                status: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...data } = input;

                if (id) {
                    const [updated] = await dbConn.update(schema.nist80030ThreatEvents)
                        .set({ ...data, updatedAt: new Date() })
                        .where(and(
                            eq(schema.nist80030ThreatEvents.id, id),
                            eq(schema.nist80030ThreatEvents.clientId, input.clientId)
                        ))
                        .returning();
                    return updated;
                } else {
                    // Auto-generate eventId if not provided
                    if (!data.eventId) {
                        const existing = await dbConn.select().from(schema.nist80030ThreatEvents)
                            .where(eq(schema.nist80030ThreatEvents.clientId, input.clientId));
                        data.eventId = `TE-${String(existing.length + 1).padStart(2, '0')}`;
                    }
                    const [created] = await dbConn.insert(schema.nist80030ThreatEvents)
                        .values(data)
                        .returning();
                    return created;
                }
            }),

        deleteThreatEvent: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.nist80030ThreatEvents)
                    .where(and(
                        eq(schema.nist80030ThreatEvents.id, input.id),
                        eq(schema.nist80030ThreatEvents.clientId, input.clientId)
                    ));
                return { success: true };
            }),

        // ==========================================
        //  IMPACT ASSESSMENTS (T-3)
        // ==========================================
        listImpactAssessments: clientProcedure
            .input(z.object({ clientId: z.number(), fismaSystemId: z.number().optional() }))
            .query(async ({ input }: any) => {
                const dbConn = await getDb();
                const filters = [eq(schema.nist80030ImpactAssessments.clientId, input.clientId)];
                if (input.fismaSystemId) filters.push(eq(schema.nist80030ImpactAssessments.fismaSystemId, input.fismaSystemId));

                return await dbConn.select().from(schema.nist80030ImpactAssessments)
                    .where(and(...filters))
                    .orderBy(desc(schema.nist80030ImpactAssessments.updatedAt));
            }),

        saveImpactAssessment: clientProcedure
            .input(z.object({
                clientId: z.number(),
                fismaSystemId: z.number().optional(),
                id: z.number().optional(),
                domain: z.string(),
                ciaType: z.string().optional(),
                magnitude: z.string(),
                magnitudeScore: z.number().optional(),
                description: z.string().optional(),
                rationale: z.string().optional(),
                factorName: z.string().optional(),
                factorLevel: z.string().optional(),
                factorType: z.string().optional(),
                factorDescription: z.string().optional(),
                estimatedDailyImpact: z.number().optional(),
                revenueLossPct: z.number().optional(),
                legalFinesPct: z.number().optional(),
                brandEquityPct: z.number().optional(),
                status: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                const { id, ...data } = input;

                if (id) {
                    const [updated] = await dbConn.update(schema.nist80030ImpactAssessments)
                        .set({ ...data, updatedAt: new Date() })
                        .where(and(
                            eq(schema.nist80030ImpactAssessments.id, id),
                            eq(schema.nist80030ImpactAssessments.clientId, input.clientId)
                        ))
                        .returning();
                    return updated;
                } else {
                    const [created] = await dbConn.insert(schema.nist80030ImpactAssessments)
                        .values(data)
                        .returning();
                    return created;
                }
            }),

        deleteImpactAssessment: clientProcedure
            .input(z.object({ clientId: z.number(), id: z.number() }))
            .mutation(async ({ input }: any) => {
                const dbConn = await getDb();
                await dbConn.delete(schema.nist80030ImpactAssessments)
                    .where(and(
                        eq(schema.nist80030ImpactAssessments.id, input.id),
                        eq(schema.nist80030ImpactAssessments.clientId, input.clientId)
                    ));
                return { success: true };
            }),
    });
}
