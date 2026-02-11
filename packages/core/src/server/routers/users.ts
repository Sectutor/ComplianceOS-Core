
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as crypto from 'crypto';
import { eq, desc, and, isNull } from "drizzle-orm";

import * as db from "../../db";
import { users, userClients, clients, userInvitations, magicLinks, magicLinkRedemptions } from "../../schema";
import { sendEmail } from "../../lib/email/transporter";
import { sql } from "drizzle-orm";
import { supabaseAdmin } from "../lib/supabaseAdmin";

import { router, publicProcedure, isAuthed, adminProcedure, clientProcedure, protectedProcedure } from "../trpc";

export const usersSubRouter = router({
    acceptInviteAndSignup: publicProcedure
        .input(z.object({
            token: z.string(),
            name: z.string(),
            password: z.string().min(6),
            email: z.string().email().or(z.literal("")).optional(),
            clientId: z.number().nullish()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // 1. Validate Token
            const [link] = await dbConn.select()
                .from(magicLinks)
                .where(eq(magicLinks.token, input.token))
                .limit(1);

            if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid magic link" });
            if (link.status !== 'active') throw new TRPCError({ code: "BAD_REQUEST", message: "Link already used or revoked" });
            if (link.expiresAt && new Date() > link.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Link expired" });

            // Usage Limit Check
            if (link.usageLimit !== null && (link.useCount || 0) >= link.usageLimit) {
                // Auto-close if limit reached
                await dbConn.update(magicLinks).set({ status: 'accepted' }).where(eq(magicLinks.id, link.id));
                throw new TRPCError({ code: "BAD_REQUEST", message: "Link usage limit reached" });
            }

            let userEmail = link.email;
            if (!userEmail) {
                const inputEmail = input.email?.trim();
                if (!inputEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "A valid email is required to redeem this link." });
                userEmail = inputEmail;
            }

            // Calculate Expiration
            let accessExpiresAt: Date | null = null;
            if (link.accessDurationType === 'limited' && link.accessDurationDays) {
                const d = new Date();
                d.setDate(d.getDate() + link.accessDurationDays);
                accessExpiresAt = d;
            }

            // Domain Restriction Check (Prevention against excessive account creation)
            if (link.restrictedDomains && (link.restrictedDomains as string[]).length > 0) {
                const domain = userEmail.split('@')[1]?.toLowerCase();
                const allowedDomains = (link.restrictedDomains as string[]).map(d => d.toLowerCase());
                if (!domain || !allowedDomains.includes(domain)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `This magic link is restricted to the following domains: ${allowedDomains.join(', ')}`
                    });
                }
            }

            // 2. Check if user already exists
            const existingUser = await db.getUserByEmail(userEmail);
            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "An account with this email already exists. Please sign in to claim this invitation."
                });
            }

            // 3. Create User in Supabase
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: userEmail,
                password: input.password,
                email_confirm: true,
                user_metadata: { full_name: input.name }
            });

            if (authError) {
                if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "An account with this email already exists in our authentication system. Please sign in to claim this invitation."
                    });
                }
                throw new TRPCError({ code: "BAD_REQUEST", message: authError.message });
            }

            if (!authUser.user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

            // 3. Create User in DB
            const isWaitlistOrigin = (link as any).waitlistId != null;
            const globalRole = input.clientId
                ? 'user'
                : (isWaitlistOrigin ? 'user' : (['admin', 'owner', 'user'].includes(link.role || '') ? link.role : 'user'));

            const [newUser] = await dbConn.insert(users).values({
                openId: authUser.user.id,
                email: userEmail,
                name: input.name,
                role: globalRole as any,
                planTier: link.planTier as any,
                maxClients: link.maxClients ?? 2,
                subscriptionStatus: 'active',
                loginMethod: 'email_password',
                accessExpiresAt: input.clientId ? null : accessExpiresAt
            }).returning();

            // 3b. Add to Client if clientId provided
            if (input.clientId) {
                await dbConn.insert(userClients).values({
                    userId: newUser.id,
                    clientId: input.clientId,
                    role: (link.role || 'viewer') as any,
                    accessExpiresAt: accessExpiresAt
                });
            }

            // 3c. For waitlist-origin links without clientId, create a personal workspace and assign admin within that org
            if (!input.clientId && isWaitlistOrigin) {
                try {
                    const d2 = await db.getDb();
                    const { waitingList } = await import("../../schema");
                    const { eq: eq2 } = await import("drizzle-orm");
                    const [lead] = await d2.select().from(waitingList).where(eq2(waitingList.id, (link as any).waitlistId)).limit(1);
                    const orgName = (lead?.company || input.name || "New Organization").toString();
                    const industry = (lead?.industry || "Technology").toString();
                    await db.onboardClient({
                        name: orgName,
                        industry,
                        userId: newUser.id,
                        frameworks: [],
                        companyName: orgName
                    });
                    try {
                        await db.seedSampleData(newUser.id, {
                            name: `${orgName} DEMO`,
                            industry
                        });
                    } catch (se) { }
                } catch (e) {
                    console.error("[acceptInviteAndSignup] OnboardClient failed for waitlist link:", e);
                }
            }

            // 4. Record Redemption & Update Usage
            const newUseCount = (link.useCount || 0) + 1;
            const reachedLimit = link.usageLimit !== null && newUseCount >= link.usageLimit;

            await dbConn.update(magicLinks)
                .set({
                    useCount: newUseCount,
                    status: reachedLimit ? 'accepted' : 'active',
                })
                .where(eq(magicLinks.id, link.id));

            await dbConn.insert(magicLinkRedemptions).values({
                magicLinkId: link.id,
                userId: newUser.id,
            });

            return { success: true };
        }),

    acceptInvitation: publicProcedure
        .input(z.object({
            token: z.string(),
            name: z.string(),
            password: z.string().min(6)
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // 1. Validate Token
            const [invite] = await dbConn.select()
                .from(userInvitations)
                .where(eq(userInvitations.token, input.token))
                .limit(1);

            if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invitation link" });
            if (invite.status === 'revoked' || invite.status === 'accepted') throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation no longer valid" });
            if (invite.expiresAt && new Date() > invite.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation has expired" });

            // 2. Check if user already exists
            const existingUser = await db.getUserByEmail(invite.email);
            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "An account with this email already exists. Please sign in to claim this invitation."
                });
            }

            // 3. Create User in Supabase
            const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
                email: invite.email,
                password: input.password,
                email_confirm: true,
                user_metadata: { full_name: input.name }
            });

            if (authError) {
                if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: "An account with this email already exists in our authentication system. Please sign in to claim this invitation."
                    });
                }
                throw new TRPCError({ code: "BAD_REQUEST", message: authError.message });
            }

            if (!authUser.user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

            // 3. Create User in DB (users table)
            // User invitations are currently platform-wide.
            const [newUser] = await dbConn.insert(users).values({
                openId: authUser.user.id,
                email: invite.email,
                name: input.name,
                role: (invite.role || 'user') as any, // Default to user if not specified
                subscriptionStatus: 'active',
                loginMethod: 'email_password'
            }).returning();

            // 4. Mark Invitation Accepted
            await dbConn.update(userInvitations)
                .set({
                    status: 'accepted',
                })
                .where(eq(userInvitations.id, invite.id));

            return { success: true };
        }),

    me: publicProcedure.query(async ({ ctx }: any) => {
        if (!ctx.user) {
            console.log('[users.me] No user in context, returning null');
            return null;
        }
        try {
            console.log('[users.me] Fetching user by ID:', ctx.user.id);
            // Revert: ctx.user.id is the Integer ID from authMiddleware
            const user = await db.getUserById(ctx.user.id);
            console.log('[users.me] User found:', user ? 'yes' : 'no');

            if (!user) {
                console.error('[users.me] FATAL: ctx.user found but db record missing for ID:', ctx.user.id);
                return null;
            }

            // Fetch client context if possible
            const dbConn = await db.getDb();
            let clientData = null;

            if (ctx.clientId) {
                const [c] = await dbConn.select().from(clients).where(eq(clients.id, ctx.clientId)).limit(1);
                clientData = c;
            } else {
                // Fallback to first available client membership
                const [membership] = await dbConn.select({ client: clients })
                    .from(userClients)
                    .innerJoin(clients, eq(userClients.clientId, clients.id))
                    .where(eq(userClients.userId, user.id))
                    .limit(1);
                clientData = membership?.client;
            }

            // Return a plain object with only serializable fields
            console.log('[users.me] Returning user data for ID:', user.id, 'with client:', clientData?.name || 'none');
            return {
                id: user.id,
                openId: user.openId,
                name: user.name,
                email: user.email,
                role: user.role,
                hasSeenTour: user.hasSeenTour,
                planTier: user.planTier,
                subscriptionStatus: user.subscriptionStatus,
                maxClients: user.maxClients,
                createdAt: user.createdAt?.toString() || null,
                updatedAt: user.updatedAt?.toString() || null,
                client: clientData ? {
                    id: clientData.id,
                    name: clientData.name,
                    requireMfa: clientData.requireMfa,
                } : null
            };
        } catch (error) {
            console.error('[users.me] Error fetching user:', error);
            return null;
        }
    }),

    completeTour: publicProcedure.use(isAuthed)
        .mutation(async ({ ctx }: any) => {
            console.log('[completeTour] Mutation called', {
                hasUser: !!ctx.user,
                userId: ctx.user?.id
            });

            if (!ctx.user || !ctx.user.id) {
                console.error('[completeTour] No user in context!', { ctx });
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
            }

            const dbConn = await db.getDb();
            await dbConn.update(users)
                .set({ hasSeenTour: true })
                .where(eq(users.id, ctx.user.id));

            console.log('[completeTour] Success for user:', ctx.user.id);
            return { success: true };
        }),

    listWorkspaceMembers: clientProcedure
        .input(z.object({ clientId: z.number() }))
        .query(async ({ input }: any) => {
            const dbConn = await db.getDb();

            const members = await dbConn.select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: userClients.role,
                joinedAt: userClients.joinedAt
            })
                .from(users)
                .innerJoin(userClients, eq(users.id, userClients.userId))
                .where(eq(userClients.clientId, input.clientId));

            return members;
        }),

    list: adminProcedure
        .query(async () => {
            console.log('[USERS ROUTER] list query called');
            const dbConn = await db.getDb();
            console.log('[USERS ROUTER] db connection established');

            // Fetch users (exclude deleted)
            const allUsers = await dbConn.select().from(users)
                .where(isNull(users.deletedAt))
                .orderBy(desc(users.createdAt));

            // Fetch memberships for all these users
            // Ideally we'd use a single query with join but for now fetching memberships separately is fine or using a lateral join
            // Let's iterate and fetch memberships or fetch all memberships and map in memory
            const allMemberships = await dbConn.select({
                userId: userClients.userId,
                clientId: userClients.clientId,
                role: userClients.role,
                clientName: clients.name
            })
                .from(userClients)
                .innerJoin(clients, eq(userClients.clientId, clients.id));

            // Map memberships by userId
            const membershipMap = new Map<number, any[]>();
            for (const m of allMemberships) {
                if (!membershipMap.has(m.userId)) membershipMap.set(m.userId, []);
                membershipMap.get(m.userId)?.push({
                    clientId: m.clientId,
                    clientName: m.clientName,
                    role: m.role
                });
            }

            // Attach to users
            return allUsers.map((u: any) => ({
                ...u,
                memberships: membershipMap.get(u.id) || []
            }));
        }),
    updateRole: adminProcedure
        .input(z.object({
            id: z.number(),
            role: z.string()
        }))
        .mutation(async ({ input, ctx }: any) => {
            // Prevent modifying own role to avoid lockout
            if (input.id === ctx.user?.id && input.role !== 'admin' && input.role !== 'owner' && input.role !== 'super_admin') {
                // Start Step 385: Allow owner to demote themselves? Probably dangerous.
                // For now, prevent default admin from removing their own admin status
                throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot demote your own global role.' });
            }
            await db.updateUserRole(input.id, input.role);
            return { success: true };
        }),

    update: adminProcedure
        .input(z.object({
            id: z.number(),
            name: z.string().optional(),
            email: z.string().email().optional(),
            maxClients: z.number().optional(),
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();

            // If email is changing, check for conflicts
            if (input.email) {
                const existing = await db.getUserByEmail(input.email);
                if (existing && existing.id !== input.id) {
                    throw new TRPCError({ code: 'CONFLICT', message: 'Email already in use by another user' });
                }
            }

            await dbConn.update(users)
                .set({
                    ...(input.name ? { name: input.name } : {}),
                    ...(input.email ? { email: input.email } : {}),
                    ...(input.maxClients !== undefined ? { maxClients: input.maxClients } : {}),
                    updatedAt: new Date()
                })
                .where(eq(users.id, input.id));

            return { success: true };
        }),
    delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }: any) => {
            const logPrefix = `[USERS ROUTER] delete(id=${input.id})`;
            console.log(`${logPrefix} mutation called`);

            try {
                if (input.id === ctx.user?.id) {
                    console.log(`${logPrefix} failed: user tried to delete themselves`);
                    throw new TRPCError({ code: 'FORBIDDEN', message: 'You cannot delete yourself.' });
                }

                const dbConn = await db.getDb();

                console.log(`${logPrefix} deleting memberships...`);
                // Delete user memberships first (HARD DELETE - revoke access immediately)
                await dbConn.delete(userClients).where(eq(userClients.userId, input.id));

                console.log(`${logPrefix} soft-deleting user...`);
                // Soft Delete user to preserve audit logs
                await dbConn.update(users)
                    .set({ deletedAt: new Date() })
                    .where(eq(users.id, input.id));

                console.log(`${logPrefix} success`);
                return { success: true };
            } catch (error: any) {
                console.error(`${logPrefix} FATAL ERROR:`, error);

                // Log to file for diagnostics
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const logsDir = path.join(process.cwd(), 'logs');
                    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
                    const logPath = path.join(logsDir, 'server_last_error.txt');
                    const timestamp = new Date().toISOString();
                    const errorMessage = error instanceof Error ? error.stack || error.message : String(error);
                    fs.appendFileSync(logPath, `[${timestamp}] ${logPrefix} FAILED: ${errorMessage}\n`);
                } catch (fsError) {
                    console.error("Failed to write to error log file:", fsError);
                }

                if (error instanceof TRPCError) throw error;

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to delete user: ${error.message || 'Unknown server error'}`
                });
            }
        }),
    create: adminProcedure
        .input(z.object({
            name: z.string(),
            email: z.string().email(),
            role: z.string(),
        }))
        .mutation(async ({ input }: any) => {
            const existing = await db.getUserByEmail(input.email);
            if (existing) {
                throw new TRPCError({ code: 'CONFLICT', message: 'User with this email already exists' });
            }

            await db.createUser({
                email: input.email,
                name: input.name,
                password: 'temp_password_123'
            });

            // If role is admin/editor globally, we update it
            // createUser creates as 'user' by default in my implementation in db.ts
            if (input.role !== 'user') {
                // We need to get the ID of the new user. getUserByEmail again.
                const newUser = await db.getUserByEmail(input.email);
                if (newUser) {
                    await db.updateUserRole(newUser.id, input.role);
                }
            }
            return { success: true };
        }),
    // New procedure: Assign a user to an organization directly from Admin console
    assignOrganization: adminProcedure
        .input(z.object({
            userId: z.number(),
            clientId: z.number(),
            role: z.enum(['owner', 'admin', 'editor', 'viewer'])
        }))
        .mutation(async ({ input }: any) => {
            console.log('[USERS ROUTER] assignOrganization mutation called', input);
            const dbConn = await db.getDb();
            // Check if already member
            const existing = await db.isUserAllowedForClient(input.userId, input.clientId);
            if (existing) {
                // Update existing role?
                await dbConn.update(userClients)
                    .set({ role: input.role })
                    .where(and(eq(userClients.userId, input.userId), eq(userClients.clientId, input.clientId)));
            } else {
                await db.assignUserToClient(input.userId, input.clientId, input.role);
            }
            return { success: true };
        }),
    removeFromOrganization: adminProcedure
        .input(z.object({
            userId: z.number(),
            clientId: z.number()
        }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            await dbConn.delete(userClients)
                .where(and(eq(userClients.userId, input.userId), eq(userClients.clientId, input.clientId)));
            return { success: true };
        }),

    impersonate: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }: any) => {
            // Get user email
            const usersList = await db.getDb().then(conn => conn.select().from(users).where(eq(users.id, input.userId)));
            const user = usersList[0];
            if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });

            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                // Fallback for dev/mock: Just return success and frontend handles "fake" login if possible?
                // Or throw error.
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Impersonation requires service role key.' });
            }

            const { supabaseAdmin } = await import('../lib/supabaseAdmin');

            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email: user.email
            });

            if (error) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            }

            // data.properties.action_link contains the URL
            return { url: data.properties.action_link };
        }),

    resetPassword: adminProcedure
        .input(z.object({ userId: z.number() }))
        .mutation(async ({ input }: any) => {
            // Get user email
            const usersList = await db.getDb().then(conn => conn.select().from(users).where(eq(users.id, input.userId)));
            const user = usersList[0];
            if (!user) throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
            if (!user.email) throw new TRPCError({ code: 'BAD_REQUEST', message: 'User has no email address' });

            if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
                throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Password reset requires Supabase service role key.' });
            }

            const { supabaseAdmin } = await import('../lib/supabaseAdmin');

            // Generate a password recovery link
            const { data, error } = await supabaseAdmin.auth.admin.generateLink({
                type: 'recovery',
                email: user.email
            });

            if (error) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
            }

            // Send the password reset email using our custom transporter
            const resetLink = data.properties.action_link;
            await sendEmail({
                to: user.email,
                subject: 'Reset Your ComplianceOS Password',
                html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Password Reset Request</h1>
                            <p>An administrator has requested a password reset for your ComplianceOS account.</p>
                            <p>Click the button below to set a new password:</p>
                            <div style="margin: 24px 0;">
                                <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
                            </div>
                            <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't expect this email, you can ignore it.</p>
                        </div>
                    `
            });

            return { success: true, message: `Password reset email sent to ${user.email}` };
        }),

    listInvitations: adminProcedure
        .query(async () => {
            const dbConn = await db.getDb();
            return await dbConn.select({
                id: userInvitations.id,
                email: userInvitations.email,
                role: userInvitations.role,
                status: userInvitations.status,
                expiresAt: userInvitations.expiresAt,
                inviterName: users.name,
                inviterEmail: users.email
            })
                .from(userInvitations)
                .leftJoin(users, eq(userInvitations.invitedBy, users.id))
                .orderBy(desc(userInvitations.createdAt));
        }),

    invite: adminProcedure
        .input(z.object({
            email: z.string().email(),
            role: z.string()
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();

            // create token
            const token = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            await dbConn.insert(userInvitations).values({
                email: input.email,
                role: input.role,
                invitedBy: ctx.user.id,
                token,
                expiresAt
            });

            // Send actual email
            const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${token}`;

            await sendEmail({
                to: input.email,
                subject: 'You have been invited to ComplianceOS',
                html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                            <h1>Welcome to ComplianceOS</h1>
                            <p>You have been invited to join the organization as a <strong>${input.role}</strong>.</p>
                            <p>Click the button below to accept your invitation and set up your account:</p>
                            <div style="margin: 24px 0;">
                                <a href="${inviteLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
                            </div>
                            <p style="color: #666; font-size: 14px;">This link will expire in 7 days.</p>
                            <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can ignore this email.</p>
                        </div>
                    `
            });

            return { success: true };
        }),

    revokeInvitation: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            await dbConn.update(userInvitations)
                .set({ status: 'revoked' })
                .where(eq(userInvitations.id, input.id));
            return { success: true };
        }),

    deleteInvitation: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }: any) => {
            const dbConn = await db.getDb();
            await dbConn.delete(userInvitations)
                .where(eq(userInvitations.id, input.id));
            return { success: true };
        }),

    applyMagicLink: protectedProcedure
        .input(z.object({
            token: z.string(),
            clientId: z.number().nullish()
        }))
        .mutation(async ({ input, ctx }: any) => {
            const dbConn = await db.getDb();
            const [link] = await dbConn.select()
                .from(magicLinks)
                .where(eq(magicLinks.token, input.token))
                .limit(1);

            if (!link) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Invalid magic link" });
            }

            if (link.status !== 'active') {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Link already used or revoked" });
            }

            if (link.expiresAt && new Date() > link.expiresAt) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Link expired" });
            }

            // Usage Limit Check
            if (link.usageLimit !== null && (link.useCount || 0) >= link.usageLimit) {
                await dbConn.update(magicLinks).set({ status: 'accepted' }).where(eq(magicLinks.id, link.id));
                throw new TRPCError({ code: "BAD_REQUEST", message: "Link usage limit reached" });
            }

            // Prevent double usage by same user
            const [existingRedemption] = await dbConn.select()
                .from(magicLinkRedemptions)
                .where(and(
                    eq(magicLinkRedemptions.magicLinkId, link.id),
                    eq(magicLinkRedemptions.userId, ctx.user.id)
                ))
                .limit(1);

            if (existingRedemption) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "You have already used this link" });
            }

            // Calculate Expiration
            let accessExpiresAt: Date | null = null;
            if (link.accessDurationType === 'limited' && link.accessDurationDays) {
                const d = new Date();
                d.setDate(d.getDate() + link.accessDurationDays);
                accessExpiresAt = d;
            }

            // Domain Restriction Check
            if (link.restrictedDomains && (link.restrictedDomains as string[]).length > 0) {
                const domain = ctx.user.email?.split('@')[1]?.toLowerCase();
                const allowedDomains = (link.restrictedDomains as string[]).map(d => d.toLowerCase());
                if (!domain || !allowedDomains.includes(domain)) {
                    throw new TRPCError({
                        code: "FORBIDDEN",
                        message: `This magic link is restricted to the following domains: ${allowedDomains.join(', ')}`
                    });
                }
            }

            if (input.clientId) {
                // Workspace Invite Logic
                // Add/Update membership
                // Use default 'viewer' if role is not found, or use 'auditor' if it's an auditor invite
                const clientRole = link.role || 'viewer';

                const existing = await db.isUserAllowedForClient(ctx.user.id, input.clientId);
                if (existing) {
                    await dbConn.update(userClients)
                        .set({ role: clientRole as any, accessExpiresAt })
                        .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.clientId, input.clientId)));
                } else {
                    await dbConn.insert(userClients).values({
                        userId: ctx.user.id,
                        clientId: input.clientId,
                        role: clientRole as any,
                        accessExpiresAt
                    });
                }

            } else {
                // Platform Update Logic
                // Special handling for Waitlist-origin links: create a personal workspace and DO NOT elevate global role
                if ((link as any).waitlistId) {
                    const d2 = await db.getDb();
                    // Fetch waitlist lead for company/industry context
                    const { waitingList } = await import("../../schema");
                    const { eq: eq2 } = await import("drizzle-orm");
                    const [lead] = await d2.select().from(waitingList).where(eq2(waitingList.id, (link as any).waitlistId)).limit(1);
                    const orgName = (lead?.company || ctx.user.name || "New Organization").toString();
                    const industry = (lead?.industry || "Technology").toString();
                    try {
                        // Create workspace and assign the user as owner (handled inside onboardClient)
                        await db.onboardClient({
                            name: orgName,
                            industry,
                            userId: ctx.user.id,
                            frameworks: [], // rely on native defaults; admin can configure later
                            companyName: orgName
                        });
                        try {
                            await db.seedSampleData(ctx.user.id, {
                                name: `${orgName} DEMO`,
                                industry
                            });
                        } catch (se) { }
                    } catch (e) {
                        // If onboarding fails, still proceed with account updates, but without global role elevation
                        console.error("[applyMagicLink] OnboardClient failed for waitlist link:", e);
                    }
                    // Update account without elevating global role
                    await d2.update(users)
                        .set({
                            planTier: link.planTier as any,
                            // Keep existing role or default to 'viewer'; do NOT set global 'admin' from link
                            role: (ctx.user.role || 'viewer') as any,
                            maxClients: link.maxClients ?? 2,
                            subscriptionStatus: 'active',
                            accessExpiresAt
                        })
                        .where(eq(users.id, ctx.user.id));
                } else {
                    // Original behavior for platform-scoped links (explicit admin-managed platform invites)
                    await dbConn.update(users)
                        .set({
                            planTier: link.planTier as any,
                            role: link.role as any,
                            maxClients: link.maxClients ?? 2,
                            subscriptionStatus: 'active',
                            accessExpiresAt
                        })
                        .where(eq(users.id, ctx.user.id));
                }
            }

            // Record Redemption & Update Usage
            const newUseCount = (link.useCount || 0) + 1;
            const reachedLimit = link.usageLimit !== null && newUseCount >= link.usageLimit;

            await dbConn.update(magicLinks)
                .set({
                    useCount: newUseCount,
                    status: reachedLimit ? 'accepted' : 'active',
                })
                .where(eq(magicLinks.id, link.id));

            await dbConn.insert(magicLinkRedemptions).values({
                magicLinkId: link.id,
                userId: ctx.user.id,
            });

            return { success: true, planTier: link.planTier };
        })

});
