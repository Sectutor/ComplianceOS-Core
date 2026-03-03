import { TRPCError } from "@trpc/server";
import * as db from "../db";
import * as schema from "../schema";
import { userClients } from "../schema";
import { eq, and, asc } from "drizzle-orm";
import { rateLimiter } from "../lib/redis";
import { router, publicProcedure, middleware, t } from "./trpc-base";
export { router, publicProcedure, middleware, t };

// Import enterprise middlewares after defining base exports to avoid circular dependency issues
import { performanceTracker, auditLogger } from "./enterprise-middleware";

// Debug flag for auth logging - disabled in production by default
const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true';

export const PLATFORM_ADMIN_ROLES = ['admin', 'owner', 'super_admin', 'super', 'enterprise_admin', 'ent_admin'];

// Helper function for conditional debug logging
const debugLog = (message: string, ...args: any[]) => {
    if (DEBUG_AUTH) {
        console.log(message, ...args);
    }
};

// Helper function for conditional debug error logging
const debugError = (message: string, ...args: any[]) => {
    if (DEBUG_AUTH) {
        console.error(message, ...args);
    }
};

export const isAuthed = middleware(async ({ ctx, next, path }) => {
    debugLog(`[isAuthed Debug] Checking auth for path: ${path}, user present: ${!!ctx.user}`);

    if (!ctx.user) {
        debugError(`[isAuthed Debug] UNAUTHORIZED for path: ${path}`);

        // Provide specific error message based on auth header presence
        const authInfo = (ctx as any).authInfo;
        let message = "Authentication required. Please sign in.";

        if (authInfo) {
            if (!authInfo.hasAuthHeader) {
                message = "No authentication token provided. Please sign in.";
            } else if (!authInfo.supabaseUser) {
                message = "Invalid or expired session. Please sign in again.";
            } else if (!authInfo.dbUser) {
                message = "Your account was not found in our database. Please contact support.";
            }
        }

        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: message
        });
    }

    debugLog(`[isAuthed Debug] Auth successful for user: ${ctx.user.id}`);

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

/**
 * Enterprise Rate Limiting Middleware - AL 3 Tiered Implementation
 */
export const rateLimit = middleware(async ({ ctx, next, path }) => {
    // Skip rate limiting if disabled in env
    if (process.env.RATE_LIMITING_ENABLED !== 'true') return next();

    const isAuthed = !!ctx.user;
    const isPremium = (ctx as any).isPremium;
    const isSensitive = path.includes('ai') || path.includes('auth') || path.includes('users.create') || path.includes('export');

    const identifier = ctx.user?.id?.toString() || ctx.ip || 'anonymous';

    // Tiered Logic
    let limit = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;
    if (!isAuthed) limit = Math.ceil(limit / 2); // Unauthed is 50% stricter
    if (isPremium) limit = limit * 2; // Premium has 2x capacity
    if (isSensitive) limit = Math.min(limit, 10); // Sensitive paths limited to 10 per window

    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000;

    const limited = await rateLimiter.isRateLimited(`rl:${path}:${identifier}`, limit, windowMs);

    if (limited) {
        throw new TRPCError({
            code: 'TOO_MANY_REQUESTS',
            message: isSensitive
                ? 'Rate limit exceeded for sensitive operation. Please wait before trying again.'
                : 'Too many requests. Please try again later.'
        });
    }

    return next();
});

export const isAdmin = middleware(async ({ ctx, next, path }) => {
    if (!PLATFORM_ADMIN_ROLES.includes(ctx.user?.role || '')) {
        debugLog(`[isAdmin Debug] Forbidden access attempt for path ${path} by user ${ctx.user?.id} (${ctx.user?.role})`);
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required. Current role: " + (ctx.user?.role || 'none') });
    }
    return next();
});

export const checkClientAccess = middleware(async (opts) => {
    const { ctx, next, path } = opts;
    const rawInput = (opts as any).rawInput;
    const typedInput = (opts as any).input; // Try to get parsed input

    if (!ctx.user) {
        debugError(`[checkClientAccess Debug] UNAUTHORIZED for path: ${path}`);
        throw new TRPCError({ code: 'UNAUTHORIZED', message: "Authentication required for client access." });
    }

    const input = typedInput || rawInput || {};
    const clientId = input?.clientId || input?.id || ctx.clientId;

    // Admins have implicit access
    if (PLATFORM_ADMIN_ROLES.includes(ctx.user.role || '')) {
        debugLog('[DEBUG checkClientAccess] Admin access granted to clientId:', clientId);
        return next({ ctx: { ...ctx, clientId, clientRole: 'owner' } });
    }

    if (!clientId) {
        debugLog('[DEBUG checkClientAccess] No clientId found for path:', path);
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Client ID is required for this operation' });
    }

    const dbConn = await db.getDb();
    const membership = await dbConn.select().from(userClients)
        .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.clientId, clientId)))
        .limit(1);

    debugLog('[DEBUG checkClientAccess] Membership check:', { userId: ctx.user.id, clientId, found: membership.length > 0 });

    // SECURITY: Allow admin/super_admin users to access any client workspace without membership.
    // This is intentional - admins need cross-client access for platform management.
    if (membership.length === 0 && !PLATFORM_ADMIN_ROLES.includes(ctx.user.role || '')) {
        debugLog('[DEBUG checkClientAccess] No membership found and not admin');
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client workspace. Membership required.' });
    }


    if (membership.length > 0) {
        if (membership[0].accessExpiresAt && new Date() > membership[0].accessExpiresAt) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Your access to this workspace has expired."
            });
        }
    }

    // Get member for later use (may be null for admins)
    const member = membership.length > 0 ? membership[0] : null;

    // ARCHITECTURE ENFORCEMENT: Community Edition Single-Tenancy
    // This cannot be overridden by database values.
    if (process.env.VITE_ENABLE_PREMIUM === 'false') {
        // In Community Edition, authorized users can only access their FIRST workspace.
        const allMemberships = await dbConn.select()
            .from(userClients)
            .where(eq(userClients.userId, ctx.user.id))
            .orderBy(asc(userClients.joinedAt));

        // If they have multiple (e.g. from a previous trial), they can only access the first one.
        // This effectively renders multi-tenancy dead in the water for the open source build.
        if (allMemberships.length > 0 && allMemberships[0].clientId !== clientId) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Community Edition is limited to a single workspace. Please upgrade to Enterprise for multi-tenancy.'
            });
        }
    }

    // Enforce maxClients limit for owned clients (Premium/Standard limits)
    // Only check if user has a membership record (non-admin users)
    if (member && member.role === 'owner' && process.env.VITE_ENABLE_PREMIUM !== 'false') {
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

    // Allow global admins or client admins/owners to bypass all checks including environment flags
    const clientRole = (ctx as any).clientRole;
    if (PLATFORM_ADMIN_ROLES.includes(ctx.user?.role || '') || clientRole === 'owner' || clientRole === 'admin') {
        return next({ ctx: { ...ctx, isPremium: true } });
    }

    // STRICT CHECK: Premium must be enabled in environment
    // Note: process.env.VITE_ENABLE_PREMIUM works in Node/Server environment if loaded via dotenv
    if (process.env.VITE_ENABLE_PREMIUM === 'false') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Premium features are disabled in this environment. Please upgrade to the Enterprise Edition.'
        });
    }

    if (!clientId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Client context required for premium features' });
    }

    try {
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

/**
 * MFA Enforcement Middleware - AL 3 High Assurance
 * Enforces aal2 for all privileged/sensitive operations.
 */
export const requiresMFA = middleware(async ({ ctx, next, path }) => {
    const aal = (ctx as any).aal;
    const dbUser = ctx.user;
    if (!dbUser) return next();

    // AL 3: Mandatory MFA for all Global Admins and Owners
    const isPrivilegedRole = PLATFORM_ADMIN_ROLES.includes(dbUser.role || '');

    if (aal === 'aal2') return next(); // Already at max level

    const clientId = (ctx as any).clientId;

    try {
        const dbConn = await db.getDb();

        let must = isPrivilegedRole; // Forced for admins

        if (!must && clientId) {
            console.log('[DEBUG requiresMFA] Checking client MFA req for clientId:', clientId);
            // Check specific client's requirement for standard users
            const [client] = await dbConn.select({ requireMfa: schema.clients.requireMfa })
                .from(schema.clients)
                .where(eq(schema.clients.id, clientId))
                .limit(1);
            must = !!client?.requireMfa;
        }

        if (must && aal !== 'aal2') {
            throw new TRPCError({
                code: 'PRECONDITION_FAILED',
                message: isPrivilegedRole
                    ? 'Administrative access requires active Multi-factor Authentication (MFA).'
                    : 'This organization requires Multi-factor authentication to proceed.'
            });
        }
    } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error('[MFA Middleware Error]', err);
        // Don't proceed if there was a database error - fail secure
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to verify MFA requirements'
        });
    }

    return next();
});


/**
 * Demo Mode Guard
 * Blocks all mutations in demo environment, except for authentication-related ones.
 */
export const demoModeGuard = middleware(async ({ ctx, type, path, next }) => {
    if (process.env.VITE_APP_MODE === 'demo' && type === 'mutation') {
        const allowedMutations = ['auth.', 'users.login', 'users.register', 'users.logout'];
        const isAllowed = allowedMutations.some(p => path.startsWith(p));

        if (!isAllowed) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'This is a read-only demo environment. Data modifications are disabled.'
            });
        }
    }
    return next();
});

export const protectedProcedure = publicProcedure.use(rateLimit).use(performanceTracker).use(auditLogger).use(demoModeGuard).use(isAuthed);
export const adminProcedure = protectedProcedure.use(requiresMFA).use(isAdmin);
export const clientProcedure = protectedProcedure.use(requiresMFA).use(checkClientAccess);
export const clientEditorProcedure = clientProcedure.use(checkClientEditor);
export const premiumClientProcedure = clientProcedure.use(checkPremiumAccess);
