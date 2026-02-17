/**
 * Feature Flag System for ComplianceOS Dual-Licensing
 * 
 * This system controls which features are available based on:
 * 1. Build type (AGPLv3, COMMERCIAL, TRIAL)
 * 2. License validation (for commercial builds)
 * 3. Environment configuration
 */

import * as React from 'react';

// Build type from environment (with browser safety check)
const BUILD_TYPE = (typeof process !== 'undefined' && process.env ? process.env.BUILD_TYPE : 'AGPLv3') || 'AGPLv3';

// Feature categories
export const FEATURE_CATEGORIES = {
  COMMUNITY: 'community',
  ENTERPRISE: 'enterprise',
  TRIAL: 'trial',
  AI: 'ai',
  ADVISOR: 'advisor',
  REPORTING: 'reporting',
  INTEGRATION: 'integration',
  DEPLOYMENT: 'deployment',
  SECURITY: 'security',
} as const;

// Individual features
export const FEATURES = {
  // Community features (always available in AGPLv3)
  BASIC_DASHBOARD: 'basic.dashboard',
  SIMPLE_REPORTS: 'reports.simple',
  POLICY_MANAGEMENT: 'policy.management',
  RISK_REGISTER: 'risk.register',
  EVIDENCE_COLLECTION: 'evidence.collection',

  // AI Features
  AI_EVIDENCE_ANALYSIS: 'ai.evidence_analysis',
  AI_RISK_TRIAGE: 'ai.risk_triage',
  AI_POLICY_DRAFTING: 'ai.policy_drafting',
  AI_CONTROL_GUIDANCE: 'ai.control_guidance',
  AI_GAP_ANALYSIS: 'ai.gap_analysis',
  AI_MULTI_LLM: 'ai.multi_llm',

  // Advisor Features
  ADVISOR_WORKBENCH: 'advisor.workbench',
  ADVISOR_WHITE_LABEL: 'advisor.white_label',
  ADVISOR_MULTI_TENANT: 'advisor.multi_tenant',
  ADVISOR_TEMPLATE_DEPLOYMENT: 'advisor.template_deployment',

  // Enterprise Features
  ENTERPRISE_SCALABILITY: 'enterprise.scalability',
  ENTERPRISE_REDIS: 'enterprise.redis',
  ENTERPRISE_CONNECTION_POOLING: 'enterprise.connection_pooling',
  ENTERPRISE_READ_REPLICA: 'enterprise.read_replica',

  // Security Features
  SECURITY_SSO_SAML: 'security.sso_saml',
  SECURITY_ADVANCED_RBAC: 'security.advanced_rbac',
  SECURITY_AUDIT_TRAIL: 'security.audit_trail',
  SECURITY_DATA_ENCRYPTION: 'security.data_encryption',

  // Reporting Features
  REPORTING_PROFESSIONAL: 'reporting.professional',
  REPORTING_EXECUTIVE_DASHBOARDS: 'reporting.executive_dashboards',
  REPORTING_SCHEDULED: 'reporting.scheduled',
  REPORTING_CUSTOM_BRANDING: 'reporting.custom_branding',

  // Integration Features
  INTEGRATION_PREBUILT: 'integration.prebuilt',
  INTEGRATION_ENTERPRISE_STORAGE: 'integration.enterprise_storage',
  INTEGRATION_SIEM: 'integration.siem',
  INTEGRATION_CRM: 'integration.crm',

  // Deployment Features
  DEPLOYMENT_MANAGED_SAAS: 'deployment.managed_saas',
  DEPLOYMENT_PRIVATE_CLOUD: 'deployment.private_cloud',
  DEPLOYMENT_ON_PREMISES: 'deployment.on_premises',
  DEPLOYMENT_HYBRID: 'deployment.hybrid',
  DEPLOYMENT_AIR_GAPPED: 'deployment.air_gapped',
} as const;

// Feature definitions with metadata
export const FEATURE_DEFINITIONS: Record<string, {
  name: string;
  description: string;
  category: string;
  availableIn: ('AGPLv3' | 'COMMERCIAL' | 'TRIAL')[];
  requiresLicense?: boolean;
  licenseType?: 'community' | 'trial' | 'enterprise';
}> = {
  [FEATURES.BASIC_DASHBOARD]: {
    name: 'Basic Dashboard',
    description: 'Simple dashboard with basic metrics',
    category: FEATURE_CATEGORIES.COMMUNITY,
    availableIn: ['AGPLv3', 'COMMERCIAL', 'TRIAL'],
  },

  [FEATURES.SIMPLE_REPORTS]: {
    name: 'Simple Reports',
    description: 'Basic reporting functionality',
    category: FEATURE_CATEGORIES.COMMUNITY,
    availableIn: ['AGPLv3', 'COMMERCIAL', 'TRIAL'],
  },

  [FEATURES.AI_EVIDENCE_ANALYSIS]: {
    name: 'AI Evidence Analysis',
    description: 'AI-powered analysis of compliance evidence',
    category: FEATURE_CATEGORIES.AI,
    availableIn: ['COMMERCIAL', 'TRIAL'],
    requiresLicense: true,
    licenseType: 'enterprise',
  },

  [FEATURES.ADVISOR_WORKBENCH]: {
    name: 'Advisor Workbench',
    description: 'Advanced compliance advisor with AI assistance',
    category: FEATURE_CATEGORIES.ADVISOR,
    availableIn: ['COMMERCIAL', 'TRIAL'],
    requiresLicense: true,
    licenseType: 'enterprise',
  },

  [FEATURES.ENTERPRISE_SCALABILITY]: {
    name: 'Enterprise Scalability',
    description: 'High-performance scaling for large deployments',
    category: FEATURE_CATEGORIES.ENTERPRISE,
    availableIn: ['COMMERCIAL'],
    requiresLicense: true,
    licenseType: 'enterprise',
  },

  [FEATURES.DEPLOYMENT_ON_PREMISES]: {
    name: 'On-Premises Deployment',
    description: 'Deploy ComplianceOS in your own infrastructure',
    category: FEATURE_CATEGORIES.DEPLOYMENT,
    availableIn: ['COMMERCIAL'],
    requiresLicense: true,
    licenseType: 'enterprise',
  },
};

/**
 * Check if a feature is available in the current build
 */
export function isFeatureAvailableInBuild(feature: string): boolean {
  const definition = FEATURE_DEFINITIONS[feature];
  if (!definition) {
    console.warn(`Feature "${feature}" not found in definitions`);
    return false;
  }

  return definition.availableIn.includes(BUILD_TYPE as any);
}

/**
 * Get all features available in the current build
 */
export function getBuildFeatures(): string[] {
  return Object.keys(FEATURE_DEFINITIONS).filter(feature =>
    isFeatureAvailableInBuild(feature)
  );
}

/**
 * Get features by category
 */
export function getFeaturesByCategory(category: string): string[] {
  return Object.keys(FEATURE_DEFINITIONS).filter(feature =>
    FEATURE_DEFINITIONS[feature].category === category &&
    isFeatureAvailableInBuild(feature)
  );
}

/**
 * Check if feature requires license validation
 */
export function featureRequiresLicense(feature: string): boolean {
  const definition = FEATURE_DEFINITIONS[feature];
  return definition?.requiresLicense || false;
}

/**
 * Get the required license type for a feature
 */
export function getRequiredLicenseType(feature: string): string | undefined {
  const definition = FEATURE_DEFINITIONS[feature];
  return definition?.licenseType;
}

/**
 * Feature guard for React components
 */
export function withFeatureGuard(feature: string, FallbackComponent?: React.ComponentType) {
  return function <T extends React.ComponentType>(Component: T): T {
    const GuardedComponent: React.FC<any> = (props) => {
      if (!isFeatureAvailableInBuild(feature)) {
        if (FallbackComponent) {
          return React.createElement(FallbackComponent, props);
        }
        return null;
      }
      return React.createElement(Component, props);
    };

    return GuardedComponent as T;
  };
}

/**
 * Hook to check feature availability
 */
export function useFeature(feature: string): {
  isAvailable: boolean;
  requiresLicense: boolean;
  licenseType?: string;
} {
  const isAvailable = isFeatureAvailableInBuild(feature);
  const requiresLicense = featureRequiresLicense(feature);
  const licenseType = getRequiredLicenseType(feature);

  return {
    isAvailable,
    requiresLicense,
    licenseType,
  };
}

/**
 * Get build information
 */
export function getBuildInfo() {
  return {
    buildType: BUILD_TYPE,
    isCommunity: BUILD_TYPE === 'AGPLv3',
    isCommercial: BUILD_TYPE === 'COMMERCIAL',
    isTrial: BUILD_TYPE === 'TRIAL',
    features: getBuildFeatures(),
    featureCount: getBuildFeatures().length,
  };
}

// Export build type for use in other modules
export { BUILD_TYPE };