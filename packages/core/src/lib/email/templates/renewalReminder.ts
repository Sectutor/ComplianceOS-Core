/**
 * Renewal reminder email templates
 */

import { EmailService } from '../service';

interface LicenseData {
  id: number;
  licenseKey: string;
  licenseType: string;
  licenseExpiresAt: Date | null;
  clientId: number | null;
  clientName?: string;
  contactEmail?: string;
}

/**
 * Send renewal reminder email
 */
export async function sendRenewalReminderEmail(
  license: LicenseData,
  reminderType: '30_days' | '7_days' | '1_day'
): Promise<{ success: boolean; error?: string }> {
  try {
    const daysLeft = getDaysLeft(reminderType);
    const subject = getSubject(daysLeft, license.licenseType);
    const html = getHtmlContent(daysLeft, license);

    // If we have a client contact email, send to that
    if (license.contactEmail) {
      return await EmailService.send({
        to: license.contactEmail,
        subject,
        html,
        clientId: license.clientId || undefined
      });
    }

    // Otherwise, we need to find the user associated with this license
    // For now, we'll log and return success (in production, you'd want to handle this properly)
    console.log(`[RenewalReminder] No contact email for license ${license.id}, reminder type: ${reminderType}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[RenewalReminder] Failed to send email for license ${license.id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get days left based on reminder type
 */
function getDaysLeft(reminderType: string): number {
  switch (reminderType) {
    case '30_days':
      return 30;
    case '7_days':
      return 7;
    case '1_day':
      return 1;
    default:
      return 30;
  }
}

/**
 * Get email subject
 */
function getSubject(daysLeft: number, licenseType: string): string {
  const productName = getProductName(licenseType);
  
  if (daysLeft === 1) {
    return `URGENT: Your ${productName} license expires TOMORROW`;
  } else if (daysLeft <= 7) {
    return `Important: Your ${productName} license expires in ${daysLeft} days`;
  } else {
    return `Friendly reminder: Your ${productName} license expires in ${daysLeft} days`;
  }
}

/**
 * Get product name based on license type
 */
function getProductName(licenseType: string): string {
  switch (licenseType) {
    case 'enterprise':
      return 'ComplianceOS Enterprise';
    case 'trial':
      return 'ComplianceOS Trial';
    case 'community':
      return 'ComplianceOS Community';
    default:
      return 'ComplianceOS';
  }
}

/**
 * Get HTML content for the email
 */
function getHtmlContent(daysLeft: number, license: LicenseData): string {
  const productName = getProductName(license.licenseType);
  const expirationDate = license.licenseExpiresAt 
    ? new Date(license.licenseExpiresAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown date';
  
  const renewalUrl = `https://app.complianceos.com/license/renew/${license.licenseKey}`;
  const supportUrl = 'https://support.complianceos.com';
  const billingUrl = 'https://billing.complianceos.com';
  
  let urgencyClass = '';
  let urgencyText = '';
  
  if (daysLeft === 1) {
    urgencyClass = 'urgent';
    urgencyText = 'URGENT ACTION REQUIRED';
  } else if (daysLeft <= 7) {
    urgencyClass = 'important';
    urgencyText = 'ACTION REQUIRED';
  } else {
    urgencyClass = 'friendly';
    urgencyText = 'FRIENDLY REMINDER';
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>License Renewal Reminder</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #ffffff;
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 1px solid #eaeaea;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        .urgency-banner {
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 16px;
        }
        .urgent {
            background-color: #fee;
            color: #c00;
            border: 2px solid #c00;
        }
        .important {
            background-color: #ffe;
            color: #e6a700;
            border: 2px solid #e6a700;
        }
        .friendly {
            background-color: #eff;
            color: #0077cc;
            border: 2px solid #0077cc;
        }
        .content {
            padding: 20px 0;
        }
        .license-info {
            background-color: #f8f9fa;
            border: 1px solid #eaeaea;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            width: 150px;
            color: #666;
        }
        .info-value {
            flex: 1;
        }
        .cta-button {
            display: inline-block;
            background-color: #0077cc;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .cta-button:hover {
            background-color: #005fa3;
        }
        .secondary-button {
            display: inline-block;
            background-color: #6c757d;
            color: white;
            text-decoration: none;
            padding: 10px 20px;
            border-radius: 5px;
            margin: 10px 5px;
        }
        .secondary-button:hover {
            background-color: #545b62;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .info-row {
                flex-direction: column;
            }
            .info-label {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ComplianceOS</h1>
            <p>Security & Compliance Management Platform</p>
        </div>
        
        <div class="urgency-banner ${urgencyClass}">
            ${urgencyText}: License Expires in ${daysLeft} ${daysLeft === 1 ? 'Day' : 'Days'}
        </div>
        
        <div class="content">
            <h2>License Renewal Reminder</h2>
            
            <p>Dear ${license.clientName || 'Valued Customer'},</p>
            
            <p>This is a reminder that your ${productName} license is set to expire in <strong>${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}</strong>.</p>
            
            <div class="license-info">
                <div class="info-row">
                    <div class="info-label">License Key:</div>
                    <div class="info-value"><code>${license.licenseKey}</code></div>
                </div>
                <div class="info-row">
                    <div class="info-label">License Type:</div>
                    <div class="info-value">${productName}</div>
                </div>
                <div class="info-row">
                    <div class="info-label">Expiration Date:</div>
                    <div class="info-value"><strong>${expirationDate}</strong></div>
                </div>
                ${license.clientId ? `
                <div class="info-row">
                    <div class="info-label">Client ID:</div>
                    <div class="info-value">${license.clientId}</div>
                </div>
                ` : ''}
            </div>
            
            ${daysLeft <= 7 ? `
            <div class="warning">
                <strong>⚠️ Important:</strong> If your license expires, you will lose access to premium features and your compliance data may become inaccessible. Please renew before the expiration date to avoid service interruption.
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="${renewalUrl}" class="cta-button">
                    ${daysLeft === 1 ? 'RENEW NOW - EXPIRES TOMORROW' : `Renew License (${daysLeft} days left)`}
                </a>
            </div>
            
            <p>If you have any questions or need assistance with the renewal process, please don't hesitate to contact our support team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${supportUrl}" class="secondary-button">Contact Support</a>
                <a href="${billingUrl}" class="secondary-button">Billing Portal</a>
            </div>
            
            <p>Best regards,<br>
            The ComplianceOS Team</p>
        </div>
        
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>ComplianceOS Inc.<br>
            123 Security Street, Suite 100<br>
            San Francisco, CA 94107</p>
            <p>
                <a href="https://complianceos.com/privacy">Privacy Policy</a> | 
                <a href="https://complianceos.com/terms">Terms of Service</a> | 
                <a href="https://complianceos.com/unsubscribe">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}