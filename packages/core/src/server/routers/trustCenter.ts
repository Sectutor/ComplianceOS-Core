import { z } from "zod";
import * as db from "../../db";
import * as schema from "../../schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const createTrustCenterRouter = (t: any, publicProcedure: any, protectedProcedure: any) => {
    return t.router({
        getPublicData: publicProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();

                // Get documents for this client
                const docs = await dbConn.select().from(schema.trustDocuments)
                    .where(eq(schema.trustDocuments.clientId, input.clientId));

                return {
                    documents: docs
                };
            }),

        requestAccess: publicProcedure
            .input(z.object({
                clientId: z.number(),
                email: z.string().email(),
                name: z.string(),
                company: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();

                // 1. Basic Competitor Check
                const competitorDomains = ['competitor.com', 'rival.io', 'badguy.net'];
                const domain = input.email.split('@')[1];
                if (competitorDomains.includes(domain)) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: "Access restricted for competitors. Please contact sales@complianceos.com"
                    });
                }

                // 2. Register/Update Visitor
                let [visitor] = await dbConn.select().from(schema.trustCenterVisitors)
                    .where(and(
                        eq(schema.trustCenterVisitors.clientId, input.clientId),
                        eq(schema.trustCenterVisitors.email, input.email)
                    )).limit(1);

                if (!visitor) {
                    [visitor] = await dbConn.insert(schema.trustCenterVisitors).values({
                        clientId: input.clientId,
                        email: input.email,
                        name: input.name,
                        company: input.company || null,
                    }).returning();
                } else {
                    await dbConn.update(schema.trustCenterVisitors)
                        .set({ lastSeenAt: new Date(), name: input.name, company: input.company || null })
                        .where(eq(schema.trustCenterVisitors.id, visitor.id));
                }

                return { visitorId: visitor.id, success: true };
            }),

        signNDA: publicProcedure
            .input(z.object({
                clientId: z.number(),
                visitorId: z.number(),
                signatureText: z.string()
            }))
            .mutation(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();
                const ipAddress = ctx.req?.headers['x-forwarded-for'] || ctx.req?.socket?.remoteAddress || 'unknown';

                // 1. Check if already signed
                const existing = await dbConn.select().from(schema.ndaSignatures)
                    .where(and(
                        eq(schema.ndaSignatures.clientId, input.clientId),
                        eq(schema.ndaSignatures.visitorId, input.visitorId)
                    )).limit(1);

                if (existing.length > 0) return { success: true };

                // 2. Sign
                await dbConn.insert(schema.ndaSignatures).values({
                    clientId: input.clientId,
                    visitorId: input.visitorId,
                    signatureText: input.signatureText,
                    ndaVersion: "v1.0",
                    ipAddress: String(ipAddress).split(',')[0],
                });

                return { success: true };
            }),

        getAccessStatus: publicProcedure
            .input(z.object({
                clientId: z.number(),
                email: z.string().email().optional()
            }))
            .query(async ({ input, ctx }: any) => {
                const dbConn = await db.getDb();

                // Determine email to check: input first, then authenticated user
                const checkEmail = input.email || ctx.user?.email;

                if (!checkEmail) {
                    return { signed: false, isLoggedIn: !!ctx.user };
                }

                // 1. Get or Create Visitor for this User/Email
                let [visitor] = await dbConn.select().from(schema.trustCenterVisitors)
                    .where(and(
                        eq(schema.trustCenterVisitors.clientId, input.clientId),
                        eq(schema.trustCenterVisitors.email, checkEmail)
                    )).limit(1);

                // If logged in but no visitor record yet, we can technically "pre-fill"
                if (!visitor && ctx.user) {
                    return {
                        signed: false,
                        isLoggedIn: true,
                        user: {
                            name: ctx.user.name,
                            email: ctx.user.email,
                            company: "Internal User" // Optional: fetch client name
                        }
                    };
                }

                if (!visitor) return { signed: false, isLoggedIn: !!ctx.user };

                // 2. Check Signature
                const signature = await dbConn.select().from(schema.ndaSignatures)
                    .where(and(
                        eq(schema.ndaSignatures.clientId, input.clientId),
                        eq(schema.ndaSignatures.visitorId, visitor.id)
                    )).limit(1);

                return {
                    signed: signature.length > 0,
                    visitorId: visitor.id,
                    isLoggedIn: !!ctx.user,
                    user: visitor
                };
            }),

        // Admin methods to manage documents
        addDocument: protectedProcedure
            .input(z.object({
                clientId: z.number(),
                name: z.string(),
                description: z.string().optional(),
                fileUrl: z.string(),
                isLocked: z.boolean().default(false),
                category: z.string().optional()
            }))
            .mutation(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.insert(schema.trustDocuments).values(input).returning();
            }),

        listVisitors: protectedProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();
                return await dbConn.select().from(schema.trustCenterVisitors)
                    .where(eq(schema.trustCenterVisitors.clientId, input.clientId))
                    .orderBy(desc(schema.trustCenterVisitors.createdAt));
            })
    });
};
