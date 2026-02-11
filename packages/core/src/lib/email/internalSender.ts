
import { getDb } from "../../db";
import { emailMessages, users, userClients } from "../../schema";
import { eq, and } from "drizzle-orm";
import { EmailService } from "./service";

interface SystemEmailParams {
    clientId: number;
    subject: string;
    body: string; // HTML content
    snippet?: string;
    toUserId?: number; // Optional: Specific user, otherwise finds owner/admin
}

export async function sendInternalSystemEmail({
    clientId,
    subject,
    body,
    snippet,
    toUserId
}: SystemEmailParams): Promise<boolean> {
    const db = await getDb();
    if (!db) return false;

    let targetUserId = toUserId;

    // If no specific user, find the Owner or Admin of the client
    if (!targetUserId) {
        const membership = await db.select()
            .from(userClients)
            .where(and(
                eq(userClients.clientId, clientId),
                eq(userClients.role, 'owner')
            ))
            .limit(1);

        if (membership.length > 0) {
            targetUserId = membership[0].userId;
        } else {
            // Fallback to finding ANY admin
            const adminMembership = await db.select()
                .from(userClients)
                .where(and(
                    eq(userClients.clientId, clientId),
                    eq(userClients.role, 'admin')
                ))
                .limit(1);

            if (adminMembership.length > 0) {
                targetUserId = adminMembership[0].userId;
            }
        }
    }

    if (!targetUserId) {
        console.warn(`[SystemEmail] Could not find a target user for Client ${clientId}. Email dropped.`);
        return false;
    }

    // Get recipient email for the "To" field display
    const user = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    const toEmail = user[0]?.email || 'user@company.com';

    // Insert into Inbox
    try {
        await db.insert(emailMessages).values({
            clientId,
            userId: targetUserId,
            folder: 'inbox',
            status: 'sent', // It's "sent" from the system's perspective
            subject,
            body,
            snippet: snippet || body.substring(0, 100),
            from: 'system@compliance-os.com',
            to: [toEmail],
            isRead: false,
            isStarred: false,
            sentAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log(`[SystemEmail] Delivered "${subject}" to User ${targetUserId} (Client ${clientId})`);

        // Trigger real email dispatch
        try {
            await EmailService.send({
                to: toEmail,
                subject: `[Internal] ${subject}`,
                html: body,
                clientId
            });
        } catch (e) {
            console.error("[SystemEmail] External dispatch failed:", e);
        }

        return true;
    } catch (error) {
        console.error("[SystemEmail] Failed to insert email:", error);
        return false;
    }
}
