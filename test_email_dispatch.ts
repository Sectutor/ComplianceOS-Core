
import { EmailService } from "./packages/core/src/lib/email/service";
import dotenv from "dotenv";

dotenv.config();

async function testEmails() {
    const targetEmail = "emmanuel@intellfence.com";
    console.log(`Starting email dispatch test for ${targetEmail}...`);

    const tests = [
        { slug: "welcome-email", data: { userName: "Emmanuel", appUrl: "http://localhost:5173" } },
        { slug: "magic-link", data: { userName: "Emmanuel", magicLink: "http://localhost:5173/verify?token=abc" } },
        { slug: "assessment-invite", data: { clientName: "Intellfence Corp", assessmentUrl: "http://localhost:5173/assessment/123" } },
        { slug: "password-reset", data: { resetUrl: "http://localhost:5173/reset-password?token=xyz" } },
        { slug: "policy-acknowledgment", data: { userName: "Emmanuel", policyName: "Remote Work Policy", policyUrl: "http://localhost:5173/policies/1" } },
        { slug: "policy-review-reminder", data: { userName: "Emmanuel", policyName: "Data Retention Policy", policyUrl: "http://localhost:5173/policies/2" } },
        { slug: "personnel-onboarding", data: { userName: "Emmanuel", onboardingUrl: "http://localhost:5173/onboarding" } },
        { slug: "task-assignment", data: { userName: "Emmanuel", taskName: "Update Security Awareness Training", dueDate: "2024-12-31", taskUrl: "http://localhost:5173/tasks/456" } },
        { slug: "task-overdue", data: { userName: "Emmanuel", taskName: "Q4 Internal Audit", dueDate: "2024-01-15", taskUrl: "http://localhost:5173/tasks/789" } },
        { slug: "evidence-review", data: { userName: "Emmanuel", evidenceName: "AWS Configuration Audit Log", status: "Rejected", statusColor: "#dc2626", feedback: "Please provide the last 30 days of logs, not just current week.", evidenceUrl: "http://localhost:5173/evidence/v1" } },
        { slug: "assessment-completed", data: { vendorName: "CloudServices Inc", reviewUrl: "http://localhost:5173/tprm/vendor/5" } },
        { slug: "assessment-correction", data: { clientName: "Intellfence Corp", correctionNotes: "The SOC 2 report uploaded is from 2022, we need the 2023 version.", assessmentUrl: "http://localhost:5173/vendor-portal/77" } },
        { slug: "high-risk-alert", data: { riskName: "Unauthorized Database Access Attempt", impact: "Critical", likelihood: "Medium", riskUrl: "http://localhost:5173/risks/99" } },
        { slug: "treatment-plan-review", data: { userName: "Emmanuel", riskName: "Phishing vulnerability", riskUrl: "http://localhost:5173/risks/22" } },
        { slug: "new-device-login", data: { userName: "Emmanuel", location: "London, UK", time: new Date().toLocaleString(), browser: "Chrome on macOS" } },
        { slug: "mfa-status-changed", data: { userName: "Emmanuel", action: "Disabled" } }
    ];

    for (const test of tests) {
        console.log(`Sending ${test.slug}...`);
        try {
            const result = await EmailService.sendTemplatedEmail({
                slug: test.slug,
                to: targetEmail,
                data: test.data
            });
            if (result.success) {
                console.log(`✅ Sent ${test.slug}`);
            } else {
                console.error(`❌ Failed ${test.slug}:`, result.error);
            }
        } catch (e) {
            console.error(`💥 Error sending ${test.slug}:`, e);
        }
    }

    console.log("All tests completed.");
    process.exit(0);
}

testEmails().catch(err => {
    console.error(err);
    process.exit(1);
});
