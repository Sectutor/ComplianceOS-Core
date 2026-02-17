/**
 * License Server Integration
 * 
 * This module handles communication with the license server for validation,
 * activation, and management of commercial licenses.
 */

import { LicenseInfo, LicenseType, LicenseStatus } from './index';

export interface LicenseServerConfig {
  endpoint: string;
  apiKey?: string;
  timeout?: number;
  cacheDuration?: number; // in milliseconds
}

export interface LicenseActivationRequest {
  licenseKey: string;
  machineId?: string;
  domain?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LicenseActivationResponse {
  success: boolean;
  license?: LicenseInfo;
  error?: string;
  activationId?: string;
}

export interface LicenseValidationRequest {
  licenseKey: string;
  activationId?: string;
  machineId?: string;
  domain?: string;
}

export interface LicenseValidationResponse {
  success: boolean;
  valid: boolean;
  license?: LicenseInfo;
  error?: string;
  requiresReactivation?: boolean;
}

export interface LicenseDeactivationRequest {
  licenseKey: string;
  activationId: string;
  reason?: string;
}

export interface LicenseDeactivationResponse {
  success: boolean;
  error?: string;
}

/**
 * License Server Client
 */
export class LicenseServerClient {
  private config: LicenseServerConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  
  constructor(config: LicenseServerConfig) {
    this.config = {
      timeout: 10000,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
      ...config
    };
  }
  
  /**
   * Activate a license
   */
  async activateLicense(request: LicenseActivationRequest): Promise<LicenseActivationResponse> {
    const cacheKey = `activate:${request.licenseKey}:${request.machineId || 'default'}`;
    
    try {
      const response = await this.makeRequest('/api/v1/licenses/activate', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      
      if (response.success && response.license) {
        // Cache the successful activation
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during license activation'
      };
    }
  }
  
  /**
   * Validate a license
   */
  async validateLicense(request: LicenseValidationRequest): Promise<LicenseValidationResponse> {
    const cacheKey = `validate:${request.licenseKey}:${request.activationId || 'default'}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < (this.config.cacheDuration || 0)) {
      return cached.data;
    }
    
    try {
      const response = await this.makeRequest('/api/v1/licenses/validate', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      
      if (response.success) {
        // Cache successful validation
        this.cache.set(cacheKey, {
          data: response,
          timestamp: Date.now()
        });
      }
      
      return response;
    } catch (error) {
      // On network error, check if we have a cached valid response
      if (cached) {
        return cached.data;
      }
      
      return {
        success: false,
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error during license validation'
      };
    }
  }
  
  /**
   * Deactivate a license
   */
  async deactivateLicense(request: LicenseDeactivationRequest): Promise<LicenseDeactivationResponse> {
    try {
      const response = await this.makeRequest('/api/v1/licenses/deactivate', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      
      // Clear any cached entries for this license
      this.clearLicenseCache(request.licenseKey);
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during license deactivation'
      };
    }
  }
  
  /**
   * Get license usage statistics
   */
  async getLicenseUsage(licenseKey: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/api/v1/licenses/${licenseKey}/usage`, {
        method: 'GET'
      });
      
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error fetching license usage'
      };
    }
  }
  
  /**
   * Make HTTP request to license server
   */
  private async makeRequest(path: string, options: RequestInit): Promise<any> {
    const url = `${this.config.endpoint}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
      ...options.headers
    };
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`License server responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Clear cache for a specific license
   */
  private clearLicenseCache(licenseKey: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(licenseKey)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<LicenseServerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Default license server configuration
 */
export const defaultLicenseServerConfig: LicenseServerConfig = {
  endpoint: 'https://license.complianceos.com',
  timeout: 10000,
  cacheDuration: 5 * 60 * 1000 // 5 minutes
};

/**
 * Singleton license server client instance
 */
let licenseServerClient: LicenseServerClient | null = null;

export function getLicenseServerClient(config?: Partial<LicenseServerConfig>): LicenseServerClient {
  if (!licenseServerClient) {
    licenseServerClient = new LicenseServerClient({
      ...defaultLicenseServerConfig,
      ...config
    });
  }
  
  if (config) {
    licenseServerClient.updateConfig(config);
  }
  
  return licenseServerClient;
}

/**
 * Mock license server for development/testing
 */
export class MockLicenseServerClient extends LicenseServerClient {
  private mockLicenses: Map<string, LicenseInfo> = new Map();
  
  constructor() {
    super({ endpoint: 'mock://license-server' });
    
    // Setup mock licenses for testing
    this.setupMockLicenses();
  }
  
  private setupMockLicenses(): void {
    // Mock enterprise license
    this.mockLicenses.set('ENT-123456-7890-ABCD', {
      type: 'enterprise',
      status: 'valid',
      issuedTo: 'Demo Enterprise Corp',
      issuedAt: new Date('2024-01-01'),
      expiresAt: new Date('2025-01-01'),
      maxUsers: 100,
      maxClients: 50,
      features: Object.values(require('./index').FEATURES),
      metadata: {
        plan: 'enterprise',
        version: '1.0.0',
        supportLevel: 'premium'
      }
    });
    
    // Mock trial license
    this.mockLicenses.set('TRIAL-123456-7890', {
      type: 'trial',
      status: 'valid',
      issuedTo: 'Trial User',
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      maxUsers: 10,
      maxClients: 5,
      features: [
        'ai.evidence_analysis',
        'ai.risk_triage',
        'ai.policy_drafting',
        'advisor.workbench',
        'advisor.white_label',
      ],
      metadata: {
        plan: 'trial',
        trialDays: 30
      }
    });
    
    // Mock expired license
    this.mockLicenses.set('EXPIRED-123456-7890', {
      type: 'enterprise',
      status: 'expired',
      issuedTo: 'Expired Corp',
      issuedAt: new Date('2023-01-01'),
      expiresAt: new Date('2024-01-01'),
      maxUsers: 50,
      maxClients: 25,
      features: Object.values(require('./index').FEATURES),
      metadata: {
        plan: 'enterprise',
        version: '1.0.0'
      }
    });
  }
  
  async activateLicense(request: LicenseActivationRequest): Promise<LicenseActivationResponse> {
    await this.simulateNetworkDelay();
    
    const license = this.mockLicenses.get(request.licenseKey);
    
    if (!license) {
      return {
        success: false,
        error: 'Invalid license key'
      };
    }
    
    if (license.status !== 'valid') {
      return {
        success: false,
        error: `License is ${license.status}`
      };
    }
    
    return {
      success: true,
      license,
      activationId: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }
  
  async validateLicense(request: LicenseValidationRequest): Promise<LicenseValidationResponse> {
    await this.simulateNetworkDelay();
    
    const license = this.mockLicenses.get(request.licenseKey);
    
    if (!license) {
      return {
        success: true,
        valid: false,
        error: 'Invalid license key'
      };
    }
    
    // Check if license is expired
    if (license.expiresAt && license.expiresAt < new Date()) {
      license.status = 'expired';
    }
    
    return {
      success: true,
      valid: license.status === 'valid',
      license,
      requiresReactivation: license.status === 'expired'
    };
  }
  
  async deactivateLicense(request: LicenseDeactivationRequest): Promise<LicenseDeactivationResponse> {
    await this.simulateNetworkDelay();
    
    const license = this.mockLicenses.get(request.licenseKey);
    
    if (!license) {
      return {
        success: false,
        error: 'Invalid license key'
      };
    }
    
    return {
      success: true
    };
  }
  
  private async simulateNetworkDelay(): Promise<void> {
    // Simulate network delay (50-200ms)
    const delay = 50 + Math.random() * 150;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Get mock license server client for development
 */
export function getMockLicenseServerClient(): MockLicenseServerClient {
  return new MockLicenseServerClient();
}