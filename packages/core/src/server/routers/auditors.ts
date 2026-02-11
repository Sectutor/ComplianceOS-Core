
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../../db";
import { users, userClients, magicLinks, clients } from "../../schema";
import * as schema from "../../schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail } from "../../lib/email/transporter";
import { generateMagicLinkEmail } from "../../components/email/templates/MagicLinkInvite";
import * as crypto from "crypto";

export const createAuditorsRouter = (t: any, adminProcedure: any, clientProcedure: any) => {
    return t.router({
        // Invite an auditor via Magic Link
        invite: clientProcedure.input(z.object({
            email: z.string().email(),
            clientId: z.number(),
            expiresInDays: z.number().default(30)
        })).mutation(async ({ input, ctx }: any) => {
            // Check if user already exists
            const dbConn = await db.getDb();
            const existingUser = await dbConn.select().from(users).where(eq(users.email, input.email)).limit(1);

            if (existingUser.length > 0) {
                // User exists, add them to client as auditor if not already
                const user = existingUser[0];
                const membership = await dbConn.select().from(userClients)
                    .where(and(eq(userClients.userId, user.id), eq(userClients.clientId, input.clientId)))
                    .limit(1);

                if (membership.length === 0) {
                    await dbConn.insert(userClients).values({
                        userId: user.id,
                        clientId: input.clientId,
                        role: 'auditor'
                    });
                } else if (membership[0].role !== 'auditor') {
                    // Update role? Maybe not if they are already admin/owner.
                    // Only update if they are viewer or standard user and we want to grant auditor access specifically?
                    // For now, assume if they are already a member, we just notify them.
                    // Or throw error saying "User already member".
                }

                // Send notification email (simplified)
                await sendEmail({
                    to: input.email,
                    subject: "You have been added as an Auditor",
                    html: `<p>You have been granted auditor access to client #${input.clientId}. Log in to view.</p>`
                });

                return { success: true, message: "User added as auditor" };
            }

            // Create Magic Link for new user
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

            // Store magic link with specific role 'auditor' and link to this client
            // Note: magicLinks table needs to support linking to a specific client on redemption if we want auto-add
            // Current implementation of 'magicLinks' seems global.
            // We can resolve this by adding 'role: auditor' and handling it in redemption logic.
            // For now, we reuse existing magicLinks structure.

            const [newLink] = await dbConn.insert(magicLinks).values({
                token,
                email: input.email,
                role: 'auditor', // This will be used on signup
                planTier: 'free',
                maxClients: 1, // Auditors usually just need access to one or few
                createdById: ctx.user.id,
                expiresAt
            }).returning();

            // Send Email
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:5173";
            const inviteUrl = `${baseUrl}/auth/redeem-link?token=${token}&clientId=${input.clientId}`; // Pass clientID to handle auto-join

            const { subject, html } = generateMagicLinkEmail({
                inviteUrl,
                recipientEmail: input.email,
                role: 'Auditor',
                planTier: 'Standard',
                expiresInDays: input.expiresInDays
            });

            await sendEmail({
                to: input.email,
                subject,
                html
            });

            return { success: true, linkId: newLink.id };
        }),

        // List auditors for a client
        list: clientProcedure.input(z.object({
            clientId: z.number()
        })).query(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // Get users with role 'auditor' in this client
            const auditorUsers = await dbConn.select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: userClients.role,
                joinedAt: userClients.joinedAt
            })
                .from(userClients)
                .innerJoin(users, eq(userClients.userId, users.id))
                .where(and(
                    eq(userClients.clientId, input.clientId),
                    eq(userClients.role, 'auditor')
                ));

            // Also get pending invites? (Magic Links)
            // This requires filtering magicLinks by email or some metadata, which is tricky if no direct link in DB.
            // We'll skip pending invites for now to keep it minimal.

            return auditorUsers;
        }),

        // Revoke auditor access
        revoke: clientProcedure.input(z.object({
            clientId: z.number(),
            userId: z.number()
        })).mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // Remove from user_clients
            await dbConn.delete(userClients)
                .where(and(
                    eq(userClients.userId, input.userId),
                    eq(userClients.clientId, input.clientId),
                    eq(userClients.role, 'auditor') // Safety check to only remove auditors
                ));

            return { success: true };
        }),

        // Get Audit Scope (Read-Only)
        // This aggregates data for the Auditor Portal
        getScope: clientProcedure.input(z.object({
            clientId: z.number(),
            framework: z.string().optional()
        })).query(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();

            // 1. Get Client Details
            const client = await dbConn.select().from(clients).where(eq(clients.id, input.clientId)).limit(1);
            if (!client.length) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });

            // 2. Statistics for Evidence
            // Count verified evidence for the framework
            const evidenceStats = await dbConn.select({
                count: sql<number>`count(*)`,
                status: schema.evidence.status
            })
                .from(schema.evidence)
                .where(and(
                    eq(schema.evidence.clientId, input.clientId),
                    input.framework ? eq(schema.evidence.framework, input.framework) : undefined
                ))
                .groupBy(schema.evidence.status);

            const totalEvidence = evidenceStats.reduce((acc: number, curr: any) => acc + Number(curr.count), 0);
            const verifiedEvidence = evidenceStats.find((s: any) => s.status === 'verified')?.count || 0;

            // 3. Control Coverage
            // Count controls mapped to this framework
            const controlStats = await dbConn.select({
                count: sql<number>`count(*)`
            })
                .from(schema.controls)
                .where(and(
                    eq(schema.controls.clientId, input.clientId),
                    input.framework ? eq(schema.controls.framework, input.framework) : undefined
                ));

            return {
                client: client[0],
                scope: {
                    framework: input.framework || "All Frameworks",
                    totalEvidence,
                    verifiedEvidence,
                    controlCount: controlStats[0]?.count || 0,
                    complianceScore: totalEvidence > 0 ? Math.round((Number(verifiedEvidence) / totalEvidence) * 100) : 0,
                    evidenceStatus: {
                        verified: verifiedEvidence,
                        pending: totalEvidence - verifiedEvidence // Approximation
                    }
                },
                stats: { // For compatibility with AuditorChecklistPage
                    framework: input.framework || "All Frameworks",
                    totalEvidence,
                    verifiedEvidence,
                    controlCount: controlStats[0]?.count || 0,
                    complianceScore: totalEvidence > 0 ? Math.round((Number(verifiedEvidence) / totalEvidence) * 100) : 0,
                    evidenceStatus: {
                        verified: verifiedEvidence,
                        pending: totalEvidence - verifiedEvidence // Approximation
                    }
                }
            };
        })
    });
};
