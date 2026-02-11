import * as db from "../db";
import * as schema from "../schema";
import { eq } from "drizzle-orm";

export interface InAppNotificationPayload {
    type: string;
    title: string;
    message: string;
    link?: string;
    relatedEntityType?: string;
    relatedEntityId?: number;
    metadata?: any;
}

/**
 * Creates in-app notifications for all users associated with a client.
 */
export async function createInAppNotification(clientId: number, payload: InAppNotificationPayload) {
    const dbConn = await db.getDb();

    // 1. Find all users for this client
    const clientUsers = await dbConn
        .select({ userId: schema.userClients.userId })
        .from(schema.userClients)
        .where(eq(schema.userClients.clientId, clientId));

    if (clientUsers.length === 0) {
        return { success: true, count: 0 };
    }

    // 2. Insert notification logs for each user
    const inserts = clientUsers.map((user) => ({
        userId: user.userId,
        type: payload.type,
        channel: "system",
        title: payload.title,
        message: payload.message,
        link: payload.link,
        relatedEntityType: payload.relatedEntityType,
        relatedEntityId: payload.relatedEntityId,
        metadata: payload.metadata,
        status: "sent",
        sentAt: new Date(),
    }));

    await dbConn.insert(schema.notificationLog).values(inserts);

    return { success: true, count: inserts.length };
}
