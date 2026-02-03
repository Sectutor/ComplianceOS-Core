
import nodemailer from 'nodemailer';
import { getDb } from '../../db';
import { clientIntegrations } from '../../schema';
import { eq, and } from 'drizzle-orm';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    clientId?: number; // Context to find specific SMTP settings
}

/**
 * Send an email using either Client-Specific SMTP or System Default
 */
export async function sendEmail({ to, subject, html, from, clientId }: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: any }> {
    let transporter = null;
    let fromAddress = from || process.env.SMTP_FROM || 'system@compliance-os.com';

    // 1. Try to load Client Integrations
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
                        secure: Number(settings.port) === 465, // true for 465, false for other ports
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
                    // Fallback to system default will happen below if transporter is null
                }
            }
        }
    }

    // 2. Fallback to System Default (from .env)
    if (!transporter) {
        if (!process.env.SMTP_HOST) {
            console.warn("[Email] No SMTP_HOST defined. Email simulated.");
            // Simulation Mode
            console.log(`[SIMULATION] To: ${to}, Subject: ${subject}`);
            return { success: true, messageId: 'simulated-123' };
        }

        console.log(`[Email] Using System Default SMTP`);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // 3. Send
    try {
        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });
        console.log(`[Email] Sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("[Email] Send Failed:", error);
        return { success: false, error };
    }
}
