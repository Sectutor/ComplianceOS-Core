import { getDb } from '../../db';
import { eq } from 'drizzle-orm';
import { users, emailTemplates, emailTriggers } from '../../schema';
import { sendEmail } from './transporter';

interface EmailTemplate {
    subject: string;
    html: string;
}

export class EmailService {
    /**
     * Send a templated email to a user
     */
    static async sendToUser(userId: number, template: EmailTemplate, options: { clientId?: number } = {}) {
        const db = await getDb();
        if (!db) throw new Error("Database connection failed");

        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user || !user.email) {
            console.error(`[EmailService] User ${userId} not found or has no email`);
            return { success: false, error: 'User not found' };
        }

        return this.send({
            to: user.email,
            ...template,
            clientId: options.clientId
        });
    }

    /**
     * Send a direct email
     */
    static async send(options: {
        to: string | string[],
        subject: string,
        html: string,
        from?: string,
        clientId?: number
    }) {
        console.log(`[EmailService] Dispatching email to ${options.to}: "${options.subject}"`);

        try {
            const result = await sendEmail({
                to: options.to,
                subject: options.subject,
                html: options.html,
                from: options.from,
                clientId: options.clientId
            });

            if (result.success) {
                console.log(`[EmailService] Successfully sent email to ${options.to}`);
            } else {
                console.error(`[EmailService] Failed to send email to ${options.to}:`, result.error);
            }

            return result;
        } catch (error) {
            console.error(`[EmailService] Critical failure sending email to ${options.to}:`, error);
            return { success: false, error };
        }
    }

    /**
     * Example helper for common system notification
     */
    static async sendSystemNotification(to: string, subject: string, message: string) {
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                <h2 style="color: #1a1a1a;">System Notification</h2>
                <p style="font-size: 16px; line-height: 1.5; color: #444;">${message}</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #888; font-size: 12px;">This is an automated message from ComplianceOS.</p>
            </div>
        `;

        return this.send({ to, subject, html });
    }
    /**
     * Trigger an email event (resolved via email_triggers table)
     */
    static async triggerEvent(options: {
        event: string,
        to: string | string[],
        data: Record<string, any>,
        clientId?: number,
        from?: string
    }) {
        const db = await getDb();
        const [trigger] = await db.select({
            templateSlug: emailTemplates.slug
        })
            .from(emailTriggers)
            .leftJoin(emailTemplates, eq(emailTriggers.templateId, emailTemplates.id))
            .where(eq(emailTriggers.eventSlug, options.event))
            .limit(1);

        if (!trigger || !trigger.templateSlug) {
            console.warn(`[EmailService] No template assigned to trigger: ${options.event}. Falling back to slug search if possible.`);
            // Optional: fallback to using event slug as template slug
            return this.sendTemplatedEmail({
                slug: options.event.toLowerCase().replace(/_/g, '-'),
                to: options.to,
                data: options.data,
                clientId: options.clientId,
                from: options.from
            });
        }

        return this.sendTemplatedEmail({
            slug: trigger.templateSlug,
            to: options.to,
            data: options.data,
            clientId: options.clientId,
            from: options.from
        });
    }

    /**
     * Send an email using a database template
     */
    static async sendTemplatedEmail(options: {
        slug: string,
        to: string | string[],
        data: Record<string, any>,
        from?: string,
        clientId?: number
    }) {
        const db = await getDb();
        const [template] = await db.select()
            .from(emailTemplates)
            .where(eq(emailTemplates.slug, options.slug))
            .limit(1);

        if (!template) {
            console.error(`[EmailService] Template not found: ${options.slug}`);
            return { success: false, error: 'Template not found' };
        }

        const subject = this.interpolate(template.subject, options.data);
        const html = this.interpolate(template.content, options.data);

        return this.send({
            to: options.to,
            subject,
            html,
            from: options.from,
            clientId: options.clientId
        });
    }

    /**
     * Variable interpolation helper Replace {{var}} with data[var]
     */
    private static interpolate(text: string, data: Record<string, any>): string {
        return text.replace(/\{\{(.+?)\}\}/g, (match, key) => {
            const value = data[key.trim()];
            return value !== undefined ? String(value) : match;
        });
    }
}
