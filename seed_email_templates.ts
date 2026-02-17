
import { getDb } from "./packages/core/src/db";
import { emailTemplates, emailTriggers } from "./packages/core/src/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

async function seedEmailTemplates() {
  const db = await getDb();
  console.log("Seeding email templates...");

  const templates = [
    {
      slug: "welcome-email",
      name: "Welcome Email",
      subject: "Welcome to ComplianceOS, {{userName}}!",
      content: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome aboard, {{userName}}!</h2>
          <p>We're excited to have you on ComplianceOS. Your account has been successfully created.</p>
          <p>You can now access your dashboard and start managing your compliance posture.</p>
          <a href="{{appUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Go to Dashboard</a>
          <p>Best regards,<br/>The ComplianceOS Team</p>
        </div>
      `,
      description: "Sent to new users upon account creation."
    },
    {
      slug: "magic-link",
      name: "Magic Link Login",
      subject: "Your ComplianceOS Login Link",
      content: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello {{userName}},</h2>
          <p>Click the button below to sign in to your ComplianceOS account. This link will expire in 1 hour.</p>
          <a href="{{magicLink}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Log In Now</a>
          <p>If you didn't request this link, you can safely ignore this email.</p>
          <p>Best regards,<br/>The ComplianceOS Team</p>
        </div>
      `,
      description: "Sent when a user requests a magic link login."
    },
    {
      slug: "assessment-invite",
      name: "Vendor Assessment Invite",
      subject: "Action Required: Compliance Assessment for {{clientName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello,</h2>
            <p><strong>{{clientName}}</strong> has invited you to complete a compliance assessment on ComplianceOS.</p>
            <p>Please click the link below to access the assessment and provide the required information.</p>
            <a href="{{assessmentUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Start Assessment</a>
            <p>Thank you for your cooperation.</p>
            <p>Best regards,<br/>ComplianceOS Automations</p>
          </div>
        `,
      description: "Sent to vendors when they are invited to an assessment."
    },
    {
      slug: "password-reset",
      name: "Password Reset",
      subject: "Reset your ComplianceOS Password",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to choose a new one.</p>
            <a href="{{resetUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Reset Password</a>
            <p>If you did not request a password reset, please ignore this email.</p>
            <p>Best regards,<br/>The ComplianceOS Team</p>
          </div>
        `,
      description: "Sent when a user requests a password reset."
    },
    {
      slug: "policy-acknowledgment",
      name: "Policy Acknowledgment Request",
      subject: "Action Required: Please review and acknowledge {{policyName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Policy Review Required</h2>
            <p>Hello {{userName}},</p>
            <p>A new policy or an updated version of <strong>{{policyName}}</strong> has been published and requires your review and acknowledgment.</p>
            <p>Please click the link below to view the policy and complete the acknowledgment process.</p>
            <a href="{{policyUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Review Policy</a>
            <p>Thank you for helping us stay compliant.</p>
            <p>Best regards,<br/>Compliance Team</p>
          </div>
        `,
      description: "Sent to employees when they need to sign a policy."
    },
    {
      slug: "policy-review-reminder",
      name: "Policy Review Reminder",
      subject: "Reminder: Annual review for {{policyName}} is due",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Policy Review Due</h2>
            <p>Hello {{userName}},</p>
            <p>This is a reminder that the annual review for <strong>{{policyName}}</strong> is approaching or due.</p>
            <p>As the owner/reviewer, please ensure the policy is updated and reflected in the system.</p>
            <a href="{{policyUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Manage Policy</a>
            <p>Best regards,<br/>ComplianceOS Automations</p>
          </div>
        `,
      description: "Sent to policy owners for recurring reviews."
    },
    {
      slug: "personnel-onboarding",
      name: "Personnel Onboarding Checklist",
      subject: "Your Compliance Onboarding Checklist",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to the Team, {{userName}}!</h2>
            <p>To complete your security onboarding, please ensure you have completed the following items in ComplianceOS:</p>
            <ul style="line-height: 1.6;">
              <li>Read and Sign Security Policies</li>
              <li>Complete Security Awareness Training</li>
              <li>Upload required onboarding documentation</li>
            </ul>
            <a href="{{onboardingUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Complete Onboarding</a>
            <p>Welcome aboard!</p>
          </div>
        `,
      description: "Sent to new hires to guide them through compliance steps."
    },
    {
      slug: "task-assignment",
      name: "New Task Assignment",
      subject: "New Task Assigned: {{taskName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Task Assigned</h2>
            <p>Hello {{userName}},</p>
            <p>You have been assigned a new compliance task: <strong>{{taskName}}</strong></p>
            <p><strong>Due Date:</strong> {{dueDate}}</p>
            <p>Please click below to view the task details and submit your updates.</p>
            <a href="{{taskUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">View Task</a>
            <p>Best regards,<br/>ComplianceOS</p>
          </div>
        `,
      description: "Sent when a user is assigned a manual task or evidence request."
    },
    {
      slug: "task-overdue",
      name: "Overdue Task Escalation",
      subject: "URGENT: Task {{taskName}} is Overdue",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fee2e2; padding: 20px; border-radius: 8px;">
            <h2 style="color: #dc2626;">Action Required: Overdue Task</h2>
            <p>Hello {{userName}},</p>
            <p>The following task is now past its deadline and may impact our audit readiness:</p>
            <p><strong>Task:</strong> {{taskName}}<br/><strong>Missed Deadline:</strong> {{dueDate}}</p>
            <p>Please complete this task immediately to resolve the block.</p>
            <a href="{{taskUrl}}" style="background: #dc2626; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Resolve Task Now</a>
            <p>Best regards,<br/>System Administrator</p>
          </div>
        `,
      description: "Sent for overdue tasks."
    },
    {
      slug: "evidence-review",
      name: "Evidence Status Update",
      subject: "Evidence Review: {{evidenceName}} has been {{status}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Evidence Review Update</h2>
            <p>Hello {{userName}},</p>
            <p>Your submission for <strong>{{evidenceName}}</strong> has been reviewed.</p>
            <p><strong>Status:</strong> <span style="font-weight: bold; color: {{statusColor}};">{{status}}</span></p>
            {{#if feedback}}
            <p><strong>Feedback:</strong> {{feedback}}</p>
            {{/if}}
            <a href="{{evidenceUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">View Details</a>
            <p>Best regards,<br/>Audit Team</p>
          </div>
        `,
      description: "Sent when evidence is approved or rejected."
    },
    {
      slug: "assessment-completed",
      name: "Assessment Completion Notification",
      subject: "Vendor Assessment Completed: {{vendorName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Assessment Submitted</h2>
            <p>Hello,</p>
            <p><strong>{{vendorName}}</strong> has completed the compliance assessment you requested.</p>
            <p>You can now review their responses and evidence in the TPRM dashboard.</p>
            <a href="{{reviewUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Review Responses</a>
            <p>Best regards,<br/>ComplianceOS TPMR</p>
          </div>
        `,
      description: "Sent to internal team when a vendor finishes an assessment."
    },
    {
      slug: "assessment-correction",
      name: "Assessment Information Required",
      subject: "Correction Required for {{clientName}} Assessment",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Additional Information Required</h2>
            <p>Hello,</p>
            <p>We've reviewed your assessment for <strong>{{clientName}}</strong> and found that some items need further clarification or different evidence.</p>
            <p><strong>Internal Feedback:</strong> {{correctionNotes}}</p>
            <p>Please click below to update your submission.</p>
            <a href="{{assessmentUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Edit Submission</a>
            <p>Best regards,<br/>{{clientName}} via ComplianceOS</p>
          </div>
        `,
      description: "Sent to vendors when their assessment needs correction."
    },
    {
      slug: "high-risk-alert",
      name: "High-Risk Identified Alert",
      subject: "ALERT: High Risk Identified - {{riskName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #dc2626; padding: 20px; border-radius: 8px;">
            <h2 style="color: #dc2626;">High Risk Alert</h2>
            <p>A new high-impact risk has been identified in the Risk Register:</p>
            <p><strong>Risk:</strong> {{riskName}}<br/><strong>Impact:</strong> {{impact}}<br/><strong>Likelihood:</strong> {{likelihood}}</p>
            <p>Please review the details and ensure a treatment plan is in place.</p>
            <a href="{{riskUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">View Risk Details</a>
          </div>
        `,
      description: "Sent to risk owners for high-severity risks."
    },
    {
      slug: "treatment-plan-review",
      name: "Treatment Plan Review Reminder",
      subject: "Periodic Review: Risk Treatment Plan for {{riskName}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Treatment Plan Review</h2>
            <p>Hello {{userName}},</p>
            <p>This is a scheduled reminder to review and update the treatment plan for <strong>{{riskName}}</strong>.</p>
            <p>Please ensure that mitigation steps are progressing as planned.</p>
            <a href="{{riskUrl}}" style="background: #1C4D8D; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">Update Plan</a>
            <p>Best regards,<br/>Risk Management</p>
          </div>
        `,
      description: "Sent periodically for open risk treatments."
    },
    {
      slug: "new-device-login",
      name: "Security Alert: New Device Login",
      subject: "Security Alert: New Login from unrecognized device",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Login Detected</h2>
            <p>Hello {{userName}},</p>
            <p>Your ComplianceOS account was just logged into from a new device or browser.</p>
            <p><strong>Location:</strong> {{location}}<br/><strong>Time:</strong> {{time}}<br/><strong>Browser:</strong> {{browser}}</p>
            <p>If this was you, you can safely ignore this. If not, please change your password immediately.</p>
            <p>Best regards,<br/>ComplianceOS Security</p>
          </div>
        `,
      description: "Security notification for new logins."
    },
    {
      slug: "mfa-status-changed",
      name: "MFA Status Notification",
      subject: "Action Confirmation: Multi-Factor Authentication {{action}}",
      content: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>MFA Status Update</h2>
            <p>Hello {{userName}},</p>
            <p>This email confirms that Multi-Factor Authentication has been <strong>{{action}}</strong> for your account.</p>
            <p>If you did not authorize this change, please contact your administrator immediately.</p>
            <p>Best regards,<br/>ComplianceOS Security</p>
          </div>
        `,
      description: "Sent when MFA is enabled/disabled."
    }
  ];

  // Mapping Event Slugs to Template Slugs
  const triggerMapping: Record<string, string> = {
    "USER_WELCOME": "welcome-email",
    "LOGIN_MAGIC_LINK": "magic-link",
    "VENDOR_ASSESSMENT_INVITE": "assessment-invite",
    "PASSWORD_RESET": "password-reset",
    "POLICY_ACKNOWLEDGMENT": "policy-acknowledgment",
    "POLICY_REVIEW": "policy-review-reminder",
    "PERSONNEL_ONBOARDING": "personnel-onboarding",
    "TASK_ASSIGNED": "task-assignment",
    "TASK_OVERDUE": "task-overdue",
    "EVIDENCE_REVIEWED": "evidence-review",
    "ASSESSMENT_SUBMITTED": "assessment-completed",
    "ASSESSMENT_CORRECTION": "assessment-correction",
    "RISK_HIGH_ALERT": "high-risk-alert",
    "RISK_TREATMENT_REVIEW": "treatment-plan-review",
    "SECURITY_NEW_DEVICE": "new-device-login",
    "SECURITY_MFA_CHANGED": "mfa-status-changed"
  };

  for (const template of templates) {
    const existing = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, template.slug)).limit(1);
    if (existing.length === 0) {
      console.log(`Inserting template: ${template.slug}`);
      await db.insert(emailTemplates).values(template);
    } else {
      console.log(`Template already exists: ${template.slug}`);
    }
  }

  // Seed Triggers
  console.log("Seeding triggers...");
  for (const [eventSlug, templateSlug] of Object.entries(triggerMapping)) {
    console.log(`Processing trigger: ${eventSlug} -> ${templateSlug}`);
    try {
      const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, templateSlug)).limit(1);
      if (!template) {
        console.warn(`⚠️ Template not found for trigger: ${templateSlug}`);
        continue;
      }

      const existingTrigger = await db.select().from(emailTriggers).where(eq(emailTriggers.eventSlug, eventSlug)).limit(1);
      if (existingTrigger.length === 0) {
        console.log(`Setting up trigger: ${eventSlug} -> ${templateSlug}`);
        await db.insert(emailTriggers).values({
          eventSlug,
          templateId: template.id,
          description: `Triggered when ${eventSlug.toLowerCase().replace(/_/g, ' ')} occurs.`
        });
      } else {
        console.log(`Trigger already exists: ${eventSlug}`);
      }
    } catch (err) {
      console.error(`❌ Error processing trigger ${eventSlug}:`, err);
      throw err;
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedEmailTemplates().catch(err => {
  console.error(err);
  process.exit(1);
});
