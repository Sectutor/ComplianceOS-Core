
import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { users } from "../schema";
export type User = typeof users.$inferSelect;

export const createContext = ({ req, res }: CreateExpressContextOptions) => {
    // Extract user from session or headers (handled by authMiddleware)
    const user = (req as any).user as User | undefined;
    const clientId = req.headers['x-client-id'] ? parseInt(req.headers['x-client-id'] as string) : null;
    const aal = (req as any).aal as 'aal1' | 'aal2' | null;

    return {
        req,
        res,
        user,
        clientId,
        aal,
    };
};

export type Context = inferAsyncReturnType<typeof createContext>;
