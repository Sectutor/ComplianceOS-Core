
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { Context } from "./context";
import * as db from "../db";
import * as schema from "../schema";
import { userClients } from "../schema";
import { eq, and } from "drizzle-orm";

const t = initTRPC.context<Context>().create({
    transformer: superjson,
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
    return next({
        ctx: {
            user: ctx.user,
        },
    });
});

export const isAdmin = middleware(async ({ ctx, next }) => {
    if (ctx.user?.role !== 'admin' && ctx.user?.role !== 'owner') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }
    return next();
});

export const checkClientAccess = middleware(async (opts) => {
    const { ctx, next } = opts;
    const rawInput = (opts as any).rawInput;

    if (!ctx.user) throw new TRPCError({ code: 'UNAUTHORIZED' });

    const input = rawInput as any;
    const clientId = input?.clientId || ctx.clientId;

    // Admins have implicit access
    if (ctx.user.role === 'admin' || ctx.user.role === 'owner') {
        return next({ ctx: { ...ctx, clientId, clientRole: 'owner' } });
    }

    if (!clientId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Client ID is required for this operation' });
    }

    const dbConn = await db.getDb();
    const membership = await dbConn.select().from(userClients)
        .where(and(eq(userClients.userId, ctx.user.id), eq(userClients.clientId, clientId)))
        .limit(1);

    if (membership.length === 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this client workspace' });
    }

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

    if (ctx.user?.role === 'admin' || ctx.user?.role === 'owner') {
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

export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(isAuthed).use(isAdmin);
export const clientProcedure = publicProcedure.use(isAuthed).use(checkClientAccess);
export const clientEditorProcedure = clientProcedure.use(checkClientEditor);
export const premiumClientProcedure = clientProcedure.use(checkPremiumAccess);
