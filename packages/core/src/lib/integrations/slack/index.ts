/**
 * Slack Integration
 * 
 * Integration for connecting to Slack for notifications and reporting.
 */

import type {
    IntegrationManifest,
    IntegrationContext,
    IntegrationResult
} from '../types';

export const slackManifest: IntegrationManifest = {
    slug: 'slack',
    name: 'Slack',
    version: '1.0.0',
    description: 'Connect to Slack to send security alerts, compliance notifications, and audit reports',
    author: {
        name: 'ComplianceOS',
        url: 'https://complianceos.com'
    },
    license: 'MIT',
    category: 'communication',
    tags: ['notifications', 'collaboration', 'chatops'],
    icon: '💬',
    homepage: 'https://slack.com',
    repository: 'https://github.com/complianceos/integrations',

    capabilities: {
        write: true,
        webhook: true
    },

    authentication: {
        type: 'oauth2',
        fields: [],
        oauthConfig: {
            authorizationUrl: 'https://slack.com/oauth/v2/authorize',
            tokenUrl: 'https://slack.com/api/oauth.v2.access',
            scopes: ['chat:write', 'chat:write.public', 'incoming-webhook', 'channels:read'],
            clientId: '' // Configured in settings
        }
    },

    actions: [
        {
            id: 'send-message',
            name: 'Send Message',
            description: 'Send a message to a Slack channel',
            inputSchema: {
                type: 'object',
                properties: {
                    channel: { type: 'string', description: 'Channel ID or Name' },
                    text: { type: 'string', description: 'Message content' },
                    thread_ts: { type: 'string', description: 'Optional thread timestamp' }
                },
                required: ['channel', 'text']
            }
        },
        {
            id: 'list-channels',
            name: 'List Channels',
            description: 'List public Slack channels',
            outputSchema: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        is_private: { type: 'boolean' }
                    }
                }
            }
        }
    ],

    triggers: [
        {
            id: 'mention',
            name: 'On Mention',
            description: 'Trigger when the app is mentioned in a channel'
        }
    ],

    complianceosVersion: '1.0.0'
};

/**
 * Slack API Client
 */
export class SlackClient {
    private token: string;
    private baseUrl = 'https://slack.com/api';

    constructor(token: string) {
        this.token = token;
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return data;
    }

    async postMessage(channel: string, text: string, thread_ts?: string): Promise<any> {
        return this.request('/chat.postMessage', {
            method: 'POST',
            body: JSON.stringify({ channel, text, thread_ts })
        });
    }

    async listChannels(): Promise<any[]> {
        const data: any = await this.request('/conversations.list?types=public_channel&exclude_archived=true');
        return data.channels || [];
    }
}

/**
 * Slack Action Executors
 */
export const slackActions = {
    'send-message': async (context: IntegrationContext, params: { channel: string; text: string; thread_ts?: string }): Promise<IntegrationResult> => {
        try {
            const client = new SlackClient(context.credentials.accessToken);
            const result = await client.postMessage(params.channel, params.text, params.thread_ts);

            return {
                success: true,
                data: result,
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

    'list-channels': async (context: IntegrationContext): Promise<IntegrationResult> => {
        try {
            const client = new SlackClient(context.credentials.accessToken);
            const channels = await client.listChannels();

            return {
                success: true,
                data: channels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    is_private: c.is_private
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
    }
};

/**
 * Main execute function
 */
export async function executeSlackAction(
    actionId: string,
    context: IntegrationContext,
    params?: any
): Promise<IntegrationResult> {
    const executor = slackActions[actionId as keyof typeof slackActions];

    if (!executor) {
        return {
            success: false,
            error: `Unknown action: ${actionId}`,
            timestamp: new Date()
        };
    }

    return executor(context, params);
}

export default slackManifest;
