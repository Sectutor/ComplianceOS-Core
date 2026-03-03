/**
 * GitHub Integration
 * 
 * Proof-of-concept integration for connecting to GitHub.
 * Demonstrates the integration marketplace pattern.
 */

import type {
    IntegrationManifest,
    IntegrationAction,
    IntegrationContext,
    IntegrationResult
} from '../types';

export const githubManifest: IntegrationManifest = {
    slug: 'github',
    name: 'GitHub',
    version: '1.0.0',
    description: 'Connect to GitHub to sync repositories, issues, and security findings',
    author: {
        name: 'ComplianceOS',
        url: 'https://complianceos.com'
    },
    license: 'MIT',
    category: 'source-control',
    tags: ['security', 'scanning', 'devops', 'sast'],
    icon: '🐙',
    homepage: 'https://github.com',
    repository: 'https://github.com/complianceos/integrations',

    capabilities: {
        read: true,
        sync: true,
        webhook: true
    },

    authentication: {
        type: 'oauth2',
        fields: [],
        oauthConfig: {
            authorizationUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: ['repo', 'read:org', 'security_events'],
            clientId: '' // Will be configured in settings
        }
    },

    actions: [
        {
            id: 'list-repos',
            name: 'List Repositories',
            description: 'List all accessible GitHub repositories',
            outputSchema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        fullName: { type: 'string' },
                        private: { type: 'boolean' },
                        url: { type: 'string' }
                    }
                }
            }
        },
        {
            id: 'get-security-alerts',
            name: 'Get Security Alerts',
            description: 'Fetch GitHub Dependabot and Code Scanning alerts',
            outputSchema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        repository: { type: 'string' },
                        alertType: { type: 'string' },
                        severity: { type: 'string' },
                        title: { type: 'string' },
                        url: { type: 'string' }
                    }
                }
            }
        },
        {
            id: 'list-issues',
            name: 'List Issues',
            description: 'List issues from repositories',
            inputSchema: {
                type: 'object',
                properties: {
                    repository: { type: 'string' },
                    state: { type: 'string', enum: ['open', 'closed', 'all'] }
                }
            },
            outputSchema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        number: { type: 'number' },
                        title: { type: 'string' },
                        state: { type: 'string' },
                        labels: { type: 'array' }
                    }
                }
            }
        },
        {
            id: 'get-workflow-runs',
            name: 'Get Workflow Runs',
            description: 'Fetch GitHub Actions workflow runs for compliance status',
            outputSchema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'number' },
                        name: { type: 'string' },
                        status: { type: 'string' },
                        conclusion: { type: 'string' },
                        createdAt: { type: 'string' }
                    }
                }
            }
        }
    ],

    triggers: [
        {
            id: 'new-security-alert',
            name: 'New Security Alert',
            description: 'Trigger when a new security alert is detected'
        },
        {
            id: 'workflow-completed',
            name: 'Workflow Completed',
            description: 'Trigger when a GitHub Actions workflow completes'
        }
    ],

    rateLimit: {
        requests: 5000,
        window: 3600
    },

    complianceosVersion: '1.0.0'
};

// GitHub API client
export class GitHubClient {
    private token: string;
    private baseUrl = 'https://api.github.com';

    constructor(token: string) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'X-GitHub-Api-Version': '2022-11-28',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`GitHub API error: ${error.message}`);
        }

        return response.json();
    }

    async listRepositories(): Promise<any[]> {
        return this.request('/user/repos?per_page=100&sort=updated');
    }

    async getRepository(owner: string, repo: string): Promise<any> {
        return this.request(`/repos/${owner}/${repo}`);
    }

    async getSecurityAlerts(owner: string, repo: string): Promise<any[]> {
        try {
            // Dependabot alerts
            const dependabot = await this.request(`/repos/${owner}/${repo}/dependabot/alerts`)
                .catch(() => []);

            // Code scanning alerts
            const codeScanning = await this.request(`/repos/${owner}/${repo}/code-scanning/alerts`)
                .catch(() => []);

            return [
                ...dependabot.map((a: any) => ({
                    repository: `${owner}/${repo}`,
                    alertType: 'dependabot',
                    severity: a.security_advisory?.severity || 'unknown',
                    title: a.security_advisory?.summary || a.alert?.rule?.description || 'Unknown',
                    url: a.html_url
                })),
                ...codeScanning.map((a: any) => ({
                    repository: `${owner}/${repo}`,
                    alertType: 'code-scanning',
                    severity: a.rule?.security_severity_level || 'unknown',
                    title: a.rule?.description || 'Unknown',
                    url: a.html_url
                }))
            ];
        } catch (error) {
            console.error('[GitHub] Error fetching security alerts:', error);
            return [];
        }
    }

    async listIssues(owner: string, repo: string, state: string = 'open'): Promise<any[]> {
        return this.request(`/repos/${owner}/${repo}/issues?state=${state}&per_page=50`);
    }

    async getWorkflowRuns(owner: string, repo: string): Promise<any[]> {
        const data = await this.request(`/repos/${owner}/${repo}/actions/runs?per_page=20`);
        return data.workflow_runs || [];
    }
}

// Action executors
export const githubActions = {
    'list-repos': async (context: IntegrationContext): Promise<IntegrationResult> => {
        try {
            const client = new GitHubClient(context.credentials.accessToken);
            const repos = await client.listRepositories();

            return {
                success: true,
                data: repos.map(r => ({
                    id: r.id,
                    name: r.name,
                    fullName: r.full_name,
                    private: r.private,
                    url: r.html_url
                })),
                timestamp: new Date()
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    },

    'get-security-alerts': async (context: IntegrationContext): Promise<IntegrationResult> => {
        try {
            const client = new GitHubClient(context.credentials.accessToken);
            const repos = await client.listRepositories();
            const alerts: any[] = [];

            // Get alerts from first 10 repos (to avoid rate limits)
            for (const repo of repos.slice(0, 10)) {
                const [owner, name] = repo.full_name.split('/');
                const repoAlerts = await client.getSecurityAlerts(owner, name);
                alerts.push(...repoAlerts);
            }

            return {
                success: true,
                data: alerts,
                timestamp: new Date()
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    },

    'list-issues': async (context: IntegrationContext, params: { repository?: string; state?: string }): Promise<IntegrationResult> => {
        try {
            const client = new GitHubClient(context.credentials.accessToken);
            const repos = await client.listRepositories();

            const targetRepo = params.repository || repos[0]?.full_name;
            if (!targetRepo) {
                return {
                    success: false,
                    error: 'No repositories found',
                    timestamp: new Date()
                };
            }

            const [owner, name] = targetRepo.split('/');
            const issues = await client.listIssues(owner, name, params.state || 'open');

            return {
                success: true,
                data: issues.map(i => ({
                    id: i.id,
                    number: i.number,
                    title: i.title,
                    state: i.state,
                    labels: i.labels.map((l: any) => l.name)
                })),
                timestamp: new Date()
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    },

    'get-workflow-runs': async (context: IntegrationContext): Promise<IntegrationResult> => {
        try {
            const client = new GitHubClient(context.credentials.accessToken);
            const repos = await client.listRepositories();
            const runs: any[] = [];

            // Get workflow runs from first 10 repos
            for (const repo of repos.slice(0, 10)) {
                const [owner, name] = repo.full_name.split('/');
                const repoRuns = await client.getWorkflowRuns(owner, name);
                runs.push(...repoRuns.map(r => ({
                    id: r.id,
                    name: r.name,
                    status: r.status,
                    conclusion: r.conclusion,
                    createdAt: r.created_at
                })));
            }

            return {
                success: true,
                data: runs,
                timestamp: new Date()
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
};

// Main execute function
export async function executeGitHubAction(
    actionId: string,
    context: IntegrationContext,
    params?: any
): Promise<IntegrationResult> {
    const executor = githubActions[actionId as keyof typeof githubActions];

    if (!executor) {
        return {
            success: false,
            error: `Unknown action: ${actionId}`,
            timestamp: new Date()
        };
    }

    return executor(context, params);
}

// Export the manifest
export default githubManifest;
