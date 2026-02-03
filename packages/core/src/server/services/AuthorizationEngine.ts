
import { getDb } from "../../db";
import { vendorAuthorizations, vendors, clients } from "../../schema";
import { eq, and } from "drizzle-orm";

export class AuthorizationEngine {

    static async initiateAuthorization(clientId: number, vendorId: number, userId: number, notes?: string) {
        const db = await getDb();
        // Check if already exists
        const existing = await db.query.vendorAuthorizations.findFirst({
            where: and(
                eq(vendorAuthorizations.clientId, clientId),
                eq(vendorAuthorizations.vendorId, vendorId)
            )
        });

        if (existing) {
            throw new Error("Authorization request already exists for this vendor.");
        }

        // 1. Create Record
        const [auth] = await db.insert(vendorAuthorizations).values({
            clientId,
            vendorId,
            initiatedBy: userId,
            status: "Pending",
            notes
        }).returning();

        // 2. Log Action
        // (In a real app, we'd add to an audit log table)

        return auth;
    }

    static async sendNotification(authId: number) {
        const db = await getDb();
        const auth = await db.query.vendorAuthorizations.findFirst({
            where: eq(vendorAuthorizations.id, authId),
            with: {
                vendor: true, // Assuming relation exists or we fetch separately
            }
        });

        if (!auth) throw new Error("Authorization not found");

        // Logic to send email to client (mocked for now)
        console.log(`[AuthorizationEngine] Sending notification for Vendor ${auth.vendorId}`);

        // Update Status
        const objectionDeadline = new Date();
        objectionDeadline.setDate(objectionDeadline.getDate() + 14); // 14 day objection window

        const [updated] = await db.update(vendorAuthorizations)
            .set({
                status: "Objection_Window",
                notificationDate: new Date(),
                objectionDeadline: objectionDeadline
            })
            .where(eq(vendorAuthorizations.id, authId))
            .returning();

        return updated;
    }

    static async approve(authId: number) {
        const db = await getDb();
        const [updated] = await db.update(vendorAuthorizations)
            .set({
                status: "Approved",
                approvalDate: new Date()
            })
            .where(eq(vendorAuthorizations.id, authId))
            .returning();

        return updated;
    }

    static async reject(authId: number, reason: string) {
        const db = await getDb();
        const [updated] = await db.update(vendorAuthorizations)
            .set({
                status: "Rejected",
                notes: reason // Append or overwrite notes
            })
            .where(eq(vendorAuthorizations.id, authId))
            .returning();

        return updated;
    }
}
