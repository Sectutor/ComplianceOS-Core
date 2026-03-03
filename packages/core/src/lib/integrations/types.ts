/**
 * Integration Types
 * 
 * Core types for the ComplianceOS integration marketplace.
 * This defines how integrations are structured, connected, and managed.
 */

// Integration Categories
export type IntegrationCategory =
    | 'governance'
    | 'risk'
    | 'compliance'
    | 'vendor'
    | 'scanner'
    | 'notification'
    | 'ai'
    | 'utility'
    | 'source-control'
    | 'communication'
    | 'storage';

// Integration Visibility
export type IntegrationVisibility = 'public' | 'organization' | 'private';

// Integration Status
export type IntegrationStatus = 'available' | 'connected' | 'error' | 'disconnected';

// Authentication Types
export type AuthType = 'none' | 'apiKey' | 'oauth2' | 'basic' | 'bearer' | 'custom';

// Credential Field Definition
export interface CredentialField {
    key: string;
    type: 'string' | 'password' | 'select' | 'number' | 'boolean';
    label: string;
    description?: string;
    required: boolean;
    placeholder?: string;
    options?: { label: string; value: string }[];
    sensitive?: boolean; // If true, value is encrypted at rest
}

// Authentication Configuration
export interface AuthConfig {
    type: AuthType;
    fields: CredentialField[];
    oauthConfig?: {
        authorizationUrl: string;
        tokenUrl: string;
        scopes: string[];
        clientId: string;
    };
}

// Integration Action (what the integration can do)
export interface IntegrationAction {
    id: string;
    name: string;
    description: string;
    inputSchema?: Record<string, any>;
    outputSchema?: Record<string, any>;
}

// Integration Trigger
export interface IntegrationTrigger {
    id: string;
    name: string;
    description: string;
    eventSchema?: Record<string, any>;
}

// Integration Manifest - the core definition
export interface IntegrationManifest {
    slug: string;
    name: string;
    version: string;
    description: string;
    author: {
        name: string;
        url?: string;
        email?: string;
    };
    license: string;
    category: IntegrationCategory;
    tags: string[];
    icon?: string;
    homepage?: string;
    repository?: string;

    // Capabilities
    capabilities: {
        read?: boolean;
        write?: boolean;
        sync?: boolean;
        webhook?: boolean;
        trigger?: boolean;
    };

    // API Definition
    authentication: AuthConfig;
    actions: IntegrationAction[];
    triggers: IntegrationTrigger[];

    // Metadata
    rateLimit?: {
        requests: number;
        window: number; // in seconds
    };

    // Version info
    complianceosVersion?: string; // Min required version
}

// User's connection to an integration
export interface IntegrationConnection {
    id: string;
    userId: string;
    organizationId?: string;
    integrationSlug: string;
    name: string; // User's name for this connection, e.g., "My Company GitHub"
    status: IntegrationStatus;

    // Credentials (encrypted)
    credentials: Record<string, string>;

    // Settings
    settings: Record<string, any>;

    // Metadata
    createdAt: Date;
    updatedAt: Date;
    lastSyncAt?: Date;
    errorMessage?: string;
}

// Marketplace Entry (for listing in marketplace)
export interface MarketplaceEntry {
    manifest: IntegrationManifest;
    installed: boolean;
    connected: boolean;
    rating?: number;
    downloads?: number;
    verified?: boolean;
}

// GitHub Registry Entry
export interface GitHubRegistryEntry {
    slug: string;
    name: string;
    repository: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
}

// Integration Execution Context
export interface IntegrationContext {
    connectionId: string;
    userId: string;
    organizationId?: string;
    credentials: Record<string, string>;
    settings: Record<string, any>;
}

// Integration Execution Result
export interface IntegrationResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
}

// Events emitted by integrations
export interface IntegrationEvent {
    type: 'action' | 'trigger' | 'error' | 'sync';
    connectionId: string;
    integrationSlug: string;
    payload: any;
    timestamp: Date;
}
