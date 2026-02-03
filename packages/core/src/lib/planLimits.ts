export const PLAN_LIMITS = {
    free: {
        maxPolicies: 10,
        maxUsers: 1,
        maxClients: 1,
        aiEnabled: true,
        allowSelfHosted: false,
        // AI Quotas
        aiRequestsPerHour: 10,
        aiRequestsPerDay: 50,
        aiTokensPerDay: 50000,
        aiCostPerDayCents: 100, // $1/day
    },
    pro: {
        maxPolicies: Infinity,
        maxUsers: 20,
        maxUsersLabel: "Unlimited",
        maxClients: Infinity,
        aiEnabled: true,
        allowSelfHosted: true,
        // AI Quotas
        aiRequestsPerHour: 100,
        aiRequestsPerDay: 500,
        aiTokensPerDay: 500000,
        aiCostPerDayCents: 1000, // $10/day
    },
    enterprise: {
        maxPolicies: Infinity,
        maxUsers: Infinity,
        maxUsersLabel: "Unlimited",
        maxClients: Infinity,
        aiEnabled: true,
        allowSelfHosted: true,
        // AI Quotas
        aiRequestsPerHour: 1000,
        aiRequestsPerDay: 5000,
        aiTokensPerDay: 5000000,
        aiCostPerDayCents: 10000, // $100/day
    }
} as const;

export type PlanTier = keyof typeof PLAN_LIMITS;

export const getPlanLimits = (tier: string | null | undefined) => {
    const validTier = (tier === 'pro' || tier === 'enterprise') ? tier : 'free';
    return PLAN_LIMITS[validTier];
};
