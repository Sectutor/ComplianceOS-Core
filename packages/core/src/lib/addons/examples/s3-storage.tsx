import React from 'react';
import { StorageAddon, type StorageAddonManifest } from '../types/storage';
import type { AddonConfiguration } from '../types';
import type { AddonHookResult } from '../types';

interface S3StorageManifest extends StorageAddonManifest {
  type: 'storage';
  provider: 'aws-s3';
}

const s3StorageManifest: S3StorageManifest = {
  id: 's3-storage',
  name: 'AWS S3 Storage',
  version: '1.0.0',
  description: 'Store compliance evidence and documents in AWS S3 with encryption and versioning',
  author: 'ComplianceOS Team',
  category: 'storage',
  tags: ['aws', 's3', 'storage', 'evidence'],
  homepage: 'https://complianceos.com/addons/s3',
  compatibility: {
    minVersion: '1.0.0',
  },
  permissions: ['read:evidence', 'write:evidence'],
  type: 'storage',
  provider: 'aws-s3',
  region: 'us-east-1',
  capabilities: {
    maxFileSize: 5 * 1024 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/zip',
    ],
    maxStorage: 100 * 1024 * 1024 * 1024,
    versioning: true,
    encryption: true,
    compression: false,
  },
  features: {
    fileOperations: true,
    folderOperations: true,
    versioning: true,
    sharing: true,
    encryption: true,
    streaming: true,
  },
};

export class S3StorageAddon extends StorageAddon {
  private connected: boolean = false;

  constructor() {
    super(s3StorageManifest);
  }

  getProviderId(): string {
    return 'aws-s3';
  }

  getProviderName(): string {
    return 'Amazon S3';
  }

  getDefaultIcon(): string {
    return '/icons/aws-s3.svg';
  }

  async connect(config: AddonConfiguration): Promise<AddonHookResult> {
    try {
      const { accessKeyId, secretAccessKey, region, bucket } = config;

      if (!accessKeyId || !secretAccessKey || !bucket) {
        return { success: false, message: 'Missing required credentials' };
      }

      const testResponse = await this.makeRequest(
        'HEAD',
        `/${bucket}`,
        {},
        { accessKeyId, secretAccessKey, region }
      );

      if (!testResponse.success) {
        return testResponse;
      }

      this.connected = true;
      return { success: true, message: 'Connected to S3 successfully' };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
    }
  }

  async disconnect(): Promise<AddonHookResult> {
    this.connected = false;
    return { success: true };
  }

  async testConnection(): Promise<AddonHookResult> {
    const config = this.getConfig();
    const { accessKeyId, secretAccessKey, region, bucket } = config;

    if (!accessKeyId || !secretAccessKey || !bucket) {
      return { success: false, message: 'Credentials not configured' };
    }

    return this.makeRequest(
      'HEAD',
      `/${bucket}`,
      {},
      { accessKeyId, secretAccessKey, region }
    );
  }

  async uploadFile(
    path: string,
    content: Buffer | Blob | string,
    metadata?: Record<string, unknown>,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();
    
    try {
      const body = content instanceof Buffer 
        ? Buffer.from(content) 
        : content instanceof Blob 
          ? Buffer.from(await content.arrayBuffer())
          : Buffer.from(content);

      const result = await this.makeRequest(
        'PUT',
        `/${addonConfig.bucket}/${path}`,
        body,
        addonConfig,
        {
          'Content-Type': this.getContentType(path),
          'x-amz-meta-metadata': JSON.stringify(metadata || {}),
          'x-amz-server-side-encryption': 'AES256',
        }
      );

      return result;
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Upload failed' };
    }
  }

  async downloadFile(path: string, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();

    return this.makeRequest(
      'GET',
      `/${addonConfig.bucket}/${path}`,
      undefined,
      addonConfig
    );
  }

  async deleteFile(path: string, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();

    return this.makeRequest(
      'DELETE',
      `/${addonConfig.bucket}/${path}`,
      undefined,
      addonConfig
    );
  }

  async listFiles(path: string, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();

    const result = await this.makeRequest(
      'GET',
      `/${addonConfig.bucket}?prefix=${encodeURIComponent(path)}&list-type=2`,
      undefined,
      addonConfig
    );

    if (result.success && result.data) {
      const listResult = this.parseListObjects(result.data);
      return { success: true, data: listResult };
    }

    return result;
  }

  async createFolder(path: string, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();
    const folderPath = path.endsWith('/') ? path : `${path}/`;

    return this.makeRequest(
      'PUT',
      `/${addonConfig.bucket}/${folderPath}`,
      '',
      addonConfig,
      { 'Content-Type': 'application/directory' }
    );
  }

  async deleteFolder(path: string, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();
    const folderPath = path.endsWith('/') ? path : `${path}/`;

    const listResult = await this.listFiles(folderPath, addonConfig);
    if (listResult.success && listResult.data) {
      const files = listResult.data as Array<{ Key: string }>;
      for (const file of files) {
        await this.deleteFile(file.Key, addonConfig);
      }
    }

    return this.makeRequest(
      'DELETE',
      `/${addonConfig.bucket}/${folderPath}`,
      undefined,
      addonConfig
    );
  }

  async getFileUrl(path: string, expiresIn: number = 3600, config?: AddonConfiguration): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();

    const result = await this.makeRequest(
      'GET',
      `/${addonConfig.bucket}/${path}?presigned=true&expires=${expiresIn}`,
      undefined,
      addonConfig
    );

    if (result.success && result.data) {
      const url = (result.data as { url: string }).url;
      return { success: true, data: { url, expiresIn } };
    }

    return result;
  }

  private async makeRequest(
    method: string,
    path: string,
    body?: Buffer | string,
    config?: AddonConfiguration,
    additionalHeaders?: Record<string, string>
  ): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();
    const { accessKeyId, secretAccessKey, region } = addonConfig;

    const host = `${addonConfig.bucket}.s3.${region}.amazonaws.com`;
    const date = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const payloadHash = await this.sha256Hash(body || '');

    const headers: Record<string, string> = {
      'Host': host,
      'x-amz-date': date,
      'x-amz-content-sha256': payloadHash,
      ...additionalHeaders,
    };

    try {
      const response = await fetch(`https://${host}${path}`, {
        method,
        headers: {
          ...headers,
          'Authorization': this.signRequest(method, path, headers, payloadHash, accessKeyId as string, secretAccessKey as string, region as string),
        },
        body: body as BodyInit,
      });

      if (!response.ok && response.status !== 200) {
        const errorText = await response.text();
        return { success: false, message: `S3 Error: ${errorText}` };
      }

      if (method === 'GET' && path.includes('?list-type=2')) {
        const text = await response.text();
        return { success: true, data: this.parseListObjectsXML(text) };
      }

      if (method === 'GET') {
        const blob = await response.blob();
        return { success: true, data: { blob, contentType: response.headers.get('content-type') } };
      }

      return { success: true };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Request failed' };
    }
  }

  private async sha256Hash(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private signRequest(
    method: string,
    path: string,
    headers: Record<string, string>,
    payloadHash: string,
    accessKeyId: string,
    secretAccessKey: string,
    region: string
  ): string {
    const date = headers['x-amz-date'];
    const canonicalHeaders = Object.entries(headers)
      .map(([k, v]) => `${k.toLowerCase()}:${v}`)
      .sort()
      .join('\n');
    const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');

    const canonicalRequest = [
      method,
      path,
      '',
      canonicalHeaders,
      '',
      signedHeaders,
      payloadHash,
    ].join('\n');

    const credentialScope = `${date.slice(0, 8)}/${region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      date,
      credentialScope,
      await this.sha256Hash(canonicalRequest),
    ].join('\n');

    const signingKey = await this.getSigningKey(secretAccessKey, date.slice(0, 8), region, 's3');
    const signature = await this.hmacSign(signingKey, stringToSign);

    return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private async getSigningKey(
    secretAccessKey: string,
    date: string,
    region: string,
    service: string
  ): Promise<Buffer> {
    const encoder = new TextEncoder();
    const key = encoder.encode(`AWS4${secretAccessKey}`);
    const dateKey = await this.hmacSign(key, date);
    const dateRegionKey = await this.hmacSign(dateKey, region);
    const dateRegionServiceKey = await this.hmacSign(dateRegionKey, service);
    return this.hmacSign(dateRegionServiceKey, 'aws4_request');
  }

  private async hmacSign(key: Buffer | string, data: string): Promise<Buffer> {
    const encoder = new TextEncoder();
    const keyBytes = key instanceof Buffer ? key : encoder.encode(key);
    const dataBytes = encoder.encode(data);
    const cryptoKey = await crypto.subtle.importKey(
      'HMAC',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBytes);
    return Buffer.from(signature);
  }

  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      zip: 'application/zip',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  private parseListObjects(data: unknown): Array<{ Key: string; Size: number; LastModified: Date }> {
    return [];
  }

  private parseListObjectsXML(xml: string): Array<{ Key: string; Size: number; LastModified: Date }> {
    const files: Array<{ Key: string; Size: number; LastModified: Date }> = [];
    const contentMatch = xml.match(/<Contents>([\s\S]*?)<\/Contents>/g);
    
    if (contentMatch) {
      for (const content of contentMatch) {
        const keyMatch = content.match(/<Key>(.*?)<\/Key>/);
        const sizeMatch = content.match(/<Size>(\d+)<\/Size>/);
        const dateMatch = content.match(/<LastModified>(.*?)<\/LastModified>/);
        
        if (keyMatch) {
          files.push({
            Key: keyMatch[1],
            Size: parseInt(sizeMatch?.[1] || '0'),
            LastModified: new Date(dateMatch?.[1] || new Date()),
          });
        }
      }
    }
    
    return files;
  }

  getSettingsSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        accessKeyId: {
          type: 'string',
          title: 'Access Key ID',
          description: 'AWS Access Key ID with S3 permissions',
        },
        secretAccessKey: {
          type: 'string',
          title: 'Secret Access Key',
          description: 'AWS Secret Access Key',
        },
        region: {
          type: 'string',
          title: 'AWS Region',
          default: 'us-east-1',
        },
        bucket: {
          type: 'string',
          title: 'S3 Bucket',
          description: 'The S3 bucket name for storing evidence',
        },
        encryption: {
          type: 'boolean',
          title: 'Server-Side Encryption',
          default: true,
        },
        versioning: {
          type: 'boolean',
          title: 'Enable Versioning',
          default: true,
        },
      },
      required: ['accessKeyId', 'secretAccessKey', 'bucket'],
    };
  }

  renderSettings(): React.ReactNode {
    const config = this.getConfig();
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Access Key ID</label>
          <input
            type="text"
            name="accessKeyId"
            defaultValue={config.accessKeyId as string}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="AKIAIOSFODNN7EXAMPLE"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Secret Access Key</label>
          <input
            type="password"
            name="secretAccessKey"
            defaultValue={config.secretAccessKey as string}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="••••••••••••••••"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">AWS Region</label>
          <select
            name="region"
            defaultValue={(config.region as string) || 'us-east-1'}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">S3 Bucket Name</label>
          <input
            type="text"
            name="bucket"
            defaultValue={config.bucket as string}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="my-compliance-bucket"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="encryption"
              defaultChecked={config.encryption !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Server-Side Encryption (AES256)</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="versioning"
              defaultChecked={config.versioning !== false}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">Enable Versioning</span>
          </div>
        </div>
      </div>
    );
  }
}

export const s3StorageAddon = new S3StorageAddon();
