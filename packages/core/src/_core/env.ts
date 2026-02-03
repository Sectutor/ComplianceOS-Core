import { z } from 'zod';

export const ENV = {
    forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL || "",
    forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY || "",
    ownerOpenId: process.env.OWNER_OPEN_ID || "user_default",
    databaseUrl: process.env.DATABASE_URL,
    rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
    rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
    corsOrigin: process.env.CORS_ORIGIN || "",
};

export function validateEnv() {
    const schema = z.object({
        DATABASE_URL: z.string().min(1),
    });
    schema.parse({ DATABASE_URL: process.env.DATABASE_URL || '' });
}

export function getCorsOrigins(): (string | RegExp)[] {
    const raw = ENV.corsOrigin.trim();
    if (!raw) return [];
    return raw.split(',').map(x => x.trim()).filter(Boolean);
}
