import { getDb } from '../db';
import { aiUsageMetrics, clients } from '../schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { logger } from './logger';
import { PLAN_LIMITS, getPlanLimits } from './planLimits';

export { PLAN_LIMITS, getPlanLimits, type PlanTier } from './planLimits';

// AI Quota Management

export interface QuotaStatus {
    allowed: boolean;
    reason?: string;
    usage: {
        requestsThisHour: number;
        requestsToday: number;
        tokensToday: number;
        costTodayCents: number;
    };
    limits: {
        requestsPerHour: number;
        requestsPerDay: number;
        tokensPerDay: number;
        costPerDayCents: number;
    };
}

/**
 * Check if a client has exceeded their AI usage quota
 */
export async function checkAIQuota(
    clientId: number,
    endpoint: string
): Promise<QuotaStatus> {
    const db = await getDb();
    if (!db) {
        logger.warn('Database unavailable for quota check, allowing request');
        return {
            allowed: true,
            usage: { requestsThisHour: 0, requestsToday: 0, tokensToday: 0, costTodayCents: 0 },
            limits: { requestsPerHour: 10, requestsPerDay: 50, tokensPerDay: 50000, costPerDayCents: 100 },
        };
    }

    try {
        // Get client plan tier
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, clientId))
            .limit(1);

        const planTier = client?.planTier || 'free';
        const planLimits = getPlanLimits(planTier);

        const limits = {
            requestsPerHour: planLimits.aiRequestsPerHour,
            requestsPerDay: planLimits.aiRequestsPerDay,
            tokensPerDay: planLimits.aiTokensPerDay,
            costPerDayCents: planLimits.aiCostPerDayCents,
        };

        // Calculate time windows
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Get usage for the past hour
        const [hourlyUsage] = await db
            .select({ count: sql<number>`COUNT(*)::int` })
            .from(aiUsageMetrics)
            .where(and(eq(aiUsageMetrics.clientId, clientId), gte(aiUsageMetrics.createdAt, oneHourAgo)));

        const requestsThisHour = hourlyUsage?.count || 0;

        // Get usage for today
        const [dailyUsage] = await db
            .select({
                count: sql<number>`COUNT(*)::int`,
                totalTokens: sql<number>`COALESCE(SUM(total_tokens), 0)::int`,
                totalCost: sql<number>`COALESCE(SUM(estimated_cost_cents), 0)::int`,
            })
            .from(aiUsageMetrics)
            .where(and(eq(aiUsageMetrics.clientId, clientId), gte(aiUsageMetrics.createdAt, startOfDay)));

        const requestsToday = dailyUsage?.count || 0;
        const tokensToday = dailyUsage?.totalTokens || 0;
        const costTodayCents = dailyUsage?.totalCost || 0;

        const usage = { requestsThisHour, requestsToday, tokensToday, costTodayCents };

        // Check limits
        if (requestsThisHour >= limits.requestsPerHour) {
            return { allowed: false, reason: `Hourly request limit exceeded (${limits.requestsPerHour}/hour)`, usage, limits };
        }
        if (requestsToday >= limits.requestsPerDay) {
            return { allowed: false, reason: `Daily request limit exceeded (${limits.requestsPerDay}/day)`, usage, limits };
        }
        if (tokensToday >= limits.tokensPerDay) {
            return { allowed: false, reason: `Daily token limit exceeded (${limits.tokensPerDay}/day)`, usage, limits };
        }
        if (costTodayCents >= limits.costPerDayCents) {
            return { allowed: false, reason: `Daily cost limit exceeded ($${limits.costPerDayCents / 100}/day)`, usage, limits };
        }

        return { allowed: true, usage, limits };

    } catch (error) {
        logger.error({ message: 'Quota check failed', error });
        return {
            allowed: true,
            usage: { requestsThisHour: 0, requestsToday: 0, tokensToday: 0, costTodayCents: 0 },
            limits: { requestsPerHour: 10, requestsPerDay: 50, tokensPerDay: 50000, costPerDayCents: 100 },
        };
    }
}
