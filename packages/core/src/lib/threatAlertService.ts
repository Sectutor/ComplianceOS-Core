/**
 * Threat Alert Notification Service
 * 
 * Sends real-time alerts for threat intelligence events via:
 * - Webhooks
 * - Slack
 * - Email
 */

import { getDb } from '../db';
import { threatAlertSettings, type ThreatAlertSettings } from '../schema';
import { eq } from 'drizzle-orm';
import { encrypt, decrypt } from './crypto';

export interface ThreatAlert {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    source: string;
    cveIds?: string[];
    link?: string;
    timestamp: Date;
}

export interface AlertResult {
    success: boolean;
    channel: string;
    error?: string;
}

/**
 * Get alert settings for a client (with decrypted webhook URLs)
 */
export async function getAlertSettings(clientId: number): Promise<ThreatAlertSettings | null> {
    const dbConn = await getDb();
    const result = await dbConn.query.threatAlertSettings.findFirst({
        where: eq(threatAlertSettings.clientId, clientId)
    });
    
    if (!result) return null;
    
    // Decrypt webhook URLs for use
    return {
        ...result,
        webhookUrl: result.webhookUrl ? decrypt(result.webhookUrl) : null,
        slackWebhookUrl: result.slackWebhookUrl ? decrypt(result.slackWebhookUrl) : null,
    };
}

/**
 * Create or update alert settings (with encrypted webhook URLs)
 */
export async function saveAlertSettings(
    clientId: number,
    settings: Partial<ThreatAlertSettings>
): Promise<ThreatAlertSettings> {
    const dbConn = await getDb();
    const existing = await getAlertSettings(clientId);
    
    // Encrypt sensitive URLs before saving
    const encryptedSettings = {
        ...settings,
        webhookUrl: settings.webhookUrl ? encrypt(settings.webhookUrl) : undefined,
        slackWebhookUrl: settings.slackWebhookUrl ? encrypt(settings.slackWebhookUrl) : undefined,
    };

    if (existing) {
        await dbConn.update(threatAlertSettings)
            .set({ ...encryptedSettings, updatedAt: new Date() })
            .where(eq(threatAlertSettings.clientId, clientId));
        return (await getAlertSettings(clientId))!;
    } else {
        const [created] = await dbConn.insert(threatAlertSettings)
            .values({ clientId, ...encryptedSettings })
            .returning();
        return (await getAlertSettings(clientId))!;
    }
}

/**
 * Send webhook alert
 */
async function sendWebhookAlert(settings: ThreatAlertSettings, alert: ThreatAlert): Promise<AlertResult> {
    if (!settings.webhookUrl) {
        return { success: false, channel: 'webhook', error: 'No webhook URL configured' };
    }

    try {
        const payload = {
            alert: {
                id: alert.id,
                title: alert.title,
                description: alert.description,
                severity: alert.severity,
                source: alert.source,
                cveIds: alert.cveIds,
                link: alert.link,
                timestamp: alert.timestamp.toISOString(),
            },
            metadata: {
                source: 'ComplianceOS Threat Intelligence',
                version: '1.0',
            }
        };

        const response = await fetch(settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return {
                success: false,
                channel: 'webhook',
                error: `HTTP ${response.status}: ${response.statusText}`
            };
        }

        return { success: true, channel: 'webhook' };
    } catch (error) {
        return {
            success: false,
            channel: 'webhook',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(settings: ThreatAlertSettings, alert: ThreatAlert): Promise<AlertResult> {
    if (!settings.slackWebhookUrl) {
        return { success: false, channel: 'slack', error: 'No Slack webhook URL configured' };
    }

    const severityEmoji: Record<string, string> = {
        critical: ':rotating_light:',
        high: ':warning:',
        medium: ':large_blue_circle:',
        low: ':white_circle:',
    };

    const color: Record<string, string> = {
        critical: '#FF0000',
        high: '#FFA500',
        medium: '#FFFF00',
        low: '#00FF00',
    };

    try {
        const payload = {
            attachments: [{
                color: color[alert.severity] || '#808080',
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: `${severityEmoji[alert.severity] || ''} ${alert.title}`,
                            emoji: true,
                        },
                    },
                    {
                        type: 'section',
                        fields: [
                            {
                                type: 'mrkdwn',
                                text: `*Severity:*\n${alert.severity.toUpperCase()}`,
                            },
                            {
                                type: 'mrkdwn',
                                text: `*Source:*\n${alert.source}`,
                            },
                        ],
                    },
                    {
                        type: 'section',
                        text: {
                            type: 'mrkdwn',
                            text: alert.description.slice(0, 300) + (alert.description.length > 300 ? '...' : ''),
                        },
                    },
                ],
            }],
        };

        const response = await fetch(settings.slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            return {
                success: false,
                channel: 'slack',
                error: `HTTP ${response.status}`
            };
        }

        return { success: true, channel: 'slack' };
    } catch (error) {
        return {
            success: false,
            channel: 'slack',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Check if alert should be sent based on settings
 */
function shouldSendAlert(settings: ThreatAlertSettings, alert: ThreatAlert): boolean {
    // Check severity-based triggers
    if (alert.severity === 'critical' && !settings.alertOnCritical) return false;
    if (alert.severity === 'high' && !settings.alertOnHigh) return false;
    if (alert.severity === 'medium' && !settings.alertOnMedium) return false;

    // Check CVSS threshold
    // This would need CVE info to check - handled elsewhere

    // Check category-based triggers
    const description = (alert.description + ' ' + alert.title).toLowerCase();
    if (description.includes('zero-day') && !settings.alertOnZeroDay) return false;
    if (description.includes('ransomware') && !settings.alertOnRansomware) return false;
    if (description.includes('apt') || description.includes('advanced persistent')) {
        if (!settings.alertOnApt) return false;
    }
    if (alert.cveIds && alert.cveIds.length > 0 && !settings.alertOnNewCve) return false;

    return true;
}

/**
 * Send threat alert to all configured channels
 */
export async function sendThreatAlert(clientId: number, alert: ThreatAlert): Promise<AlertResult[]> {
    const settings = await getAlertSettings(clientId);
    const results: AlertResult[] = [];

    if (!settings) {
        console.log(`[ThreatAlert] No alert settings found for client ${clientId}`);
        return results;
    }

    // Check if we should send this alert
    if (!shouldSendAlert(settings, alert)) {
        console.log(`[ThreatAlert] Alert ${alert.id} filtered by settings`);
        return results;
    }

    // Send to webhook
    if (settings.webhookEnabled && settings.webhookUrl) {
        const result = await sendWebhookAlert(settings, alert);
        results.push(result);
        if (result.success) {
            console.log(`[ThreatAlert] Sent webhook alert: ${alert.title}`);
        }
    }

    // Send to Slack
    if (settings.slackEnabled && settings.slackWebhookUrl) {
        const result = await sendSlackAlert(settings, alert);
        results.push(result);
        if (result.success) {
            console.log(`[ThreatAlert] Sent Slack alert: ${alert.title}`);
        }
    }

    return results;
}

/**
 * Test alert configuration
 */
export async function testAlertConfiguration(clientId: number): Promise<AlertResult[]> {
    const settings = await getAlertSettings(clientId);
    const results: AlertResult[] = [];

    if (!settings) {
        return [{ success: false, channel: 'all', error: 'No settings configured' }];
    }

    const testAlert: ThreatAlert = {
        id: 'test-alert',
        title: '🧪 Test Alert from ComplianceOS',
        description: 'This is a test alert to verify your threat intelligence alert configuration is working correctly.',
        severity: 'high',
        source: 'ComplianceOS Test',
        timestamp: new Date(),
    };

    // Test webhook
    if (settings.webhookEnabled && settings.webhookUrl) {
        const result = await sendWebhookAlert(settings, testAlert);
        results.push(result);
    }

    // Test Slack
    if (settings.slackEnabled && settings.slackWebhookUrl) {
        const result = await sendSlackAlert(settings, testAlert);
        results.push(result);
    }

    return results;
}
