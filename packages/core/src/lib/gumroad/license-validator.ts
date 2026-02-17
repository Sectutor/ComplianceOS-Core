/**
 * Gumroad License Validator for ComplianceOS
 * 
 * Integrates Gumroad license validation with the existing license system
 */

import { LicenseInfo, LicenseType, LicenseStatus, FEATURES } from '../license/index';
import { 
  GumroadClient, 
  GumroadValidationResponse, 
  mapGumroadProductToLicenseType, 
  getFeaturesForProduct 
} from './index';

export interface GumroadLicenseCache {
  licenseKey: string;
  licenseInfo: LicenseInfo;
  validatedAt: Date;
  expiresAt: Date;
}

export class GumroadLicenseValidator {
  private gumroadClient: GumroadClient;
  private cache: Map<string, GumroadLicenseCache> = new Map();
  private cacheDuration: number = 24 * 60 * 60 * 1000; // 24 hours
  
  constructor(gumroadClient: GumroadClient) {
    this.gumroadClient = gumroadClient;
  }
  
  /**
   * Validate a Gumroad license and convert to ComplianceOS LicenseInfo
   */
  async validateGumroadLicense(licenseKey: string, productPermalink?: string): Promise<LicenseInfo> {
    const cacheKey = `${licenseKey}:${productPermalink || 'default'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > new Date()) {
      return cached.licenseInfo;
    }
    
    try {
      // Validate with Gumroad API
      const validation = await this.gumroadClient.validateLicense(licenseKey, productPermalink);
      
      if (!validation.success) {
        throw new Error('Invalid Gumroad license');
      }
      
      const purchase = validation.purchase;
      
      // Check if license is refunded or disputed
      if (purchase.refunded) {
        throw new Error('License has been refunded');
      }
      
      if (purchase.disputed && !purchase.dispute_won) {
        throw new Error('License is under dispute');
      }
      
      // Map Gumroad purchase to ComplianceOS LicenseInfo
      const licenseInfo: LicenseInfo = {
        type: mapGumroadProductToLicenseType(purchase.permalink),
        status: this.getLicenseStatus(purchase),
        issuedTo: purchase.email,
        issuedAt: new Date(purchase.created_at),
        expiresAt: this.getExpirationDate(purchase),
        maxUsers: this.getMaxUsers(purchase.permalink),
        maxClients: this.getMaxClients(purchase.permalink),
        features: getFeaturesForProduct(purchase.permalink),
        metadata: {
          gumroad: {
            purchaseId: purchase.purchase_id,
            saleId: purchase.sale_id,
            productId: purchase.product_id,
            productName: purchase.product_name,
            priceCents: purchase.price_cents,
            currency: purchase.currency,
            subscriptionId: purchase.subscription_id,
            isRecurring: purchase.is_recurring_charge,
            variants: purchase.variants,
            customFields: purchase.custom_fields,
          }
        }
      };
      
      // Cache the result
      this.cache.set(cacheKey, {
        licenseKey,
        licenseInfo,
        validatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.cacheDuration)
      });
      
      return licenseInfo;
      
    } catch (error) {
      // If validation fails, return a community license
      return this.getCommunityLicense();
    }
  }
  
  /**
   * Get license status from Gumroad purchase
   */
  private getLicenseStatus(purchase: any): LicenseStatus {
    if (purchase.refunded) {
      return 'invalid';
    }
    
    if (purchase.disputed && !purchase.dispute_won) {
      return 'suspended';
    }
    
    if (purchase.subscription_ended_at) {
      const endedAt = new Date(purchase.subscription_ended_at);
      if (endedAt < new Date()) {
        return 'expired';
      }
    }
    
    return 'valid';
  }
  
  /**
   * Get expiration date from Gumroad purchase
   */
  private getExpirationDate(purchase: any): Date | undefined {
    // For subscriptions, use subscription end date
    if (purchase.subscription_ended_at) {
      return new Date(purchase.subscription_ended_at);
    }
    
    // For one-time purchases, calculate based on product type
    const purchaseDate = new Date(purchase.created_at);
    
    if (purchase.permalink.includes('trial')) {
      // Trial licenses expire after 30 days
      return new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    if (purchase.permalink.includes('yearly')) {
      // Yearly licenses expire after 1 year
      return new Date(purchaseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    }
    
    // Monthly licenses expire after 1 month
    if (purchase.permalink.includes('monthly')) {
      return new Date(purchaseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    
    // Default: enterprise licenses don't expire (perpetual)
    return undefined;
  }
  
  /**
   * Get max users based on product
   */
  private getMaxUsers(productPermalink: string): number | undefined {
    const limits: Record<string, number> = {
      'complianceos-community': 10,
      'complianceos-trial': 10,
      'complianceos-enterprise-monthly': 100,
      'complianceos-enterprise-yearly': 100,
      'complianceos-enterprise': 1000, // Unlimited
    };
    
    return limits[productPermalink];
  }
  
  /**
   * Get max clients based on product
   */
  private getMaxClients(productPermalink: string): number | undefined {
    const limits: Record<string, number> = {
      'complianceos-community': 5,
      'complianceos-trial': 5,
      'complianceos-enterprise-monthly': 50,
      'complianceos-enterprise-yearly': 50,
      'complianceos-enterprise': 500, // Unlimited
    };
    
    return limits[productPermalink];
  }
  
  /**
   * Get community license (fallback)
   */
  private getCommunityLicense(): LicenseInfo {
    return {
      type: 'community',
      status: 'valid',
      issuedTo: 'Community User',
      issuedAt: new Date(),
      features: [],
      metadata: {
        license: 'AGPLv3',
        source: 'community-fallback'
      }
    };
  }
  
  /**
   * Clear cache for a specific license
   */
  clearLicenseCache(licenseKey: string, productPermalink?: string): void {
    const cacheKey = `${licenseKey}:${productPermalink || 'default'}`;
    this.cache.delete(cacheKey);
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Update cache duration
   */
  setCacheDuration(durationMs: number): void {
    this.cacheDuration = durationMs;
  }
}

/**
 * Enhanced license validator that works with Gumroad
 */
export class EnhancedLicenseValidator {
  private gumroadValidator: GumroadLicenseValidator;
  private useGumroad: boolean = false;
  
  constructor(gumroadValidator?: GumroadLicenseValidator) {
    this.gumroadValidator = gumroadValidator || new GumroadLicenseValidator(
      new GumroadClient({
        accessToken: process.env.GUMROAD_ACCESS_TOKEN || '',
        productPermalink: 'complianceos-enterprise'
      })
    );
    
    this.useGumroad = !!process.env.GUMROAD_ACCESS_TOKEN;
  }
  
  /**
   * Validate license using Gumroad or fallback to environment variables
   */
  async validateLicense(licenseKey?: string): Promise<LicenseInfo> {
    // If no license key, check environment variables
    if (!licenseKey) {
      return this.validateFromEnvironment();
    }
    
    // If Gumroad is configured, use it
    if (this.useGumroad) {
      try {
        return await this.gumroadValidator.validateGumroadLicense(licenseKey);
      } catch (error) {
        console.warn('Gumroad validation failed, falling back to environment:', error);
        return this.validateFromEnvironment();
      }
    }
    
    // Fallback to environment variable validation
    return this.validateFromEnvironment();
  }
  
  /**
   * Validate license from environment variables (backward compatibility)
   */
  private validateFromEnvironment(): LicenseInfo {
    const isPremiumBuild = process.env.VITE_ENABLE_PREMIUM === 'true';
    const licenseKey = process.env.VITE_LICENSE_KEY;
    
    if (isPremiumBuild && licenseKey) {
      // Simulate enterprise license (as before)
      return {
        type: 'enterprise',
        status: 'valid',
        issuedTo: 'Demo Enterprise',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        maxUsers: 100,
        maxClients: 50,
        features: Object.values(FEATURES),
        metadata: {
          plan: 'enterprise',
          version: '1.0.0',
          source: 'environment-variables'
        }
      };
    } else if (isPremiumBuild) {
      // Trial license
      return {
        type: 'trial',
        status: 'valid',
        issuedTo: 'Trial User',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        maxUsers: 10,
        maxClients: 5,
        features: [
          FEATURES.AI_EVIDENCE_ANALYSIS,
          FEATURES.AI_RISK_TRIAGE,
          FEATURES.AI_POLICY_DRAFTING,
          FEATURES.ADVISOR_WORKBENCH,
          FEATURES.WHITE_LABEL_BRANDING,
        ],
        metadata: {
          plan: 'trial',
          trialDays: 30,
          source: 'environment-variables'
        }
      };
    } else {
      // Community license
      return {
        type: 'community',
        status: 'valid',
        issuedTo: 'Community User',
        issuedAt: new Date(),
        features: [],
        metadata: {
          license: 'AGPLv3',
          source: 'environment-variables'
        }
      };
    }
  }
  
  /**
   * Check if Gumroad integration is enabled
   */
  isGumroadEnabled(): boolean {
    return this.useGumroad;
  }
}

/**
 * Singleton instance
 */
let enhancedLicenseValidator: EnhancedLicenseValidator | null = null;

export function getEnhancedLicenseValidator(): EnhancedLicenseValidator {
  if (!enhancedLicenseValidator) {
    enhancedLicenseValidator = new EnhancedLicenseValidator();
  }
  return enhancedLicenseValidator;
}