
import { z } from "zod";
import { TRPCError } from "@trpc/server";

import * as db from "../../db";
import * as schema from "../../schema";
import { clients, userClients } from "../../schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { generateGapAnalysisReport } from "../../lib/reporting";
import { sendEmail } from "../../lib/email/transporter";

export const createClientsRouter = (t: any, adminProcedure: any, clientProcedure: any, clientEditorProcedure: any, publicProcedure: any, isAuthed: any) => {
    return t.router({
        list: publicProcedure
            .use(isAuthed)
            .input(z.any())
            .query(async ({ ctx }: any) => {
                const dbConn = await db.getDb();
                console.log('[DEBUG] clients.list called');
                console.log('[DEBUG] ctx.user:', JSON.stringify(ctx.user, null, 2));

                // Admins/owners: list all clients
                if (ctx.user?.role === 'admin' || ctx.user?.role === 'owner') {
                    console.log('[DEBUG] Admin path taken');
                    const all = await dbConn.select({
                        id: clients.id,
                        name: clients.name,
                        description: clients.description,
                        industry: clients.industry,
                        size: clients.size,
                        updatedAt: clients.updatedAt,
                        createdAt: clients.createdAt, // Added
                        status: clients.status,
                        logoUrl: clients.logoUrl,
                        planTier: clients.planTier, // Added
                        activeModules: clients.activeModules, // Added
                        brandPrimaryColor: clients.brandPrimaryColor,
                        brandSecondaryColor: clients.brandSecondaryColor,
                        portalTitle: clients.portalTitle,
                    }).from(clients).orderBy(desc(clients.updatedAt));
                    console.log('[DEBUG] Admin listing clients count:', all.length);
                    // Log first client ID if available to verify data structure
                    if (all.length > 0) {
                        console.log('[DEBUG] Sample client ID:', all[0].id);
                    }
                    // Ensure dates are serializable
                    return all.map((c: any) => ({
                        ...c,
                        updatedAt: c.updatedAt?.toString() || null,
                        createdAt: c.createdAt?.toString() || null, // Added serialization
                    }));
                }

                // Else list clients by membership
                console.log('[DEBUG] User path taken');
                const rows = await dbConn.select({
                    id: clients.id,
                    name: clients.name,
                    description: clients.description,
                    industry: clients.industry,
                    size: clients.size,
                    updatedAt: clients.updatedAt,
                    createdAt: clients.createdAt, // Added
                    status: clients.status,
                    logoUrl: clients.logoUrl,
                    planTier: clients.planTier, // Added
                    activeModules: clients.activeModules, // Added
                    brandPrimaryColor: clients.brandPrimaryColor,
                    brandSecondaryColor: clients.brandSecondaryColor,
                    portalTitle: clients.portalTitle,
                })
                    .from(userClients)
                    .innerJoin(clients, eq(userClients.clientId, clients.id))
                    .where(eq(userClients.userId, ctx.user!.id));

                console.log('[DEBUG] User listing clients count:', rows.length);
                return rows.map((c: any) => ({
                    ...c,
                    updatedAt: c.updatedAt?.toString() || null,
                    createdAt: c.createdAt?.toString() || null,
                }));
            }),
        get: clientProcedure
            .input(z.object({ id: z.number() }))
            .query(async ({ input, ctx }: any) => {
                // Explicit security check since input is 'id' not 'clientId'
                if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner') {
                    const dbConn = await db.getDb();
                    const membership = await dbConn.select().from(schema.userClients)
                        .where(and(eq(schema.userClients.userId, ctx.user.id), eq(schema.userClients.clientId, input.id)))
                        .limit(1);
                    if (membership.length === 0) throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client workspace' });
                }
                const client = await db.getClientById(input.id);
                if (!client) throw new TRPCError({ code: 'NOT_FOUND' });
                return client;
            }),
        getComplianceScore: clientProcedure // Dashboard Score
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();

                // Get total controls for client
                const totalControls = await dbConn.select({ count: sql<number>`count(*)` })
                    .from(schema.clientControls)
                    .where(eq(schema.clientControls.clientId, input.clientId));

                // Get implemented controls 
                const implementedControls = await dbConn.select({ count: sql<number>`count(*)` })
                    .from(schema.clientControls)
                    .where(and(
                        eq(schema.clientControls.clientId, input.clientId),
                        eq(schema.clientControls.status, 'implemented')
                    ));

                // Get evidence stats
                const evidenceStats = await dbConn.select({
                    verified: sql<number>`count(*) filter (where status = 'verified')`,
                    pending: sql<number>`count(*) filter (where status = 'pending')`,
                    expired: sql<number>`count(*) filter (where status = 'expired')`,
                })
                    .from(schema.evidence)
                    .where(eq(schema.evidence.clientId, input.clientId));

                const total = Number(totalControls[0]?.count || 0);
                const implemented = Number(implementedControls[0]?.count || 0);
                const complianceScore = total > 0 ? Math.round((implemented / total) * 100) : 0;

                return {
                    complianceScore,
                    totalControls: total,
                    implementedControls: implemented,
                    evidenceStatus: {
                        verified: Number(evidenceStats[0]?.verified || 0),
                        pending: Number(evidenceStats[0]?.pending || 0),
                        expired: Number(evidenceStats[0]?.expired || 0),
                    }
                };
            }),
        getPolicyCoverageAnalysis: clientProcedure // Dashboard Coverage
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const dbConn = await db.getDb();

                // Get total controls
                const totalControls = await dbConn.select({ count: sql<number>`count(*)` })
                    .from(schema.clientControls)
                    .where(eq(schema.clientControls.clientId, input.clientId));

                // Get mapped controls (controls that have policy mappings)
                const mappedControls = await dbConn.select({ count: sql<number>`count(distinct ${schema.controlPolicyMappings.clientControlId})` })
                    .from(schema.controlPolicyMappings)
                    .innerJoin(schema.clientControls, eq(schema.controlPolicyMappings.clientControlId, schema.clientControls.id))
                    .where(eq(schema.clientControls.clientId, input.clientId));

                const total = Number(totalControls[0]?.count || 0);
                const mapped = Number(mappedControls[0]?.count || 0);
                const unmapped = total - mapped;
                const coveragePercentage = total > 0 ? Math.round((mapped / total) * 100) : 0;

                return {
                    totalControls: total,
                    mappedControls: mapped,
                    unmappedControls: unmapped,
                    coveragePercentage
                };
            }),
        getOnboardingStatus: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                const d = await db.getDb();

                // Pillar 1: Frameworks (Check if any controls exist)
                const controlsCount = await d.select({ count: sql<number>`count(*)` })
                    .from(schema.clientControls)
                    .where(eq(schema.clientControls.clientId, input.clientId));

                // Pillar 2: Users (Check if more than 1 user client exists)
                const usersCount = await d.select({ count: sql<number>`count(*)` })
                    .from(schema.userClients)
                    .where(eq(schema.userClients.clientId, input.clientId));

                // Pillar 3: Policies (Check for approved/review policies)
                const policiesCount = await d.select({ count: sql<number>`count(*)` })
                    .from(schema.clientPolicies)
                    .where(eq(schema.clientPolicies.clientId, input.clientId));

                // Pillar 4: Evidence (Check for any uploaded evidence)
                const evidenceCount = await d.select({ count: sql<number>`count(*)` })
                    .from(schema.evidence)
                    .where(eq(schema.evidence.clientId, input.clientId));

                return {
                    hasFrameworks: Number(controlsCount[0]?.count || 0) > 0,
                    hasUsers: Number(usersCount[0]?.count || 0) > 1, // More than just the owner
                    hasControls: Number(controlsCount[0]?.count || 0) > 0,
                    hasPolicies: Number(policiesCount[0]?.count || 0) > 0,
                    hasEvidence: Number(evidenceCount[0]?.count || 0) > 0
                };
            }),
        create: publicProcedure.use(isAuthed)
            .input(z.object({
                name: z.string(),
                description: z.string().optional(),
                industry: z.string().optional(),
                size: z.string().optional(),
                // New fields for Onboarding & Invite
                adminEmail: z.string().email().optional().or(z.literal("")),
                welcomeMessage: z.string().optional(),
                frameworks: z.array(z.string()).optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    console.log(`[Clients] Creating client (Enhanced): ${input.name} (Admin: ${ctx.user?.id})`);
                    const fullUser = await db.getUserById(ctx.user.id);

                    // 1. Check Limits for the Creator (if not admin)
                    const d = await db.getDb();
                    const userOrgs = await d.select({ count: sql<number>`count(*)` })
                        .from(schema.userClients)
                        .where(and(
                            eq(schema.userClients.userId, ctx.user.id),
                            eq(schema.userClients.role, 'owner')
                        ));

                    const currentCount = Number(userOrgs[0]?.count || 0);
                    const limit = fullUser?.maxClients || 2;

                    // Admins/Internal Owners bypass limit
                    if (currentCount >= limit && ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: `Organization Limit Reached: Your current plan allows for ${limit} organizations. Please upgrade to add more.`
                        });
                    }

                    // 2. Determine Owner User (Create if needed)
                    let ownerUserId = ctx.user.id;
                    let isNewUser = false;
                    let targetEmail = input.adminEmail;

                    if (input.adminEmail && input.adminEmail !== ctx.user.email) {
                        let existingUser = await db.getUserByEmail(input.adminEmail);
                        if (!existingUser) {
                            console.log(`[Clients] Creating new user for org: ${input.adminEmail}`);
                            // Create temp user
                            const randomPassword = Math.random().toString(36).slice(-8);
                            existingUser = await db.createUser({
                                email: input.adminEmail,
                                name: input.adminEmail.split('@')[0],
                                password: randomPassword // They should reset this
                            });
                            isNewUser = true;
                        }
                        ownerUserId = existingUser.id;
                    }

                    // 3. Call Onboard Process (Creates Client, Assigns Owner, Generates Policies/Controls)
                    // Note: onboardClient takes framesworks and companyName
                    const result = await db.onboardClient({
                        name: input.name,
                        industry: input.industry || 'Technology',
                        userId: ownerUserId,
                        frameworks: input.frameworks || [],
                        companyName: input.name
                    });

                    // 4. Update additional metadata (Description, Size) which onboardClient doesn't handle
                    if (input.description || input.size) {
                        await db.updateClient(result.id, {
                            description: input.description,
                            size: input.size
                        });
                    }

                    // 5. If we created it for someone else, ensure the Creator (Admin) also has access?
                    // If I am Admin creating for User B, User B is Owner. 
                    // Admin (me) might want access too?
                    // Typically Admins have global access, so we don't strictly need to add them to `user_clients`.
                    // But if it's a regular user creating for another? (Unlikely given permissions).


                    // 6. Send Email Notification
                    if (targetEmail) {
                        const loginLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/login`;
                        const defaultMsg = `You have been added as an administrator for the new organization <strong>${input.name}</strong> on ComplianceOS.`;

                        await sendEmail({
                            to: targetEmail,
                            subject: `Welcome to ${input.name} on ComplianceOS`,
                            html: `
                                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                                    <h2 style="color: #1a1a1a;">Welcome to ComplianceOS</h2>
                                    <p>${input.welcomeMessage ? input.welcomeMessage.replace(/\n/g, '<br/>') : defaultMsg}</p>
                                    
                                    <div style="margin: 24px 0; background-color: #f9f9f9; padding: 16px; border-radius: 4px;">
                                        <strong>Organization:</strong> ${input.name}<br/>
                                        <strong>Role:</strong> Owner
                                    </div>

                                    ${isNewUser ? `<p>Your account has been created. Please use the "Forgot Password" function to set your password.</p>` : ''}
                                    
                                    <div style="margin: 24px 0;">
                                        <a href="${loginLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access Dashboard</a>
                                    </div>
                                    
                                    <p style="color: #666; font-size: 14px;">If you didn't expect this, please contact support.</p>
                                </div>
                            `
                        });
                        console.log(`[Clients] Email sent to ${targetEmail}`);
                    }

                    console.log(`[Clients] Created client ID: ${result.id}`);
                    return result;
                } catch (error: any) {
                    console.error('[Clients] Create Error:', error);
                    if (error instanceof TRPCError) throw error;
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to create client: ${error.message || 'Unknown error'}`
                    });
                }
            }),
        onboard: publicProcedure.use(isAuthed)
            .input(z.object({
                name: z.string(),
                industry: z.string(),
                frameworks: z.array(z.string()).default([]),
                companyName: z.string(), // For policies
                generatePolicies: z.boolean().default(true),
            }))
            .mutation(async ({ input, ctx }: any) => {
                try {
                    console.log(`[Clients] Onboarding client: ${input.name} (User: ${ctx.user?.id})`);
                    const d = await db.getDb();
                    const fullUser = await db.getUserById(ctx.user.id);

                    // Check Limits
                    const userOrgs = await d.select({ count: sql<number>`count(*)` })
                        .from(schema.userClients)
                        .where(and(
                            eq(schema.userClients.userId, ctx.user.id),
                            eq(schema.userClients.role, 'owner')
                        ));

                    const currentCount = Number(userOrgs[0]?.count || 0);
                    const limit = fullUser?.maxClients || 2;

                    if (currentCount >= limit && ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
                        throw new TRPCError({
                            code: 'FORBIDDEN',
                            message: `Organization Limit Reached: Your current plan allows for ${limit} organizations.`
                        });
                    }

                    // Transactional Onboarding
                    const result = await db.onboardClient({
                        name: input.name,
                        industry: input.industry,
                        userId: ctx.user.id,
                        frameworks: input.frameworks,
                        companyName: input.companyName
                    });

                    console.log(`[Clients] Onboarded client ID: ${result.id}`);
                    return result;

                } catch (error: any) {
                    console.error('[Clients] Onboard Error:', error);
                    if (error instanceof TRPCError) throw error;
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Failed to onboard client: ${error.message || 'Unknown error'}`
                    });
                }
            }),
        autoSetup: publicProcedure.use(isAuthed)
            .input(z.object({
                name: z.string(),
                industry: z.string(),
                frameworks: z.array(z.string()),
                generatePolicies: z.boolean().default(true),
                includeSampleData: z.boolean().default(false),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (!ctx.user) {
                    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not found in context' });
                }

                // Check Limits
                const d = await db.getDb();
                const fullUser = await db.getUserById(ctx.user.id);
                const userOrgs = await d.select({ count: sql<number>`count(*)` })
                    .from(schema.userClients)
                    .where(and(
                        eq(schema.userClients.userId, ctx.user.id),
                        eq(schema.userClients.role, 'owner')
                    ));

                const currentCount = Number(userOrgs[0]?.count || 0);
                const limit = fullUser?.maxClients || 2;

                if (currentCount >= limit && ctx.user.role !== 'admin' && ctx.user.role !== 'owner') {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: `Organization Limit Reached: Your current plan allows for ${limit} organizations. Please upgrade to add more.`
                    });
                }

                // 1. Transactional Setup for Main Client
                const client = await db.onboardClient({
                    name: input.name,
                    industry: input.industry,
                    userId: ctx.user.id,
                    frameworks: input.frameworks,
                    companyName: input.name
                });

                // 2. (Removed individual steps as they are covered by onboardClient)

                // 3. Always create a second "DEMO" Client with sample data fo new users
                try {
                    await db.seedSampleData(ctx.user.id, {
                        name: `${input.name} DEMO`,
                        industry: input.industry
                    });
                } catch (err) {
                    console.error("Failed to create secondary demo organization:", err);
                    // We don't fail the whole request if the demo org fails
                }

                return client;
            }),
        createSampleData: publicProcedure.use(isAuthed)
            .input(z.object({
                name: z.string(),
                industry: z.string(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                if (!ctx.user) {
                    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'You must be logged in to create sample data' });
                }
                return await db.seedSampleData(ctx.user.id, {
                    name: input.name,
                    industry: input.industry
                });
            }),
        importDemoData: clientProcedure
            .input(z.object({
                clientId: z.number(),
                industry: z.string().optional(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const client = await db.getClientById(input.clientId);
                if (!client) throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });

                try {
                    console.log(`Starting demo data import for client ${input.clientId} (${client.name})`);
                    const result = await db.seedSampleData(ctx.user.id, {
                        name: client.name,
                        industry: input.industry || client.industry || 'Technology',
                        clientId: input.clientId
                    });
                    console.log(`Demo data import completed for client ${input.clientId}`);
                    return result;
                } catch (error: any) {
                    console.error(`Demo data import failed for client ${input.clientId}:`, error);
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Import failed: ${error.message || 'Unknown error'}`
                    });
                }
            }),
        update: publicProcedure.use(isAuthed)
            .input(z.object({
                id: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                industry: z.string().optional(),
                size: z.string().optional(),
                status: z.string().optional(),
                notes: z.string().optional(),
                primaryContactName: z.string().optional(),
                primaryContactEmail: z.string().optional(),
                primaryContactPhone: z.string().optional(),
                cisoName: z.string().optional(),
                dpoName: z.string().optional(),
                headquarters: z.string().optional(),
                mainServiceRegion: z.string().optional(),
                deploymentType: z.string().optional(),
                region: z.string().optional(),
                clientTier: z.string().optional(),
                logoUrl: z.string().nullable().optional(),
                policyLanguage: z.string().optional(),
                legalEntityName: z.string().optional(),
                regulatoryJurisdictions: z.array(z.string()).optional(),
                defaultDocumentClassification: z.string().optional(),
                // New Plan/Module Fields
                planTier: z.string().optional(),
                activeModules: z.array(z.string()).optional(),
                // Branding
                brandPrimaryColor: z.string().optional().nullable(),
                brandSecondaryColor: z.string().optional().nullable(),
                portalTitle: z.string().optional().nullable(),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const { id, ...data } = input;

                // Security Check: Allow Global Admins OR Client Admins
                if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner') {
                    const isAllowed = await db.isUserAllowedForClient(ctx.user.id, id, 'admin');
                    if (!isAllowed) {
                        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not have permission to update this client.' });
                    }
                }

                await db.updateClient(id, data);
                return { success: true };
            }),
        getUsers: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await db.getClientUsers(input.clientId);
            }),
        inviteUser: clientEditorProcedure
            .input(z.object({
                clientId: z.number(),
                email: z.string().email(),
                role: z.enum(['owner', 'editor', 'viewer']).default('viewer'),
            }))
            .mutation(async ({ input, ctx }: any) => {
                const client = await db.getClientById(input.clientId);
                if (!client) throw new TRPCError({ code: "NOT_FOUND", message: "Client not found" });

                const { getPlanLimits } = await import("../../lib/limits");
                const limits = getPlanLimits(client.planTier);

                if (limits.maxUsers !== Infinity) {
                    const currentUsers = await db.getClientUsers(input.clientId);
                    if (currentUsers.length >= limits.maxUsers) {
                        throw new TRPCError({
                            code: "FORBIDDEN",
                            message: `Plan limit reached. Your ${client.planTier || 'free'} plan allows a maximum of ${limits.maxUsers} users. Please upgrade to Pro.`
                        });
                    }
                }

                let user = await db.getUserByEmail(input.email);
                if (!user) {
                    user = await db.createUser({
                        email: input.email,
                        name: input.email.split('@')[0],
                        password: 'temp_password_123'
                    });
                }
                if (user) {
                    const existing = await db.isUserAllowedForClient(user.id, input.clientId);
                    if (!existing) {
                        await db.assignUserToClient(user.id, input.clientId, input.role);
                    }
                }
                return { success: true };
            }),
        delete: adminProcedure
            .input(z.object({ id: z.number() }))
            .mutation(async ({ input }: any) => {
                await db.deleteClient(input.id);
                return { success: true };
            }),
        stats: publicProcedure
            .input(z.object({ clientId: z.number() }))
            .query(async ({ input }: any) => {
                return await db.getClientStats(input.clientId);
            }),
        removeLogo: adminProcedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                await db.updateClient(input.clientId, { logoUrl: null });
                return { success: true };
            }),
        updateContactInfo: adminProcedure
            .input(z.object({
                clientId: z.number(),
                primaryContactName: z.string().optional(),
                primaryContactEmail: z.string().email().optional().or(z.literal("")),
                primaryContactPhone: z.string().optional(),
                address: z.string().optional(),
                serviceModel: z.string().optional(),
                weeklyFocus: z.string().optional(),
            }))
            .mutation(async ({ input }: any) => {
                const { clientId, ...updateData } = input;
                await db.updateClient(clientId, updateData);
                const updated = await db.getClientById(clientId);
                return { success: true, client: updated };
            }),
        generateReport: clientProcedure
            .input(z.object({ clientId: z.number() }))
            .mutation(async ({ input }: any) => {
                const buffer = await generateGapAnalysisReport(input.clientId);
                return {
                    filename: `compliance-report-${new Date().toISOString().split('T')[0]}.pdf`,
                    pdfBase64: buffer.toString('base64')
                };
            }),
        setTargetScore: clientProcedure
            .input(z.object({ clientId: z.number(), targetScore: z.number().min(0).max(100) }))
            .mutation(async ({ input }: any) => {
                await db.updateClient(input.clientId, { targetComplianceScore: input.targetScore });
                return { success: true };
            })
    });
};
