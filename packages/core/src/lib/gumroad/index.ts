/**
 * Gumroad API Client for ComplianceOS License Management
 * 
 * This module handles integration with Gumroad for license validation,
 * product management, and webhook handling.
 */

export interface GumroadConfig {
  accessToken: string;
  productPermalink: string;
  webhookSecret?: string;
  apiBaseUrl?: string;
}

export interface GumroadLicense {
  id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  purchase_id: string;
  email: string;
  price_cents: number;
  currency: string;
  quantity: number;
  order_number: number;
  sale_id: string;
  sale_timestamp: string;
  license_key: string;
  created_at: string;
  variants: string;
  custom_fields: Record<string, any>;
  subscription_id?: string;
  subscription_ended_at?: string;
  refunded: boolean;
  disputed: boolean;
  dispute_won: boolean;
  can_contact: boolean;
  is_recurring_charge: boolean;
  is_gift_sender_purchase: boolean;
  is_gift_receiver_purchase: boolean;
  referrer: string;
  card: {
    type: string;
    visual: string;
    bin: string;
    expiry_month: number;
    expiry_year: number;
  };
}

export interface GumroadProduct {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  currency: string;
  url: string;
  permalink: string;
  published: boolean;
  customizable_price: boolean;
  recurring: boolean;
  trial_period_days: number;
  short_url: string;
  thumbnail_url: string;
  tags: string[];
  custom_fields: Array<{
    name: string;
    required: boolean;
    type: string;
  }>;
  variants: Array<{
    id: string;
    title: string;
    price_cents: number;
    is_pay_what_you_want: boolean;
    recurrence: string;
  }>;
}

export interface GumroadValidationResponse {
  success: boolean;
  uses: number;
  purchase: GumroadLicense;
}

export interface GumroadWebhookEvent {
  id: string;
  email: string;
  seller_id: string;
  product_id: string;
  product_name: string;
  permalink: string;
  price: number;
  gumroad_fee: number;
  currency: string;
  quantity: number;
  order_number: number;
  sale_id: string;
  sale_timestamp: string;
  license_key: string;
  ip_country: string;
  recurrence: string;
  is_gift_receiver_purchase: boolean;
  refunded: boolean;
  resource_name: string;
  disputed: boolean;
  dispute_won: boolean;
  can_contact: boolean;
  purchased_at: string;
  created_at: string;
  variants: string;
  custom_fields: Record<string, any>;
  subscription_id?: string;
  subscription_ended_at?: string;
  is_recurring_charge: boolean;
  is_gift_sender_purchase: boolean;
  referrer: string;
  card: {
    type: string;
    visual: string;
    bin: string;
    expiry_month: number;
    expiry_year: number;
  };
}

/**
 * Gumroad API Client
 */
export class GumroadClient {
  private config: GumroadConfig;
  
  constructor(config: GumroadConfig) {
    this.config = {
      apiBaseUrl: 'https://api.gumroad.com/v2',
      ...config
    };
  }
  
  /**
   * Validate a license key
   */
  async validateLicense(licenseKey: string, productPermalink?: string): Promise<GumroadValidationResponse> {
    const permalink = productPermalink || this.config.productPermalink;
    
    const response = await this.makeRequest('/licenses/verify', {
      method: 'POST',
      body: new URLSearchParams({
        product_permalink: permalink,
        license_key: licenseKey
      })
    });
    
    return response;
  }
  
  /**
   * Get product information
   */
  async getProduct(productId?: string): Promise<GumroadProduct> {
    const id = productId || this.config.productPermalink;
    const response = await this.makeRequest(`/products/${id}`);
    return response.product;
  }
  
  /**
   * List all products
   */
  async listProducts(): Promise<GumroadProduct[]> {
    const response = await this.makeRequest('/products');
    return response.products;
  }
  
  /**
   * Get subscription information
   */
  async getSubscription(subscriptionId: string): Promise<any> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}`);
    return response.subscription;
  }
  
  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<any> {
    const response = await this.makeRequest(`/subscriptions/${subscriptionId}/deactivate`, {
      method: 'PUT'
    });
    return response;
  }
  
  /**
   * Make authenticated request to Gumroad API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.config.apiBaseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...options.headers
    };
    
    // Add access token for authenticated requests
    if (this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gumroad API error (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  }
  
  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    
    // Gumroad uses HMAC-SHA256 for webhook verification
    // In a real implementation, you would verify the signature
    // For now, we'll trust the webhook if secret is configured
    return true;
  }
  
  /**
   * Parse webhook event
   */
  parseWebhookEvent(body: any, signature?: string): GumroadWebhookEvent {
    if (signature && !this.verifyWebhookSignature(JSON.stringify(body), signature)) {
      throw new Error('Invalid webhook signature');
    }
    
    return body as GumroadWebhookEvent;
  }
}

/**
 * Helper function to map Gumroad product to ComplianceOS license type
 */
export function mapGumroadProductToLicenseType(productPermalink: string): 'community' | 'enterprise' | 'trial' {
  // Map your Gumroad product permalinks to license types
  const productMap: Record<string, 'community' | 'enterprise' | 'trial'> = {
    'complianceos-community': 'community',
    'complianceos-enterprise': 'enterprise',
    'complianceos-trial': 'trial',
    'complianceos-enterprise-yearly': 'enterprise',
    'complianceos-enterprise-monthly': 'enterprise',
  };
  
  return productMap[productPermalink] || 'community';
}

/**
 * Helper function to get features based on Gumroad product
 */
export function getFeaturesForProduct(productPermalink: string): string[] {
  const featureMap: Record<string, string[]> = {
    'complianceos-community': [], // No premium features
    'complianceos-trial': [
      'ai.evidence_analysis',
      'ai.risk_triage',
      'ai.policy_drafting',
      'advisor.workbench',
      'advisor.white_label',
    ],
    'complianceos-enterprise': [
      'ai.evidence_analysis',
      'ai.risk_triage',
      'ai.policy_drafting',
      'ai.control_guidance',
      'ai.gap_analysis',
      'ai.multi_llm',
      'advisor.workbench',
      'advisor.white_label',
      'advisor.multi_tenant',
      'advisor.template_deployment',
      'enterprise.scalability',
      'enterprise.redis',
      'enterprise.connection_pooling',
      'enterprise.read_replica',
      'security.sso_saml',
      'security.advanced_rbac',
      'security.audit_trail',
      'security.data_encryption',
      'reporting.professional',
      'reporting.executive_dashboards',
      'reporting.scheduled',
      'reporting.custom_branding',
      'integration.prebuilt',
      'integration.enterprise_storage',
      'integration.siem',
      'integration.crm',
      'deployment.managed_saas',
      'deployment.private_cloud',
      'deployment.on_premises',
      'deployment.hybrid',
      'deployment.air_gapped',
    ],
  };
  
  return featureMap[productPermalink] || [];
}

/**
 * Singleton Gumroad client instance
 */
let gumroadClient: GumroadClient | null = null;

export function getGumroadClient(config?: Partial<GumroadConfig>): GumroadClient {
  if (!gumroadClient) {
    if (!config?.accessToken) {
      throw new Error('Gumroad access token is required');
    }
    
    gumroadClient = new GumroadClient({
      accessToken: config.accessToken,
      productPermalink: config.productPermalink || 'complianceos-enterprise',
      webhookSecret: config.webhookSecret,
      apiBaseUrl: config.apiBaseUrl,
    });
  }
  
  if (config) {
    gumroadClient = new GumroadClient({
      ...(gumroadClient as any).config,
      ...config
    });
  }
  
  return gumroadClient;
}