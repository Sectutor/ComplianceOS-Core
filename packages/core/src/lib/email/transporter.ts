
import nodemailer from 'nodemailer';
import { getDb } from '../../db';
import { clientIntegrations } from '../../schema';
import { eq, and } from 'drizzle-orm';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string; // Email address for replies
    clientId?: number; // Context to find specific SMTP settings
}

/**
 * Send an email using either Client-Specific SMTP or System Default
 */
// Configure SendGrid if API key is present
import sgMail from '@sendgrid/mail';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log("[Email] SendGrid SDK initialized.");
}

export async function sendEmail({ to, subject, html, from, replyTo, clientId }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
    let transporter = null;
    let fromAddress = from || process.env.SMTP_FROM || 'system@compliance-os.com';
    // Default replyTo to the sender's email if not specified
    const replyToAddress = replyTo || process.env.SMTP_REPLY_TO || fromAddress;

    // 1. Try to load Client Integrations (Custom SMTP)
    // If a client has specific settings, they usually want to override everything.
    if (clientId) {
        const db = await getDb();
        if (db) {
            const integration = await db.query.clientIntegrations.findFirst({
                where: and(
                    eq(clientIntegrations.clientId, clientId),
                    eq(clientIntegrations.isEnabled, true),
                    eq(clientIntegrations.provider, 'smtp')
                )
            });

            if (integration && integration.settings) {
                console.log(`[Email] Using Custom SMTP for Client ${clientId}`);
                const settings = integration.settings as any;

                try {
                    transporter = nodemailer.createTransport({
                        host: settings.host,
                        port: Number(settings.port) || 587,
                        secure: Number(settings.port) === 465,
                        auth: {
                            user: settings.user,
                            pass: settings.pass,
                        },
                    });

                    if (settings.fromEmail) {
                        fromAddress = settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail;
                    }
                } catch (e) {
                    console.error(`[Email] Failed to create custom transport for Client ${clientId}`, e);
                }
            }
        }
    }

    // 2. Use SendGrid SDK if available and no custom client transporter
    if (!transporter && SENDGRID_API_KEY) {
        try {
            console.log(`[Email] Sending via SendGrid API to ${to}`);

            // SendGrid allows multiple recipients in an array
            const toArray = Array.isArray(to) ? to : [to];

            await sgMail.send({
                to: toArray,
                from: fromAddress,
                replyTo: replyToAddress,
                subject: subject,
                html: html,
                // Track this as a system category
                categories: ['compliance-os-system'],
            });

            return { success: true, messageId: 'sendgrid-api-success' };
        } catch (error: any) {
            console.error(`[Email] SendGrid API failed: ${error.message}`);
            if (error.response) {
                console.error(`[Email] SendGrid Response: ${JSON.stringify(error.response.body)}`);
            }
            // Fallback to SMTP if SendGrid fails? 
            // Only if SMTP config is present.
            if (!process.env.SMTP_HOST) {
                return { success: false, error };
            }
            console.log("[Email] Falling back to Default SMTP due to SendGrid failure.");
        }
    }

    // 3. Fallback to System Default (from .env) via Nodemailer
    if (!transporter) {
        if (!process.env.SMTP_HOST) {
            console.warn("[Email] No SMTP_HOST defined and no SENDGRID_API_KEY. Email simulated.");
            console.log(`[SIMULATION] To: ${to}, Subject: ${subject}`);
            return { success: true, messageId: 'simulated-' + Math.random().toString(36).substring(7) };
        }

        console.log(`[Email] Using System Default SMTP`);
        try {
            transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT) || 587,
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });
        } catch (e) {
            console.error("[Email] Failed to create default transporter:", e);
            return { success: false, error: e };
        }
    }

    // 4. Send via Nodemailer (Custom or System Default)
    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            replyTo: replyToAddress,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject,
            html,
        });
        console.log(`[Email] Sent (SMTP): ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("[Email] Send Failed (SMTP):", error);
        return { success: false, error };
    }
}

