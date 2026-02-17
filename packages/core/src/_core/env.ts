import { z } from 'zod';

const getEnv = (key: string, defaultValue: string = ""): string => {
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key] || defaultValue;
    }
    return defaultValue;
};

export const ENV = {
    forgeApiUrl: getEnv('BUILT_IN_FORGE_API_URL'),
    forgeApiKey: getEnv('BUILT_IN_FORGE_API_KEY'),
    ownerOpenId: getEnv('OWNER_OPEN_ID', 'user_default'),
    databaseUrl: getEnv('DATABASE_URL'),
    rateLimitWindowMs: Number(getEnv('RATE_LIMIT_WINDOW_MS', '60000')),
    rateLimitMax: Number(getEnv('RATE_LIMIT_MAX', '200')),
    corsOrigin: getEnv('CORS_ORIGIN'),
};

export function validateEnv() {
    if (typeof process === 'undefined') return;
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
