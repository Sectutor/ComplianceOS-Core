
export interface MagicLinkEmailProps {
    inviteUrl: string;
    recipientEmail: string;
    inviterName?: string; // e.g. "Admin" or specific user
    planTier: string;
    role: string;
    expiresInDays: number;
}

export function generateMagicLinkEmail({
    inviteUrl,
    recipientEmail,
    inviterName = "The Admin Team",
    planTier,
    role,
    expiresInDays
}: MagicLinkEmailProps): { subject: string; html: string } {

    // Capitalize for display
    const planDisplay = planTier.charAt(0).toUpperCase() + planTier.slice(1);
    const roleDisplay = role.charAt(0).toUpperCase() + role.slice(1);

    const subject = `You've been invited to join ComplianceOS (${planDisplay} Access)`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to ComplianceOS</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f7; color: #1f2937;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #ffffff; border-bottom: 1px solid #f3f4f6;">
                            <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #111827;">ComplianceOS</h1>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 24px; font-size: 20px; font-weight: 600; color: #111827;">Hello!</h2>
                            <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
                                ${inviterName} has invited you to join <strong>ComplianceOS</strong>.
                            </p>
                            
                            <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                        <td style="padding-bottom: 12px;">
                                            <span style="font-size: 14px; color: #6b7280;">Access Level</span>
                                            <div style="font-size: 16px; font-weight: 600; color: #111827;">${planDisplay} Plan</div>
                                        </td>
                                        <td style="padding-bottom: 12px;">
                                            <span style="font-size: 14px; color: #6b7280;">Role</span>
                                            <div style="font-size: 16px; font-weight: 600; color: #111827;">${roleDisplay}</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
                                            <span style="font-size: 14px; color: #6b7280;">Expires In</span>
                                            <div style="font-size: 16px; font-weight: 600; color: #111827;">${expiresInDays} Days</div>
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <p style="margin: 0 0 32px; font-size: 16px; line-height: 24px; color: #4b5563;">
                                Click the button below to accept your invitation and set up your account.
                            </p>

                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${inviteUrl}" target="_blank" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background-color 0.2s;">
                                            Accept Invitation
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 32px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                                Or copy and paste this link into your browser:<br>
                                <a href="${inviteUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${inviteUrl}</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0; font-size: 13px; line-height: 20px; color: #9ca3af; text-align: center;">
                                © ${new Date().getFullYear()} ComplianceOS. All rights reserved.<br>
                                If you weren't expecting this invitation, you can ignore this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    return { subject, html };
}
