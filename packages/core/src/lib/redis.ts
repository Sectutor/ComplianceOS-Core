import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_HOST && process.env.REDIS_PORT) {
    console.log('[Redis] Connecting to Redis at', `${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`);

    try {
        redis = new Redis({
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD || undefined,
            db: Number(process.env.REDIS_DB) || 0,
            retryStrategy(times) {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3,
        });

        redis.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });

        redis.on('error', (err) => {
            console.error('[Redis] Connection error:', err);
        });

    } catch (error) {
        console.error('[Redis] Initialization failed:', error);
        redis = null;
    }
} else {
    console.log('[Redis] Configuration missing, skipping initialization (REDIS_HOST/REDIS_PORT not set)');
}

export default redis;

// Simple cache helper
export const cache = {
    async get(key: string): Promise<string | null> {
        if (!redis) return null;
        try {
            return await redis.get(key);
        } catch (e) {
            console.error(`[Redis] GET error for ${key}:`, e);
            return null;
        }
    },

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!redis) return;
        try {
            if (ttlSeconds) {
                await redis.set(key, value, 'EX', ttlSeconds);
            } else {
                await redis.set(key, value);
            }
        } catch (e) {
            console.error(`[Redis] SET error for ${key}:`, e);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (e) {
            console.error(`[Redis] DEL error for ${key}:`, e);
        }
    },

    /**
     * Cache a value with a specific dashboard TTL or generic API TTL
     */
    async cacheResult(key: string, fetcher: () => Promise<any>, ttlOverride?: number): Promise<any> {
        const cached = await this.get(key);
        if (cached) return JSON.parse(cached);

        const result = await fetcher();
        const ttl = ttlOverride || Number(process.env.CACHE_TTL_API_RESPONSE) || 60;
        await this.set(key, JSON.stringify(result), ttl);
        return result;
    }
};

/**
 * Distributed Rate Limiter
 * Returns true if the request should be limited
 */
export const rateLimiter = {
    async isRateLimited(identifier: string, limit: number, windowMs: number): Promise<boolean> {
        if (!redis) return false; // Fail open if Redis is down

        const key = `ratelimit:${identifier}`;
        try {
            const current = await redis.incr(key);
            if (current === 1) {
                await redis.expire(key, Math.floor(windowMs / 1000));
            }
            return current > limit;
        } catch (e) {
            console.error('[Redis] Rate limit error:', e);
            return false;
        }
    }
};
