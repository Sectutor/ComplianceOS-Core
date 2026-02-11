
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
import * as db from "../db";
import * as schema from "../schema";
import { userClients } from "../schema";
import { eq, and, asc } from "drizzle-orm";

const t = initTRPC.context<Context>().create({
    // transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            data: {
                ...shape.data,
                zodError: error.cause instanceof Error ? error.cause.message : null,
            },
        };
    },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

export const isAuthed = middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }

    if (ctx.user.accessExpiresAt && new Date() > ctx.user.accessExpiresAt) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your access to ComplianceOS has expired. Please contact support to renew."
        });
    }

    return next({
        ctx: {
            ...ctx,
            user: ctx.user,
        },
    });
});

export const isAdmin = middleware(async ({ ctx, next }) => {
    if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner' && ctx.user?.role !== 'super_admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next();
});

export const checkClientAccess = middleware(async (opts) => {
    const { ctx, next } = opts;
    const rawInput = (opts as any).rawInput;
    const typedInput = (opts as any).input; // Try to get parsed input

    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const input = typedInput || rawInput || {};
    const clientId = input?.clientId || input?.id || ctx.clientId;

    // Admins have implicit access
    if (ctx.user.role === 'admin' || ctx.user.role === 'owner' || ctx.user.role === 'super_admin') {
        console.log('[DEBUG checkClientAccess] Admin access granted');
        return next({ ctx: { ...ctx, clientId, clientRole: 'owner' } });
    }

    if (!clientId) {
        console.log('[DEBUG checkClientAccess] No clientId found - THROWING FORBIDDEN');
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Client ID is required for this operation' });
    }

    const dbConn = await db.getDb();
    const membership = await dbConn.select().from(userClients)
        .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.clientId, clientId)))
        .limit(1);

    console.log('[DEBUG checkClientAccess] Membership check:', { userId: ctx.user.id, clientId, found: membership.length > 0 });

    if (membership.length === 0) {
        console.log('[DEBUG checkClientAccess] No membership found');
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client workspace' });
    }

    const member = membership[0];
    if (member.accessExpiresAt && new Date() > member.accessExpiresAt) {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Your access to this workspace has expired."
        });
    }

    // Enforce maxClients limit for owned clients
    if (member.role === 'owner') {
        const fullUser = await db.getUserById(ctx.user.id);
        const maxClients = fullUser?.maxClients || 2;

        // Get all owned client IDs sorted by creation (oldest first)
        const allOwned = await dbConn.select({ clientId: userClients.clientId })
            .from(userClients)
            .innerJoin(schema.clients, eq(userClients.clientId, schema.clients.id))
            .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.role, 'owner')))
            .orderBy(asc(schema.clients.createdAt));

        const allowedClientIds = allOwned.slice(0, maxClients).map((r: any) => r.clientId);

        if (!allowedClientIds.includes(clientId)) {
            console.log(`[checkClientAccess] Client ${clientId} exceeds maxClients limit (${maxClients}) for user ${ctx.user.id}`);
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: `This workspace exceeds your plan limit of ${maxClients} organizations. Please upgrade or remove excess workspaces.`
            });
        }
    }

    console.log('[DEBUG checkClientAccess] Access granted with role:', membership[0].role);
    return next({ ctx: { ...ctx, clientId, clientRole: membership[0].role } });
});

export const checkClientEditor = middleware(({ ctx, next }) => {
    const clientRole = (ctx as any).clientRole;
    if (clientRole !== 'owner' && clientRole !== 'admin' && clientRole !== 'editor') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Read-only access' });
    }
    return next();
});

export const checkPremiumAccess = middleware(async (opts) => {
    const { ctx, next } = opts;
    const rawInput = (opts as any).rawInput;
    const input = rawInput as any;
    const clientId = input?.clientId || ctx.clientId;

    if (ctx.user?.role === 'admin' || ctx.user?.role === 'owner' || ctx.user?.role === 'super_admin') {
        return next({ ctx: { ...ctx, isPremium: true } });
    }

    if (!clientId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Client context required for premium features' });
    }

    try {
        // STRICT CHECK: Premium must be enabled in environment
        // Note: process.env.VITE_ENABLE_PREMIUM works in Node/Server environment if loaded via dotenv
        if (process.env.VITE_ENABLE_PREMIUM === 'false') {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Premium features are disabled in this environment.'
            });
        }

        const dbConn = await db.getDb();
        const [client] = await dbConn.select({ planTier: schema.clients.planTier })
            .from(schema.clients)
            .where(eq(schema.clients.id, clientId))
            .limit(1);

        if (!client) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
        }

        const isPremium = client.planTier === 'pro' || client.planTier === 'enterprise';
        if (!isPremium) {
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'This feature requires a Pro or Enterprise subscription.'
            });
        }

        return next({ ctx: { ...ctx, isPremium: true } });
    } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error('[PremiumGuard] Error checking premium access:', err);
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to verify subscription status' });
    }
});

export const requiresMFA = middleware(async ({ ctx, next }) => {
    const aal = (ctx as any).aal;
    if (aal === 'aal2') return next(); // Already at max level

    let clientId = (ctx as any).clientId;
    const dbUser = ctx.user;
    if (!dbUser) return next();

    try {
        const dbConn = await db.getDb();

        // Strategy: 
        // 1. If we have a clientId, check that specific client's requirement.
        // 2. If no clientId (global context), check if ANY of the user's memberships require MFA.

        let must = false;
        if (clientId) {
            const [client] = await dbConn.select({ requireMfa: schema.clients.requireMfa })
                .from(schema.clients)
                .where(eq(schema.clients.id, clientId))
                .limit(1);
            must = !!client?.requireMfa;
        } else {
            // Check all memberships for user
            const memberships = await dbConn.select({ requireMfa: schema.clients.requireMfa })
                .from(schema.userClients)
                .innerJoin(schema.clients, eq(schema.userClients.clientId, schema.clients.id))
                .where(eq(schema.userClients.userId, dbUser.id));

            must = memberships.some((m: any) => !!m.requireMfa);
        }

        if (must && aal !== 'aal2') {
            // Second check: Does the user actually have factors enrolled?
            // If they don't have factors, they can't verify 'aal2' anyway.
            // We return next() and let the frontend handle the redirect to enrollment.
            // HOWEVER, if they DO have factors (Supabase currentLevel < nextLevel),
            // then we MUST throw to trigger the challenge modal.

            // Since we don't want to call Supabase Auth API from the backend on every request,
            // we rely on the client-side event listener and aal check in AppWithMFA.
            // But to force the first request to fail, we can throw here if we suspect they need it.

            // For now, let's keep it simple: if Org requires it and AAL is 1, throw.
            // This will trigger the CustomEvent('require-mfa') in main.tsx
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: 'Multi-factor authentication required'
            });
        }
    } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error('[MFA Middleware Error]', err);
    }

    return next();
});

export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = protectedProcedure.use(requiresMFA).use(isAdmin);
export const clientProcedure = protectedProcedure.use(requiresMFA).use(checkClientAccess);
export const clientEditorProcedure = clientProcedure.use(checkClientEditor);
export const premiumClientProcedure = clientProcedure.use(checkPremiumAccess);
