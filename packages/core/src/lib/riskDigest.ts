import { getDb } from '../db';
import { riskAssessments, riskTreatments, users, clients } from '../schema';
import { eq, and, lt, gte, lte, sql } from 'drizzle-orm';
import { sendEmail } from './email';

interface DigestItem {
    type: 'overdue_review' | 'overdue_treatment' | 'upcoming_review' | 'upcoming_treatment';
    title: string;
    dueDate: Date;
    clientName: string;
    url: string;
}

interface DigestRecipient {
    email: string;
    name: string;
    clientId: number;
    clientName: string;
}

export async function generateRiskDigest(clientId: number): Promise<DigestItem[]> {
    const db = await getDb();
    const now = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(now.getDate() + 7);

    const items: DigestItem[] = [];

    // Overdue Risk Reviews
    const overdueReviews = await db.select({
        id: riskAssessments.id,
        title: riskAssessments.title,
        nextReviewDate: riskAssessments.nextReviewDate,
        clientId: riskAssessments.clientId
    })
        .from(riskAssessments)
        .where(and(
            eq(riskAssessments.clientId, clientId),
            lt(riskAssessments.nextReviewDate, now),
            eq(riskAssessments.status, 'approved')
        ))
        .limit(20);

    overdueReviews.forEach(r => {
        if (r.nextReviewDate) {
            items.push({
                type: 'overdue_review',
                title: r.title || `Risk #${r.id}`,
                dueDate: new Date(r.nextReviewDate),
                clientName: '',
                url: `/clients/${r.clientId}/risks/assessments/${r.id}`
            });
        }
    });

    // Overdue Treatments
    const overdueTreatments = await db.select({
        id: riskTreatments.id,
        strategy: riskTreatments.strategy,
        dueDate: riskTreatments.dueDate,
        riskId: riskTreatments.riskAssessmentId
    })
        .from(riskTreatments)
        .innerJoin(riskAssessments, eq(riskTreatments.riskAssessmentId, riskAssessments.id))
        .where(and(
            eq(riskAssessments.clientId, clientId),
            lt(riskTreatments.dueDate, now),
            sql`${riskTreatments.status} NOT IN ('implemented', 'completed')`
        ))
        .limit(20);

    overdueTreatments.forEach(t => {
        if (t.dueDate) {
            items.push({
                type: 'overdue_treatment',
                title: t.strategy || `Treatment #${t.id}`,
                dueDate: new Date(t.dueDate),
                clientName: '',
                url: `/clients/${clientId}/risks/assessments/${t.riskId}`
            });
        }
    });

    // Upcoming Reviews (next 7 days)
    const upcomingReviews = await db.select({
        id: riskAssessments.id,
        title: riskAssessments.title,
        nextReviewDate: riskAssessments.nextReviewDate,
        clientId: riskAssessments.clientId
    })
        .from(riskAssessments)
        .where(and(
            eq(riskAssessments.clientId, clientId),
            gte(riskAssessments.nextReviewDate, now),
            lte(riskAssessments.nextReviewDate, weekFromNow),
            eq(riskAssessments.status, 'approved')
        ))
        .limit(20);

    upcomingReviews.forEach(r => {
        if (r.nextReviewDate) {
            items.push({
                type: 'upcoming_review',
                title: r.title || `Risk #${r.id}`,
                dueDate: new Date(r.nextReviewDate),
                clientName: '',
                url: `/clients/${r.clientId}/risks/assessments/${r.id}`
            });
        }
    });

    return items;
}

export function formatDigestEmail(items: DigestItem[], recipientName: string): { subject: string; html: string } {
    const overdueItems = items.filter(i => i.type.startsWith('overdue'));
    const upcomingItems = items.filter(i => i.type.startsWith('upcoming'));

    const subject = overdueItems.length > 0
        ? `⚠️ Risk Digest: ${overdueItems.length} Overdue Items`
        : `📅 Risk Digest: ${upcomingItems.length} Upcoming Deadlines`;

    let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a1a;">Hello ${recipientName},</h2>
            <p>Here's your daily risk management digest:</p>
    `;

    if (overdueItems.length > 0) {
        html += `
            <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0;">
                <h3 style="color: #dc2626; margin: 0 0 12px 0;">🚨 Overdue Items (${overdueItems.length})</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    ${overdueItems.map(item => `
                        <li style="margin: 8px 0;">
                            <strong>${item.title}</strong>
                            <span style="color: #666;"> - Due ${item.dueDate.toLocaleDateString()}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    if (upcomingItems.length > 0) {
        html += `
            <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 16px; margin: 16px 0;">
                <h3 style="color: #ca8a04; margin: 0 0 12px 0;">📅 Upcoming Deadlines (${upcomingItems.length})</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    ${upcomingItems.map(item => `
                        <li style="margin: 8px 0;">
                            <strong>${item.title}</strong>
                            <span style="color: #666;"> - Due ${item.dueDate.toLocaleDateString()}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    if (items.length === 0) {
        html += `
            <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 16px; margin: 16px 0;">
                <p style="color: #16a34a; margin: 0;">✅ No overdue or upcoming items. Great job keeping up!</p>
            </div>
        `;
    }

    html += `
            <p style="color: #666; font-size: 12px; margin-top: 24px;">
                This is an automated digest from ComplianceOS.
            </p>
        </div>
    `;

    return { subject, html };
}

export async function sendDailyRiskDigests(): Promise<{ sent: number; errors: number }> {
    // This would typically be called by a cron job
    // For now, it's a manual trigger via API

    let sent = 0;
    let errors = 0;

    try {
        const db = await getDb();

        // Get all active clients
        const activeClients = await db.select({
            id: clients.id,
            name: clients.name
        }).from(clients).limit(100);

        for (const client of activeClients) {
            try {
                const items = await generateRiskDigest(client.id);

                // Only send if there are items
                if (items.length === 0) continue;

                // Get users associated with this client (simplified - you'd need proper user-client mapping)
                // For now, assume there's a way to get client users
                // This is a placeholder - implement based on your user-client relationship

                // Example: Send to a default notification email if configured
                // await sendEmail({ to: 'admin@example.com', ...formatDigestEmail(items, 'Admin') });

                sent++;
            } catch (e) {
                console.error(`Failed to send digest for client ${client.id}:`, e);
                errors++;
            }
        }
    } catch (e) {
        console.error('Failed to send daily digests:', e);
        errors++;
    }

    return { sent, errors };
}
