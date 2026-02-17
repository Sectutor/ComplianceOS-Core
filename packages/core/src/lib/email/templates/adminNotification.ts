/**
 * Admin notification email templates
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
 * Send admin notification email
 */
export async function sendAdminNotificationEmail(
  license: LicenseData,
  notificationType: 'expired' | 'about_to_expire' | 'renewal_completed'
): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = getSubject(notificationType, license);
    const html = getHtmlContent(notificationType, license);

    // Send to admin email (configured in environment)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@complianceos.com';
    
    return await EmailService.send({
      to: adminEmail,
      subject,
      html
    });
  } catch (error) {
    console.error(`[AdminNotification] Failed to send email for license ${license.id}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get email subject
 */
function getSubject(notificationType: string, license: LicenseData): string {
  const productName = getProductName(license.licenseType);
  
  switch (notificationType) {
    case 'expired':
      return `[ADMIN ALERT] License EXPIRED: ${productName} - ${license.clientName || 'Unknown Client'}`;
    case 'about_to_expire':
      return `[ADMIN NOTICE] License Expiring Soon: ${productName} - ${license.clientName || 'Unknown Client'}`;
    case 'renewal_completed':
      return `[ADMIN CONFIRMATION] License Renewed: ${productName} - ${license.clientName || 'Unknown Client'}`;
    default:
      return `[ADMIN] License Notification: ${productName}`;
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
function getHtmlContent(notificationType: string, license: LicenseData): string {
  const productName = getProductName(license.licenseType);
  const expirationDate = license.licenseExpiresAt 
    ? new Date(license.licenseExpiresAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'Unknown date';
  
  const adminUrl = `https://admin.complianceos.com/licenses/${license.id}`;
  const clientUrl = license.clientId ? `https://admin.complianceos.com/clients/${license.clientId}` : '#';
  
  let alertClass = '';
  let alertTitle = '';
  let alertMessage = '';
  let actionRequired = '';
  
  switch (notificationType) {
    case 'expired':
      alertClass = 'alert-critical';
      alertTitle = 'LICENSE EXPIRED';
      alertMessage = `The license for ${license.clientName || 'Unknown Client'} has expired. The client may have lost access to premium features.`;
      actionRequired = 'Please contact the client to discuss renewal options.';
      break;
    case 'about_to_expire':
      alertClass = 'alert-warning';
      alertTitle = 'LICENSE EXPIRING SOON';
      alertMessage = `The license for ${license.clientName || 'Unknown Client'} is expiring soon.`;
      actionRequired = 'Monitor renewal status and follow up if needed.';
      break;
    case 'renewal_completed':
      alertClass = 'alert-success';
      alertTitle = 'LICENSE RENEWED';
      alertMessage = `The license for ${license.clientName || 'Unknown Client'} has been successfully renewed.`;
      actionRequired = 'No action required.';
      break;
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin License Notification</title>
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
        .alert-banner {
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
            text-align: center;
            font-weight: bold;
            font-size: 18px;
        }
        .alert-critical {
            background-color: #fee;
            color: #c00;
            border: 3px solid #c00;
        }
        .alert-warning {
            background-color: #ffe;
            color: #e6a700;
            border: 3px solid #e6a700;
        }
        .alert-success {
            background-color: #efe;
            color: #0a0;
            border: 3px solid #0a0;
        }
        .content {
            padding: 20px 0;
        }
        .license-info {
            background-color: #f8f9fa;
            border: 1px solid #eaeaea;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .info-item {
            margin-bottom: 15px;
        }
        .info-label {
            font-weight: bold;
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .info-value {
            font-size: 16px;
            word-break: break-all;
        }
        .action-box {
            background-color: #f0f8ff;
            border: 2px solid #0077cc;
            border-radius: 5px;
            padding: 20px;
            margin: 30px 0;
        }
        .action-title {
            color: #0077cc;
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 18px;
        }
        .admin-links {
            display: flex;
            gap: 15px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        .admin-button {
            display: inline-block;
            background-color: #0077cc;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 5px;
            font-weight: bold;
            text-align: center;
            flex: 1;
            min-width: 200px;
        }
        .admin-button:hover {
            background-color: #005fa3;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eaeaea;
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            .info-grid {
                grid-template-columns: 1fr;
            }
            .admin-links {
                flex-direction: column;
            }
            .admin-button {
                min-width: 100%;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ComplianceOS Admin</h1>
            <p>License Management System</p>
        </div>
        
        <div class="alert-banner ${alertClass}">
            ${alertTitle}
        </div>
        
        <div class="content">
            <h2>License Notification</h2>
            
            <p>${alertMessage}</p>
            
            <div class="license-info">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">License ID:</div>
                        <div class="info-value">${license.id}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">License Key:</div>
                        <div class="info-value"><code>${license.licenseKey}</code></div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">License Type:</div>
                        <div class="info-value">${productName}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Expiration Date:</div>
                        <div class="info-value"><strong>${expirationDate}</strong></div>
                    </div>
                    ${license.clientId ? `
                    <div class="info-item">
                        <div class="info-label">Client ID:</div>
                        <div class="info-value">${license.clientId}</div>
                    </div>
                    ` : ''}
                    ${license.clientName ? `
                    <div class="info-item">
                        <div class="info-label">Client Name:</div>
                        <div class="info-value">${license.clientName}</div>
                    </div>
                    ` : ''}
                    ${license.contactEmail ? `
                    <div class="info-item">
                        <div class="info-label">Contact Email:</div>
                        <div class="info-value">${license.contactEmail}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="action-box">
                <div class="action-title">📋 Action Required:</div>
                <p>${actionRequired}</p>
            </div>
            
            <div class="admin-links">
                <a href="${adminUrl}" class="admin-button">View License Details</a>
                ${license.clientId ? `<a href="${clientUrl}" class="admin-button">View Client Profile</a>` : ''}
            </div>
            
            <p>This notification was automatically generated by the ComplianceOS license management system.</p>
            
            <p>Best regards,<br>
            ComplianceOS Admin System</p>
        </div>
        
        <div class="footer">
            <p>This is an automated admin notification. Please do not reply to this email.</p>
            <p>ComplianceOS Inc.<br>
            Admin Portal: <a href="https://admin.complianceos.com">https://admin.complianceos.com</a></p>
            <p>
                <a href="https://admin.complianceos.com/settings/notifications">Notification Settings</a> | 
                <a href="https://admin.complianceos.com/licenses">License Dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>
  `;
}