
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { users } from "../schema";
export type User = typeof users.$inferSelect;

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
    // Extract user from session or headers (handled by authMiddleware)
    const user = (req as any).user as User | undefined;
    const clientId = req.headers['x-client-id'] ? parseInt(req.headers['x-client-id'] as string) : null;
    const aal = (req as any).aal as 'aal1' | 'aal2' | null;

    // Track auth header presence for better error messages
    const authHeader = req.headers.authorization;
    const hasAuthHeader = !!authHeader;
    const authHeaderPrefix = authHeader ? authHeader.substring(0, 20) + '...' : null;
    
    // Get info from middleware
    const middlewareAuthInfo = (req as any).authInfo || {};

    return {
        req,
        res,
        user,
        clientId,
        aal,
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        // Auth debugging info for better error messages
        authInfo: {
            hasAuthHeader,
            authHeaderPrefix,
            isTrpcRequest: req.url?.startsWith('/api/trpc') || false,
            ...middlewareAuthInfo
        }
    };
};


export type Context = inferAsyncReturnType<typeof createContext>;
