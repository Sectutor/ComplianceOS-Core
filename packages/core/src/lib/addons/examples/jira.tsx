import React from 'react';
import { IntegrationAddon, type IntegrationAddonManifest } from '../types/integration';
import type { AddonConfiguration } from '../types';
import type { AddonHookResult } from '../types';

interface JiraIntegrationManifest extends IntegrationAddonManifest {
  type: 'integration';
  provider: 'jira';
  authType: 'oauth';
  oauthConfig: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scopes: string[];
    authUrl: string;
    tokenUrl: string;
  };
  features: Array<{
    id: string;
    name: string;
    description?: string;
    endpoint?: string;
  }>;
}

const jiraManifest: JiraIntegrationManifest = {
  id: 'jira-integration',
  name: 'Jira Integration',
  version: '1.0.0',
  description: 'Connect ComplianceOS with Jira to sync controls, findings, and remediation tasks',
  author: 'ComplianceOS Team',
  category: 'integration',
  tags: ['issue-tracking', 'remediation', 'automation'],
  homepage: 'https://complianceos.com/addons/jira',
  compatibility: {
    minVersion: '1.0.0',
  },
  permissions: ['read:clients', 'write:clients', 'read:evidence', 'write:evidence'],
  type: 'integration',
  provider: 'jira',
  authType: 'oauth',
  oauthConfig: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${typeof window !== 'undefined' ? window.location.origin : ''}/oauth/callback/jira`,
    scopes: ['read:jira-work', 'write:jira-work', 'read:jira-user'],
    authUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
  },
  features: [
    { id: 'sync-controls', name: 'Control Sync', description: 'Sync compliance controls with Jira issues' },
    { id: 'sync-findings', name: 'Findings Sync', description: 'Create Jira issues for compliance findings' },
    { id: 'auto-remediation', name: 'Auto Remediation', description: 'Auto-create remediation tasks' },
  ],
};

export class JiraIntegration extends IntegrationAddon {
  constructor() {
    super(jiraManifest as unknown as IntegrationAddonManifest, 'oauth');
  }

  getProviderId(): string {
    return 'jira';
  }

  getProviderName(): string {
    return 'Jira';
  }

  getDefaultIcon(): string {
    return '/icons/jira.svg';
  }

  async testConnection(config: AddonConfiguration): Promise<AddonHookResult> {
    try {
      const accessToken = config.accessToken;
      if (!accessToken) {
        return { success: false, message: 'Not connected. Please authorize first.' };
      }

      const cloudId = config.cloudId;
      if (!cloudId) {
        return { success: false, message: 'Cloud ID not configured' };
      }

      const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/myself`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, message: 'Connection test failed' };
      }

      const user = await response.json();
      return { success: true, data: { user: user.displayName } };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Connection test failed' };
    }
  }

  async executeRequest(
    endpoint: string,
    method: string,
    data?: unknown,
    config?: AddonConfiguration
  ): Promise<AddonHookResult> {
    const addonConfig = config || this.getConfig();
    const accessToken = addonConfig.accessToken as string;
    const cloudId = addonConfig.cloudId as string;

    if (!accessToken || !cloudId) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await fetch(`https://api.atlassian.com/ex/jira/${cloudId}${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, message: error };
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Request failed' };
    }
  }

  async getProjects(): Promise<AddonHookResult> {
    return this.executeRequest('/rest/api/3/project', 'GET');
  }

  async createIssue(data: {
    project: string;
    summary: string;
    description?: string;
    issueType: string;
    labels?: string[];
    customFields?: Record<string, unknown>;
  }): Promise<AddonHookResult> {
    return this.executeRequest('/rest/api/3/issue', 'POST', {
      fields: {
        project: { key: data.project },
        summary: data.summary,
        description: data.description ? {
          type: 'doc',
          version: 1,
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: data.description }],
            },
          ],
        } : undefined,
        issuetype: { name: data.issueType },
        labels: data.labels,
        ...data.customFields,
      },
    });
  }

  async searchIssues(jql: string, options?: {
    maxResults?: number;
    startAt?: number;
    fields?: string[];
  }): Promise<AddonHookResult> {
    return this.executeRequest('/rest/api/3/search', 'POST', {
      jql,
      maxResults: options?.maxResults || 50,
      startAt: options?.startAt || 0,
      fields: options?.fields || ['summary', 'status', 'assignee', 'created', 'updated'],
    });
  }

  getSettingsSchema(): Record<string, unknown> {
    return {
      type: 'object',
      properties: {
        cloudId: {
          type: 'string',
          title: 'Jira Cloud ID',
          description: 'Your Jira Cloud instance ID',
        },
        defaultProject: {
          type: 'string',
          title: 'Default Project',
          description: 'Default Jira project for syncing issues',
        },
        syncEnabled: {
          type: 'boolean',
          title: 'Enable Auto Sync',
          default: false,
        },
        syncInterval: {
          type: 'number',
          title: 'Sync Interval (minutes)',
          default: 60,
          minimum: 15,
          maximum: 1440,
        },
      },
    };
  }

  renderSettings(): React.ReactNode {
    const config = this.getConfig();
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Jira Cloud ID</label>
          <input
            type="text"
            name="cloudId"
            defaultValue={config.cloudId as string}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="your-cloud-id"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Default Project</label>
          <input
            type="text"
            name="defaultProject"
            defaultValue={config.defaultProject as string}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="COMPLIANCE"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Auto Sync</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="syncEnabled"
              defaultChecked={config.syncEnabled as boolean}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-muted-foreground">Enable automatic issue synchronization</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Sync Interval (minutes)</label>
          <input
            type="number"
            name="syncInterval"
            defaultValue={config.syncInterval as number || 60}
            min={15}
            max={1440}
            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
    );
  }
}

export const jiraAddon = new JiraIntegration();
