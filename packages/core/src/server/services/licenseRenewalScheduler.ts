import { getDb } from "../../db";
import { sql, eq, and, gte, lte, isNull } from "drizzle-orm";
import { licenseActivations, licenseValidationLogs } from "../../schema/licenses";

// Email functions will be implemented separately
async function sendRenewalReminderEmail(license: any, reminderType: string): Promise<void> {
  console.log(`[RenewalReminder] Would send ${reminderType} reminder for license ${license.id} to ${license.contactEmail || 'unknown'}`);
  // In production, this would call the actual email service
}

async function sendAdminNotificationEmail(license: any, notificationType: string): Promise<void> {
  console.log(`[AdminNotification] Would send ${notificationType} notification for license ${license.id}`);
  // In production, this would call the actual email service
}

let renewalCheckInterval: NodeJS.Timeout | null = null;
let expiredLicenseCheckInterval: NodeJS.Timeout | null = null;

/**
 * Check for licenses expiring soon and send renewal reminders
 */
export async function checkExpiringLicenses() {
  try {
    const db = await getDb();
    const now = new Date();

    // Check for licenses expiring in 30 days
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringIn30Days = await db.select()
      .from(licenseActivations)
      .where(
        and(
          isNull(licenseActivations.deletedAt),
          gte(licenseActivations.expiresAt, now),
          lte(licenseActivations.expiresAt, thirtyDaysFromNow),
          eq(licenseActivations.licenseStatus, 'active')
        )
      )
      .orderBy(licenseActivations.expiresAt);

    // Check for licenses expiring in 7 days
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringIn7Days = await db.select()
      .from(licenseActivations)
      .where(
        and(
          isNull(licenseActivations.deletedAt),
          gte(licenseActivations.expiresAt, now),
          lte(licenseActivations.expiresAt, sevenDaysFromNow),
          eq(licenseActivations.licenseStatus, 'active')
        )
      )
      .orderBy(licenseActivations.expiresAt);

    // Check for licenses expiring in 1 day
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiringIn1Day = await db.select()
      .from(licenseActivations)
      .where(
        and(
          isNull(licenseActivations.deletedAt),
          gte(licenseActivations.expiresAt, now),
          lte(licenseActivations.expiresAt, oneDayFromNow),
          eq(licenseActivations.licenseStatus, 'active')
        )
      )
      .orderBy(licenseActivations.expiresAt);

    let remindersSent = 0;
    let errors = 0;

    // Helper function to check if reminder was sent
    const hasReminderBeenSent = async (licenseActivationId: number, reminderType: string): Promise<boolean> => {
      const [log] = await db.select()
        .from(licenseValidationLogs)
        .where(
          and(
            eq(licenseValidationLogs.licenseActivationId, licenseActivationId),
            eq(licenseValidationLogs.validationType, 'renewal_reminder'),
            sql`${licenseValidationLogs.validationResult}->>'reminderType' = ${reminderType}`
          )
        )
        .limit(1);
      return !!log;
    };

    // Helper function to record reminder sent
    const recordReminderSent = async (licenseActivationId: number, reminderType: string): Promise<void> => {
      await db.insert(licenseValidationLogs).values({
        licenseActivationId,
        validationType: 'renewal_reminder',
        isValid: true,
        validationResult: {
          reminderType,
          sentAt: new Date().toISOString()
        },
        createdAt: new Date()
      });
    };

    // Process 30-day reminders
    for (const license of expiringIn30Days) {
      try {
        // Check if we've already sent a 30-day reminder
        const has30DayReminder = await hasReminderBeenSent(license.id, '30_days');

        if (!has30DayReminder) {
          await sendRenewalReminderEmail(license, '30_days');
          await recordReminderSent(license.id, '30_days');
          remindersSent++;
        }
      } catch (error) {
        console.error(`[LicenseRenewal] Failed to send 30-day reminder for license ${license.id}:`, error);
        errors++;
      }
    }

    // Process 7-day reminders
    for (const license of expiringIn7Days) {
      try {
        // Check if we've already sent a 7-day reminder
        const has7DayReminder = await hasReminderBeenSent(license.id, '7_days');

        if (!has7DayReminder) {
          await sendRenewalReminderEmail(license, '7_days');
          await recordReminderSent(license.id, '7_days');
          remindersSent++;
        }
      } catch (error) {
        console.error(`[LicenseRenewal] Failed to send 7-day reminder for license ${license.id}:`, error);
        errors++;
      }
    }

    // Process 1-day reminders
    for (const license of expiringIn1Day) {
      try {
        // Check if we've already sent a 1-day reminder
        const has1DayReminder = await hasReminderBeenSent(license.id, '1_day');

        if (!has1DayReminder) {
          await sendRenewalReminderEmail(license, '1_day');
          await recordReminderSent(license.id, '1_day');
          remindersSent++;
        }
      } catch (error) {
        console.error(`[LicenseRenewal] Failed to send 1-day reminder for license ${license.id}:`, error);
        errors++;
      }
    }

    console.log(`[LicenseRenewal] Sent ${remindersSent} renewal reminders (${errors} errors)`);

    return {
      remindersSent,
      errors,
      expiringIn30Days: expiringIn30Days.length,
      expiringIn7Days: expiringIn7Days.length,
      expiringIn1Day: expiringIn1Day.length
    };
  } catch (error) {
    console.error("[LicenseRenewal] Failed to check expiring licenses:", error);
    throw error;
  }
}

/**
 * Check for expired licenses and notify admins
 */
export async function checkExpiredLicenses() {
  try {
    const db = await getDb();
    const now = new Date();

    // Get licenses that expired in the last 24 hours
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentlyExpired = await db.select()
      .from(licenseActivations)
      .where(
        and(
          isNull(licenseActivations.deletedAt),
          gte(licenseActivations.expiresAt, yesterday),
          lte(licenseActivations.expiresAt, now),
          eq(licenseActivations.licenseStatus, 'active')
        )
      )
      .orderBy(licenseActivations.expiresAt);

    let notificationsSent = 0;
    let errors = 0;

    // Helper function to check if expiration notification was sent
    const hasExpirationNotification = async (licenseActivationId: number): Promise<boolean> => {
      const [log] = await db.select()
        .from(licenseValidationLogs)
        .where(
          and(
            eq(licenseValidationLogs.licenseActivationId, licenseActivationId),
            eq(licenseValidationLogs.validationType, 'renewal_reminder'),
            sql`${licenseValidationLogs.validationResult}->>'reminderType' = 'expired'`
          )
        )
        .limit(1);
      return !!log;
    };

    // Helper function to record expiration notification sent
    const recordExpirationNotification = async (licenseActivationId: number): Promise<void> => {
      await db.insert(licenseValidationLogs).values({
        licenseActivationId,
        validationType: 'renewal_reminder',
        isValid: true,
        validationResult: {
          reminderType: 'expired',
          sentAt: new Date().toISOString()
        },
        createdAt: new Date()
      });
    };

    // Send notifications for recently expired licenses
    for (const license of recentlyExpired) {
      try {
        // Check if we've already sent an expiration notification
        const hasExpirationNotificationSent = await hasExpirationNotification(license.id);

        if (!hasExpirationNotificationSent) {
          await sendAdminNotificationEmail(license, 'expired');
          await recordExpirationNotification(license.id);
          notificationsSent++;
        }
      } catch (error) {
        console.error(`[LicenseRenewal] Failed to send expiration notification for license ${license.id}:`, error);
        errors++;
      }
    }

    console.log(`[LicenseRenewal] Sent ${notificationsSent} expiration notifications (${errors} errors)`);

    return {
      notificationsSent,
      errors,
      recentlyExpired: recentlyExpired.length
    };
  } catch (error) {
    console.error("[LicenseRenewal] Failed to check expired licenses:", error);
    throw error;
  }
}

/**
 * Run a single check for both expiring and expired licenses
 */
export async function runRenewalCheckOnce() {
  try {
    console.log("[LicenseRenewal] Starting renewal check...");
    const expiringResult = await checkExpiringLicenses();
    const expiredResult = await checkExpiredLicenses();

    console.log("[LicenseRenewal] Renewal check completed:", {
      expiringResult,
      expiredResult
    });

    return {
      expiringResult,
      expiredResult
    };
  } catch (error) {
    console.error("[LicenseRenewal] Renewal check failed:", error);
    throw error;
  }
}

/**
 * Start the license renewal scheduler
 */
export function start() {
  stop();

  // Run renewal checks daily at 9 AM
  renewalCheckInterval = setInterval(() => {
    runRenewalCheckOnce().catch(err => console.error('[LicenseRenewal] Background check failed:', err));
  }, 24 * 60 * 60 * 1000);

  // Run expired license checks hourly
  expiredLicenseCheckInterval = setInterval(() => {
    checkExpiredLicenses().catch(err => console.error('[LicenseRenewal] Background expired check failed:', err));
  }, 60 * 60 * 1000);

  // Run initial check immediately
  setTimeout(() => {
    runRenewalCheckOnce().catch(err => console.error('[LicenseRenewal] Initial background check failed:', err));
  }, 5000);

  console.log("[LicenseRenewal] Scheduler started");
}

/**
 * Stop the license renewal scheduler
 */
export function stop() {
  if (renewalCheckInterval) {
    clearInterval(renewalCheckInterval);
    renewalCheckInterval = null;
  }

  if (expiredLicenseCheckInterval) {
    clearInterval(expiredLicenseCheckInterval);
    expiredLicenseCheckInterval = null;
  }

  console.log("[LicenseRenewal] Scheduler stopped");
}

/**
 * Manually trigger a renewal check (for testing or admin UI)
 */
export async function triggerManualCheck() {
  return await runRenewalCheckOnce();
}