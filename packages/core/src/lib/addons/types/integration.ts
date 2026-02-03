import type { AddonContext, AddonConfiguration } from '../types';
import { BaseAddon } from '../base';
import type { AddonHookResult, AddonInitializationResult } from '../types';

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
  tokenUrl: string;
}

export interface IntegrationAddonManifest {
  type: 'integration';
  provider: string;
  authType: 'oauth' | 'api_key' | 'basic' | 'custom';
  oauthConfig?: OAuthConfig;
  endpoints: IntegrationEndpoint[];
  webhooks?: IntegrationWebhook[];
  features: IntegrationFeature[];
}

export interface IntegrationEndpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description?: string;
  required?: boolean;
}

export interface IntegrationWebhook {
  event: string;
  path: string;
  description?: string;
}

export interface IntegrationFeature {
  id: string;
  name: string;
  description?: string;
  endpoint?: string;
}

export abstract class IntegrationAddon extends BaseAddon {
  protected authType: 'oauth' | 'api_key' | 'basic' | 'custom';

  constructor(
    manifest: IntegrationAddonManifest,
    authType: 'oauth' | 'api_key' | 'basic' | 'custom' = 'api_key'
  ) {
    super(manifest);
    this.authType = authType;
  }

  abstract getProviderId(): string;
  abstract getProviderName(): string;
  abstract getDefaultIcon(): string;

  abstract testConnection(config: AddonConfiguration): Promise<AddonHookResult>;
  abstract executeRequest(
    endpoint: string,
    method: string,
    data?: unknown,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  async onInitialize(): Promise<AddonInitializationResult> {
    const config = this.getConfig();
    if (!this.validateConfig(config)) {
      return { success: false, error: 'Missing required configuration' };
    }
    return { success: true };
  }

  async onActivate(): Promise<AddonHookResult> {
    const config = this.getConfig();
    return this.testConnection(config);
  }

  protected validateConfig(config: AddonConfiguration): boolean {
    return true;
  }

  abstract getSettingsSchema(): Record<string, unknown>;
  abstract renderSettings(): React.ReactNode;

  async getAuthUrl(clientId: number): Promise<string> {
    const config = this.getConfig();
    const oauthConfig = (this.manifestData as unknown as IntegrationAddonManifest).oauthConfig;
    
    if (!oauthConfig) {
      throw new Error('OAuth not supported for this integration');
    }

    const params = new URLSearchParams({
      client_id: config.clientId as string || '',
      redirect_uri: oauthConfig.redirectUri,
      response_type: 'code',
      scope: oauthConfig.scopes.join(' '),
      state: JSON.stringify({ clientId, addonId: this.id }),
    });

    return `${oauthConfig.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<AddonHookResult> {
    const oauthConfig = (this.manifestData as unknown as IntegrationAddonManifest).oauthConfig;
    
    if (!oauthConfig) {
      return { success: false, message: 'OAuth not supported' };
    }

    const config = this.getConfig();
    
    try {
      const response = await fetch(oauthConfig.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: config.clientId as string,
          client_secret: config.clientSecret as string,
          redirect_uri: oauthConfig.redirectUri,
        }),
      });

      if (!response.ok) {
        return { success: false, message: 'Failed to exchange code for token' };
      }

      const tokenData = await response.json();
      this.setConfig({ accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token });
      
      return { success: true, data: tokenData };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Token exchange failed' };
    }
  }
}
