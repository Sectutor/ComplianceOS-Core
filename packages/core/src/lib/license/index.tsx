/**
 * License Management System for ComplianceOS
 * 
 * This module handles license validation for the dual-licensing model:
 * - Community Edition (AGPLv3): Free, open source
 * - Enterprise Edition (Commercial): Paid, with premium features
 */

import * as React from 'react';
import { FEATURES as FEATURE_FLAGS, BUILD_TYPE, isFeatureAvailableInBuild } from '../features';

export type LicenseType = 'community' | 'enterprise' | 'trial';
export type LicenseStatus = 'valid' | 'expired' | 'invalid' | 'suspended';

export interface LicenseInfo {
  type: LicenseType;
  status: LicenseStatus;
  issuedTo: string;
  issuedAt: Date;
  expiresAt?: Date;
  maxUsers?: number;
  maxClients?: number;
  features: string[];
  metadata?: Record<string, any>;
}

export interface LicenseValidationResult {
  isValid: boolean;
  license?: LicenseInfo;
  error?: string;
  missingFeatures?: string[];
}

/**
 * Feature definitions for license validation
 * Now imported from the feature flag system
 */
export const FEATURES = FEATURE_FLAGS;


export type Feature = typeof FEATURES[keyof typeof FEATURES];

/**
 * License validation class
 */
export class LicenseValidator {
  private static instance: LicenseValidator;
  private licenseInfo: LicenseInfo | null = null;
  private validationCache: Map<string, LicenseValidationResult> = new Map();
  
  private constructor() {
    this.loadLicense();
  }
  
  static getInstance(): LicenseValidator {
    if (!LicenseValidator.instance) {
      LicenseValidator.instance = new LicenseValidator();
    }
    return LicenseValidator.instance;
  }
  
  /**
   * Load license from environment or configuration
   */
  private loadLicense(): void {
    // Determine license type based on build type
    const buildType = BUILD_TYPE;
    
    if (buildType === 'COMMERCIAL') {
      // Commercial build - check for actual license
      const licenseKey = (import.meta as any).env.VITE_LICENSE_KEY;
      
      if (licenseKey) {
        // TODO: Implement actual license validation against license server
        // For now, simulate a valid enterprise license
        this.licenseInfo = {
          type: 'enterprise',
          status: 'valid',
          issuedTo: 'Enterprise Customer',
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          maxUsers: 100,
          maxClients: 50,
          features: (Object.values(FEATURES) as string[]).filter(feature => 
            isFeatureAvailableInBuild(feature)
          ),
          metadata: {
            plan: 'enterprise',
            version: '1.0.0',
            buildType: 'COMMERCIAL'
          }
        };
      } else {
        // Commercial build but no license key - treat as trial
        this.licenseInfo = {
          type: 'trial',
          status: 'valid',
          issuedTo: 'Trial User',
          issuedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
          maxUsers: 10,
          maxClients: 5,
          features: (Object.values(FEATURES) as string[]).filter(feature => 
            isFeatureAvailableInBuild(feature)
          ),
          metadata: {
            plan: 'trial',
            trialDays: 30,
            buildType: 'COMMERCIAL'
          }
        };
      }
    } else if (buildType === 'TRIAL') {
      // Trial build
      this.licenseInfo = {
        type: 'trial',
        status: 'valid',
        issuedTo: 'Trial User',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 day trial
        maxUsers: 10,
        maxClients: 5,
        features: (Object.values(FEATURES) as string[]).filter(feature => 
          isFeatureAvailableInBuild(feature)
        ),
        metadata: {
          plan: 'trial',
          trialDays: 30,
          buildType: 'TRIAL'
        }
      };
    } else {
      // Community edition (AGPLv3)
      this.licenseInfo = {
        type: 'community',
        status: 'valid',
        issuedTo: 'Community User',
        issuedAt: new Date(),
        features: (Object.values(FEATURES) as string[]).filter(feature => 
          isFeatureAvailableInBuild(feature)
        ),
        metadata: {
          license: 'AGPLv3',
          buildType: 'AGPLv3'
        }
      };
    }
  }
  
  /**
   * Validate if a specific feature is available
   */
  validateFeature(feature: Feature | Feature[]): LicenseValidationResult {
    const cacheKey = Array.isArray(feature) ? feature.join(',') : feature;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }
    
    const featuresToCheck = Array.isArray(feature) ? feature : [feature];
    const missingFeatures: string[] = [];
    
    if (!this.licenseInfo) {
      const result: LicenseValidationResult = {
        isValid: false,
        error: 'No license information available',
        missingFeatures: featuresToCheck
      };
      this.validationCache.set(cacheKey, result);
      return result;
    }
    
    // Check license status
    if (this.licenseInfo.status !== 'valid') {
      const result: LicenseValidationResult = {
        isValid: false,
        license: this.licenseInfo,
        error: `License is ${this.licenseInfo.status}`,
        missingFeatures: featuresToCheck
      };
      this.validationCache.set(cacheKey, result);
      return result;
    }
    
    // Check if features are available in current build
    for (const feat of featuresToCheck) {
      if (!isFeatureAvailableInBuild(feat)) {
        missingFeatures.push(`${feat} (not available in ${BUILD_TYPE} build)`);
      } else if (!this.licenseInfo.features.includes(feat)) {
        missingFeatures.push(`${feat} (not included in license)`);
      }
    }
    
    const isValid = missingFeatures.length === 0;
    const result: LicenseValidationResult = {
      isValid,
      license: this.licenseInfo,
      ...(missingFeatures.length > 0 && { missingFeatures }),
      ...(!isValid && { error: 'Required features not available' })
    };
    
    this.validationCache.set(cacheKey, result);
    return result;
  }
  
  /**
   * Check if a feature is available (simple boolean check)
   */
  hasFeature(feature: Feature | Feature[]): boolean {
    return this.validateFeature(feature).isValid;
  }
  
  /**
   * Get current license information
   */
  getLicenseInfo(): LicenseInfo | null {
    return this.licenseInfo;
  }
  
  /**
   * Get license type
   */
  getLicenseType(): LicenseType {
    return this.licenseInfo?.type || 'community';
  }
  
  /**
   * Check if running in community edition
   */
  isCommunityEdition(): boolean {
    return this.getLicenseType() === 'community';
  }
  
  /**
   * Check if running in enterprise edition
   */
  isEnterpriseEdition(): boolean {
    return this.getLicenseType() === 'enterprise';
  }
  
  /**
   * Check if running in trial mode
   */
  isTrialEdition(): boolean {
    return this.getLicenseType() === 'trial';
  }
  
  /**
   * Clear validation cache (useful after license changes)
   */
  clearCache(): void {
    this.validationCache.clear();
  }
  
  /**
   * Update license information (for dynamic license changes)
   */
  updateLicense(licenseInfo: LicenseInfo): void {
    this.licenseInfo = licenseInfo;
    this.clearCache();
  }
}

/**
 * Singleton instance export
 */
export const licenseValidator = LicenseValidator.getInstance();

/**
 * React hook for license validation
 */
export function useLicense() {
  const validator = licenseValidator;
  
  return {
    validator,
    hasFeature: (feature: Feature | Feature[]) => validator.hasFeature(feature),
    validateFeature: (feature: Feature | Feature[]) => validator.validateFeature(feature),
    getLicenseInfo: () => validator.getLicenseInfo(),
    getLicenseType: () => validator.getLicenseType(),
    isCommunityEdition: () => validator.isCommunityEdition(),
    isEnterpriseEdition: () => validator.isEnterpriseEdition(),
    isTrialEdition: () => validator.isTrialEdition(),
  };
}

/**
 * Utility function to check feature availability with fallback
 */
export function withLicenseCheck<T>(
  feature: Feature | Feature[],
  component: React.ComponentType<T>,
  fallback?: React.ComponentType<T>
): React.ComponentType<T> {
  return (props: T) => {
    const { hasFeature } = useLicense();
    
    if (hasFeature(feature)) {
      const Component = component;
      return <Component {...props} />;
    }
    
    if (fallback) {
      const FallbackComponent = fallback;
      return <FallbackComponent {...props} />;
    }
    
    return null;
  };
}