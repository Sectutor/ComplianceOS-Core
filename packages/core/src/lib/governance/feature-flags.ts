/**
 * Feature Flags for Governance Workbench
 * 
 * This module provides feature flags for gradual rollout of the governance workbench.
 * Flags can be controlled per-client or globally.
 */

export interface GovernanceFeatureFlags {
    // Core Features
    enableWorkbench: boolean;
    enableWorkflowEngine: boolean;
    enableEscalations: boolean;
    enableMetrics: boolean;

    // Advanced Features
    enableAIAdvisor: boolean;
    enableAutomatedTransitions: boolean;
    enableCustomWorkflows: boolean;

    // Integration Features
    enablePolicyWorkflow: boolean;
    enableControlWorkflow: boolean;
    enableRiskWorkflow: boolean;
    enableBCPWorkflow: boolean;
    enableTPRMWorkflow: boolean;
}

const DEFAULT_FLAGS: GovernanceFeatureFlags = {
    // Core features enabled by default
    enableWorkbench: true,
    enableWorkflowEngine: true,
    enableEscalations: true,
    enableMetrics: true,

    // Advanced features disabled by default (gradual rollout)
    enableAIAdvisor: false,
    enableAutomatedTransitions: false,
    enableCustomWorkflows: false,

    // Integration features - enable gradually
    enablePolicyWorkflow: true,
    enableControlWorkflow: true,
    enableRiskWorkflow: false,
    enableBCPWorkflow: false,
    enableTPRMWorkflow: false,
};

// Client-specific overrides (can be stored in database)
const CLIENT_OVERRIDES: Record<number, Partial<GovernanceFeatureFlags>> = {
    // Example: Client 1 gets early access to all features
    // 1: {
    //   enableAIAdvisor: true,
    //   enableAutomatedTransitions: true,
    //   enableRiskWorkflow: true,
    // },
};

/**
 * Get feature flags for a specific client
 */
export function getGovernanceFeatureFlags(clientId: number): GovernanceFeatureFlags {
    const overrides = CLIENT_OVERRIDES[clientId] || {};
    return {
        ...DEFAULT_FLAGS,
        ...overrides,
    };
}

/**
 * Check if a specific feature is enabled for a client
 */
export function isFeatureEnabled(
    clientId: number,
    feature: keyof GovernanceFeatureFlags
): boolean {
    const flags = getGovernanceFeatureFlags(clientId);
    return flags[feature];
}

/**
 * Update feature flags for a client (admin only)
 */
export function setClientFeatureFlags(
    clientId: number,
    flags: Partial<GovernanceFeatureFlags>
): void {
    CLIENT_OVERRIDES[clientId] = {
        ...CLIENT_OVERRIDES[clientId],
        ...flags,
    };
}

/**
 * Get all clients with specific feature enabled
 */
export function getClientsWithFeature(feature: keyof GovernanceFeatureFlags): number[] {
    return Object.entries(CLIENT_OVERRIDES)
        .filter(([_, flags]) => flags[feature] === true)
        .map(([clientId]) => parseInt(clientId));
}
