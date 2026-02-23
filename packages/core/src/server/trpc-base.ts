import "../polyfill";
import { initTRPC } from "@trpc/server";
import { Context } from "./context";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape, error, path, type }) {
        // Log the error on the server for easier debugging of "unexpected end of data" issues
        console.error(`[TRPC Error] ${type} on path "${path}":`, {
            message: error.message,
            code: shape.data.code,
            stack: error.stack?.split('\n').slice(0, 3).join('\n') // Just first 3 lines
        });

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

export { t };
