import { BaseAddon } from '../base';
import type { AddonContext, AddonConfiguration } from '../types';
import type { AddonHookResult, AddonInitializationResult } from '../types';

export interface StorageFile {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface StorageFolder {
  id: string;
  name: string;
  path: string;
  parentId?: string;
  createdAt: Date;
}

export interface StorageCapabilities {
  maxFileSize: number;
  allowedMimeTypes: string[];
  maxStorage?: number;
  versioning?: boolean;
  encryption?: boolean;
  compression?: boolean;
}

export interface StorageAddonManifest {
  type: 'storage';
  provider: string;
  region?: string;
  capabilities: StorageCapabilities;
  features: {
    fileOperations: boolean;
    folderOperations: boolean;
    versioning: boolean;
    sharing: boolean;
    encryption: boolean;
    streaming: boolean;
  };
}

export abstract class StorageAddon extends BaseAddon {
  constructor(manifest: StorageAddonManifest) {
    super(manifest);
  }

  abstract getProviderId(): string;
  abstract getProviderName(): string;
  abstract getDefaultIcon(): string;

  abstract connect(config: AddonConfiguration): Promise<AddonHookResult>;
  abstract disconnect(): Promise<AddonHookResult>;
  abstract testConnection(): Promise<AddonHookResult>;

  abstract uploadFile(
    path: string,
    content: Buffer | Blob | string,
    metadata?: Record<string, unknown>,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract downloadFile(
    path: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract deleteFile(
    path: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract listFiles(
    path: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract createFolder(
    path: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract deleteFolder(
    path: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  abstract getFileUrl(
    path: string,
    expiresIn?: number,
    config?: AddonConfiguration
  ): Promise<AddonHookResult>;

  async onInitialize(): Promise<AddonInitializationResult> {
    return this.testConnection();
  }

  async onActivate(): Promise<AddonHookResult> {
    const config = this.getConfig();
    return this.connect(config);
  }

  async onDeactivate(): Promise<AddonHookResult> {
    return this.disconnect();
  }

  async onUninstall(): Promise<AddonHookResult> {
    await this.disconnect();
    return { success: true };
  }

  getCapabilities(): StorageCapabilities {
    return (this.manifestData as unknown as StorageAddonManifest).capabilities;
  }

  getFeatures(): StorageAddonManifest['features'] {
    return (this.manifestData as unknown as StorageAddonManifest).features;
  }

  async uploadEvidence(
    clientId: number,
    evidenceId: string,
    fileName: string,
    content: Buffer | Blob | string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const path = `clients/${clientId}/evidence/${evidenceId}/${fileName}`;
    return this.uploadFile(path, content, { clientId, evidenceId }, config);
  }

  async downloadEvidence(
    clientId: number,
    evidenceId: string,
    fileName: string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const path = `clients/${clientId}/evidence/${evidenceId}/${fileName}`;
    return this.downloadFile(path, config);
  }

  async uploadPolicy(
    clientId: number,
    policyId: string,
    fileName: string,
    content: Buffer | Blob | string,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const path = `clients/${clientId}/policies/${policyId}/${fileName}`;
    return this.uploadFile(path, content, { clientId, policyId }, config);
  }

  abstract getSettingsSchema(): Record<string, unknown>;
  abstract renderSettings(): React.ReactNode;
}
