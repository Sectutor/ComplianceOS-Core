import { getDb } from "../../db";
import { and, gte, lte, or, isNull, sql, eq } from "drizzle-orm";
import { clientPolicies, users, employees } from "../../schema";
import { EmailService } from "../../lib/email/service";
import { notifyUsers } from "../../lib/notificationService";

let policyReviewCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check for policies with upcoming review dates and notify owners
 */
export async function checkUpcomingPolicyReviews() {
    try {
        const db = await getDb();
        const now = new Date();

        // Check for reviews due in the next 7 days
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const upcomingReviews = await db.select()
            .from(clientPolicies)
            .where(
                and(
                    gte(clientPolicies.reviewDueDate, now),
                    lte(clientPolicies.reviewDueDate, sevenDaysFromNow),
                    or(
                        isNull(clientPolicies.lastReviewAlertSentAt),
                        sql`${clientPolicies.lastReviewAlertSentAt} < ${new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)}`
                    )
                )
            );

        console.log(`[PolicyReviewScheduler] Found ${upcomingReviews.length} upcoming reviews to alert`);

        for (const policy of upcomingReviews) {
            try {
                if (!policy.owner || policy.owner === 'unassigned') continue;

                let targetUserEmail = "";
                let targetUserId: number | null = null;

                // Try to identify owner by email first
                if (policy.owner.includes('@')) {
                    targetUserEmail = policy.owner;
                } else {
                    // Try to find employee by name
                    const [emp] = await db.select()
                        .from(employees)
                        .where(sql`CONCAT(${employees.firstName}, ' ', ${employees.lastName}) = ${policy.owner}`)
                        .limit(1);

                    if (emp && emp.email) {
                        targetUserEmail = emp.email;
                    }
                }

                if (targetUserEmail) {
                    const [user] = await db.select()
                        .from(users)
                        .where(eq(users.email, targetUserEmail))
                        .limit(1);

                    if (user) {
                        targetUserId = user.id;
                    }
                }

                if (targetUserId || targetUserEmail) {
                    const daysLeft = Math.ceil((policy.reviewDueDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const message = `The policy "${policy.name}" is scheduled for review on ${policy.reviewDueDate!.toLocaleDateString()} (${daysLeft} days remaining).`;

                    // 1. In-app notification
                    if (targetUserId) {
                        await notifyUsers([targetUserId], {
                            type: "policy_review_reminder",
                            title: "Upcoming Policy Review",
                            message: message,
                            link: `/clients/${policy.clientId}/policies/${policy.id}`,
                            relatedEntityType: "policy",
                            relatedEntityId: policy.id
                        });
                    }

                    // 2. Email notification
                    if (targetUserEmail) {
                        await EmailService.send({
                            to: targetUserEmail,
                            subject: `Reminder: Policy Review for ${policy.name}`,
                            html: `
                <div style="font-family: sans-serif; color: #374151;">
                  <h2>Policy Review Reminder</h2>
                  <p>Hello,</p>
                  <p>This is a reminder that the following policy is due for review soon:</p>
                  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Policy:</strong> ${policy.name}</p>
                    <p><strong>Review Due Date:</strong> ${policy.reviewDueDate!.toLocaleDateString()}</p>
                    <p><strong>Days Remaining:</strong> ${daysLeft}</p>
                  </div>
                  <p>Please log in to the ComplianceOS dashboard to review the policy content and update its status.</p>
                  <a href="${process.env.VITE_APP_URL || 'https://app.grcompliance.com'}/clients/${policy.clientId}/policies/${policy.id}" 
                     style="display: inline-block; background-color: #1c4d8d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                    View Policy
                  </a>
                </div>
              `,
                            clientId: policy.clientId
                        });
                    }

                    // Update last alert sent date
                    await db.update(clientPolicies)
                        .set({ lastReviewAlertSentAt: new Date() })
                        .where(eq(clientPolicies.id, policy.id));
                }

            } catch (err) {
                console.error(`[PolicyReviewScheduler] Failed to process alert for policy ${policy.id}:`, err);
            }
        }

    } catch (err) {
        console.error("[PolicyReviewScheduler] Error checking upcoming reviews:", err);
    }
}

export function start() {
    stop();
    // Run check every 24 hours
    policyReviewCheckInterval = setInterval(checkUpcomingPolicyReviews, 24 * 60 * 60 * 1000);

    // Run initial check after 30 seconds to allow DB to stabilize
    setTimeout(checkUpcomingPolicyReviews, 30000);

    console.log("[PolicyReviewScheduler] Started");
}

export function stop() {
    if (policyReviewCheckInterval) {
        clearInterval(policyReviewCheckInterval);
        policyReviewCheckInterval = null;
    }
    console.log("[PolicyReviewScheduler] Stopped");
}
