
import { getDb } from "../../db";
import { vendorAuthorizations, vendors, clients, users, userClients } from "../../schema";
import { eq, and } from "drizzle-orm";
import { EmailService } from "../../lib/email/service";

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

        // Send Real Notification to Client Admins
        const [client] = await db.select().from(clients).where(eq(clients.id, auth.clientId)).limit(1);
        const [vendor] = await db.select().from(vendors).where(eq(vendors.id, auth.vendorId)).limit(1);

        // Find owner/admin email
        const memberships = await db.select()
            .from(userClients)
            .innerJoin(users, eq(userClients.userId, users.id))
            .where(and(
                eq(userClients.clientId, auth.clientId),
                eq(userClients.role, 'owner')
            ))
            .limit(1);

        const recipientEmail = memberships[0]?.users.email;

        if (recipientEmail) {
            await EmailService.send({
                to: recipientEmail,
                subject: `New Subprocessor Notification: ${vendor?.name}`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
                        <h2 style="color: #1a1a1a;">Subprocessor Change Notification</h2>
                        <p>This is a formal notification that <strong>${client?.name}</strong> intends to authorize <strong>${vendor?.name}</strong> as a new subprocessor.</p>
                        
                        <div style="background-color: #f9f9f9; padding: 16px; border-radius: 4px; margin: 20px 0;">
                            <strong>Vendor:</strong> ${vendor?.name}<br/>
                            <strong>Description:</strong> ${vendor?.description || 'N/A'}
                        </div>

                        <p>Under our Data Processing Agreement, you have 14 days to raise any reasonable objections to this change.</p>
                        <p><strong>Objection Deadline:</strong> ${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                        
                        <div style="margin: 24px 0;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/clients/${auth.clientId}/vendors/${auth.vendorId}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Vendor Details</a>
                        </div>
                    </div>
                `,
                clientId: auth.clientId
            });
        }

        console.log(`[AuthorizationEngine] Notification dispatched for Vendor ${auth.vendorId}`);

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
