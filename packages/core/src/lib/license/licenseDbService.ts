/**
 * License Database Service
 * 
 * Service layer for all license-related database operations
 */

import { getDb } from '../../db';
import { 
  licenseActivations, 
  licenseValidationLogs, 
  licenseFeatureUsage, 
  gumroadWebhookEvents,
  licenseConfigurations,
  type LicenseActivation,
  type InsertLicenseActivation,
  type LicenseValidationLog,
  type InsertLicenseValidationLog,
  type LicenseFeatureUsage,
  type InsertLicenseFeatureUsage,
  type GumroadWebhookEvent,
  type InsertGumroadWebhookEvent,
  type LicenseConfiguration,
  type InsertLicenseConfiguration
} from '../../schema/licenses';
import { eq, and, desc, sql, gte, lte, isNull, isNotNull, count, sum, avg, between } from 'drizzle-orm';

export class LicenseDbService {
  /**
   * License Activation Operations
   */
  
  /**
   * Create a new license activation
   */
  async createLicenseActivation(data: InsertLicenseActivation): Promise<LicenseActivation> {
    const db = await getDb();
    const [activation] = await db.insert(licenseActivations).values(data).returning();
    return activation;
  }
  
  /**
   * Get license activation by ID
   */
  async getLicenseActivationById(id: number): Promise<LicenseActivation | null> {
    const db = await getDb();
    const [activation] = await db.select().from(licenseActivations).where(eq(licenseActivations.id, id));
    return activation || null;
  }
  
  /**
   * Get license activation by license key
   */
  async getLicenseActivationByKey(licenseKey: string): Promise<LicenseActivation | null> {
    const db = await getDb();
    const [activation] = await db.select().from(licenseActivations).where(eq(licenseActivations.licenseKey, licenseKey));
    return activation || null;
  }
  
  /**
   * Get active license activation for a client
   */
  async getActiveLicenseForClient(clientId: number): Promise<LicenseActivation | null> {
    const db = await getDb();
    const [activation] = await db.select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.clientId, clientId),
          eq(licenseActivations.licenseStatus, 'active'),
          isNull(licenseActivations.deletedAt)
        )
      )
      .orderBy(desc(licenseActivations.activatedAt))
      .limit(1);
    
    return activation || null;
  }
  
  /**
   * Get all license activations for a client
   */
  async getLicenseActivationsForClient(clientId: number, options?: {
    limit?: number;
    offset?: number;
    includeDeleted?: boolean;
  }): Promise<LicenseActivation[]> {
    const db = await getDb();
    let query = db.select().from(licenseActivations).where(eq(licenseActivations.clientId, clientId));
    
    if (!options?.includeDeleted) {
      query = query.where(isNull(licenseActivations.deletedAt));
    }
    
    query = query.orderBy(desc(licenseActivations.activatedAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * Update license activation
   */
  async updateLicenseActivation(id: number, data: Partial<InsertLicenseActivation>): Promise<LicenseActivation | null> {
    const db = await getDb();
    const [activation] = await db.update(licenseActivations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(licenseActivations.id, id))
      .returning();
    
    return activation || null;
  }
  
  /**
   * Deactivate a license (soft delete)
   */
  async deactivateLicense(id: number): Promise<LicenseActivation | null> {
    const db = await getDb();
    const [activation] = await db.update(licenseActivations)
      .set({
        licenseStatus: 'expired',
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(licenseActivations.id, id))
      .returning();
    
    return activation || null;
  }
  
  /**
   * Check if license key is already active
   */
  async isLicenseKeyActive(licenseKey: string): Promise<boolean> {
    const db = await getDb();
    const [activation] = await db.select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.licenseKey, licenseKey),
          eq(licenseActivations.licenseStatus, 'active'),
          isNull(licenseActivations.deletedAt)
        )
      )
      .limit(1);
    
    return !!activation;
  }
  
  /**
   * Get expiring licenses (within X days)
   */
  async getExpiringLicenses(days: number = 30): Promise<LicenseActivation[]> {
    const db = await getDb();
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + days);
    
    return db.select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.licenseStatus, 'active'),
          isNull(licenseActivations.deletedAt),
          isNotNull(licenseActivations.expiresAt),
          lte(licenseActivations.expiresAt, expirationDate),
          gte(licenseActivations.expiresAt, new Date())
        )
      )
      .orderBy(licenseActivations.expiresAt);
  }
  
  /**
   * Get expired licenses
   */
  async getExpiredLicenses(): Promise<LicenseActivation[]> {
    const db = await getDb();
    return db.select()
      .from(licenseActivations)
      .where(
        and(
          eq(licenseActivations.licenseStatus, 'active'),
          isNull(licenseActivations.deletedAt),
          isNotNull(licenseActivations.expiresAt),
          lte(licenseActivations.expiresAt, new Date())
        )
      )
      .orderBy(desc(licenseActivations.expiresAt));
  }
  
  /**
   * License Validation Log Operations
   */
  
  /**
   * Create validation log entry
   */
  async createValidationLog(data: InsertLicenseValidationLog): Promise<LicenseValidationLog> {
    const db = await getDb();
    const [log] = await db.insert(licenseValidationLogs).values(data).returning();
    return log;
  }
  
  /**
   * Get validation logs for a license
   */
  async getValidationLogsForLicense(licenseActivationId: number, options?: {
    limit?: number;
    offset?: number;
  }): Promise<LicenseValidationLog[]> {
    const db = await getDb();
    let query = db.select()
      .from(licenseValidationLogs)
      .where(eq(licenseValidationLogs.licenseActivationId, licenseActivationId))
      .orderBy(desc(licenseValidationLogs.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * Get validation logs for a client
   */
  async getValidationLogsForClient(clientId: number, options?: {
    limit?: number;
    offset?: number;
    days?: number;
  }): Promise<LicenseValidationLog[]> {
    const db = await getDb();
    let query = db.select()
      .from(licenseValidationLogs)
      .where(eq(licenseValidationLogs.clientId, clientId));
    
    if (options?.days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - options.days);
      query = query.where(gte(licenseValidationLogs.createdAt, startDate));
    }
    
    query = query.orderBy(desc(licenseValidationLogs.createdAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * Get validation statistics
   */
  async getValidationStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
    clientId?: number;
  }): Promise<{
    total: number;
    valid: number;
    invalid: number;
    cacheHitRate: number;
    avgDuration: number;
  }> {
    const db = await getDb();
    
    let query = db.select({
      total: count(),
      valid: sql<number>`COUNT(*) FILTER (WHERE ${licenseValidationLogs.isValid} = true)`,
      invalid: sql<number>`COUNT(*) FILTER (WHERE ${licenseValidationLogs.isValid} = false)`,
      cacheHits: sql<number>`COUNT(*) FILTER (WHERE ${licenseValidationLogs.cacheHit} = true)`,
      avgDuration: sql<number>`COALESCE(AVG(${licenseValidationLogs.validationDurationMs}), 0)`,
    }).from(licenseValidationLogs);
    
    const conditions = [];
    
    if (options?.startDate) {
      conditions.push(gte(licenseValidationLogs.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(licenseValidationLogs.createdAt, options.endDate));
    }
    
    if (options?.clientId) {
      conditions.push(eq(licenseValidationLogs.clientId, options.clientId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const [stats] = await query;
    
    return {
      total: Number(stats.total) || 0,
      valid: Number(stats.valid) || 0,
      invalid: Number(stats.invalid) || 0,
      cacheHitRate: stats.total > 0 ? (Number(stats.cacheHits) / Number(stats.total)) * 100 : 0,
      avgDuration: Number(stats.avgDuration) || 0,
    };
  }
  
  /**
   * License Feature Usage Operations
   */
  
  /**
   * Track feature usage
   */
  async trackFeatureUsage(data: InsertLicenseFeatureUsage): Promise<LicenseFeatureUsage> {
    const db = await getDb();
    
    // Check if usage already exists for this combination
    const existing = await db.select()
      .from(licenseFeatureUsage)
      .where(
        and(
          eq(licenseFeatureUsage.licenseActivationId, data.licenseActivationId),
          eq(licenseFeatureUsage.featureId, data.featureId),
          data.resourceId ? eq(licenseFeatureUsage.resourceId, data.resourceId) : isNull(licenseFeatureUsage.resourceId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing usage
      const [usage] = await db.update(licenseFeatureUsage)
        .set({
          usageCount: sql`${licenseFeatureUsage.usageCount} + 1`,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
          usageContext: data.usageContext || existing[0].usageContext,
        })
        .where(eq(licenseFeatureUsage.id, existing[0].id))
        .returning();
      
      return usage;
    } else {
      // Create new usage record
      const [usage] = await db.insert(licenseFeatureUsage).values(data).returning();
      return usage;
    }
  }
  
  /**
   * Get feature usage for a license
   */
  async getFeatureUsageForLicense(licenseActivationId: number, options?: {
    limit?: number;
    offset?: number;
    featureId?: string;
  }): Promise<LicenseFeatureUsage[]> {
    const db = await getDb();
    let query = db.select()
      .from(licenseFeatureUsage)
      .where(eq(licenseFeatureUsage.licenseActivationId, licenseActivationId));
    
    if (options?.featureId) {
      query = query.where(eq(licenseFeatureUsage.featureId, options.featureId));
    }
    
    query = query.orderBy(desc(licenseFeatureUsage.lastUsedAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStatistics(options?: {
    startDate?: Date;
    endDate?: Date;
    licenseActivationId?: number;
    clientId?: number;
  }): Promise<{
    totalUsage: number;
    uniqueFeatures: number;
    topFeatures: Array<{ featureId: string; featureName: string; usageCount: number }>;
    usageByDay: Array<{ date: string; usageCount: number }>;
  }> {
    const db = await getDb();
    
    const conditions = [];
    
    if (options?.startDate) {
      conditions.push(gte(licenseFeatureUsage.lastUsedAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(licenseFeatureUsage.lastUsedAt, options.endDate));
    }
    
    if (options?.licenseActivationId) {
      conditions.push(eq(licenseFeatureUsage.licenseActivationId, options.licenseActivationId));
    }
    
    if (options?.clientId) {
      conditions.push(eq(licenseFeatureUsage.clientId, options.clientId));
    }
    
    // Get total usage count
    const totalQuery = db.select({
      totalUsage: sql<number>`COALESCE(SUM(${licenseFeatureUsage.usageCount}), 0)`,
      uniqueFeatures: sql<number>`COUNT(DISTINCT ${licenseFeatureUsage.featureId})`,
    }).from(licenseFeatureUsage);
    
    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }
    
    const [totalStats] = await totalQuery;
    
    // Get top features
    const topFeaturesQuery = db.select({
      featureId: licenseFeatureUsage.featureId,
      featureName: licenseFeatureUsage.featureName,
      usageCount: sql<number>`SUM(${licenseFeatureUsage.usageCount})`,
    })
    .from(licenseFeatureUsage)
    .groupBy(licenseFeatureUsage.featureId, licenseFeatureUsage.featureName)
    .orderBy(desc(sql<number>`SUM(${licenseFeatureUsage.usageCount})`))
    .limit(10);
    
    if (conditions.length > 0) {
      topFeaturesQuery.where(and(...conditions));
    }
    
    const topFeatures = await topFeaturesQuery;
    
    // Get usage by day (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const usageByDayQuery = db.select({
      date: sql<string>`DATE(${licenseFeatureUsage.lastUsedAt})`,
      usageCount: sql<number>`SUM(${licenseFeatureUsage.usageCount})`,
    })
    .from(licenseFeatureUsage)
    .where(
      and(
        gte(licenseFeatureUsage.lastUsedAt, thirtyDaysAgo),
        ...conditions
      )
    )
    .groupBy(sql`DATE(${licenseFeatureUsage.lastUsedAt})`)
    .orderBy(sql`DATE(${licenseFeatureUsage.lastUsedAt})`);
    
    const usageByDay = await usageByDayQuery;
    
    return {
      totalUsage: Number(totalStats.totalUsage) || 0,
      uniqueFeatures: Number(totalStats.uniqueFeatures) || 0,
      topFeatures: topFeatures.map(f => ({
        featureId: f.featureId,
        featureName: f.featureName || f.featureId,
        usageCount: Number(f.usageCount) || 0,
      })),
      usageByDay: usageByDay.map(d => ({
        date: d.date,
        usageCount: Number(d.usageCount) || 0,
      })),
    };
  }
  
  /**
   * Gumroad Webhook Operations
   */
  
  /**
   * Create webhook event
   */
  async createWebhookEvent(data: InsertGumroadWebhookEvent): Promise<GumroadWebhookEvent> {
    const db = await getDb();
    const [event] = await db.insert(gumroadWebhookEvents).values(data).returning();
    return event;
  }
  
  /**
   * Update webhook event processing status
   */
  async updateWebhookEventStatus(eventId: string, status: string, error?: string): Promise<GumroadWebhookEvent | null> {
    const db = await getDb();
    const [event] = await db.update(gumroadWebhookEvents)
      .set({
        processingStatus: status,
        processedAt: status === 'processed' || status === 'failed' ? new Date() : undefined,
        processingError: error,
        processingAttempts: sql`${gumroadWebhookEvents.processingAttempts} + 1`,
      })
      .where(eq(gumroadWebhookEvents.eventId, eventId))
      .returning();
    
    return event || null;
  }
  
  /**
   * Get pending webhook events
   */
  async getPendingWebhookEvents(limit: number = 10): Promise<GumroadWebhookEvent[]> {
    const db = await getDb();
    return db.select()
      .from(gumroadWebhookEvents)
      .where(eq(gumroadWebhookEvents.processingStatus, 'pending'))
      .orderBy(gumroadWebhookEvents.receivedAt)
      .limit(limit);
  }
  
  /**
   * Get webhook events by license key
   */
  async getWebhookEventsByLicenseKey(licenseKey: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<GumroadWebhookEvent[]> {
    const db = await getDb();
    let query = db.select()
      .from(gumroadWebhookEvents)
      .where(eq(gumroadWebhookEvents.licenseKey, licenseKey))
      .orderBy(desc(gumroadWebhookEvents.receivedAt));
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    
    if (options?.offset) {
      query = query.offset(options.offset);
    }
    
    return query;
  }
  
  /**
   * License Configuration Operations
   */
  
  /**
   * Get license configuration
   */
  async getLicenseConfiguration(configType: string, configKey: string, options?: {
    buildType?: string;
    licenseType?: string;
  }): Promise<LicenseConfiguration | null> {
    const db = await getDb();
    
    const conditions = [
      eq(licenseConfigurations.configType, configType),
      eq(licenseConfigurations.configKey, configKey),
    ];
    
    if (options?.buildType) {
      conditions.push(eq(licenseConfigurations.buildType, options.buildType));
    }
    
    if (options?.licenseType) {
      conditions.push(eq(licenseConfigurations.licenseType, options.licenseType));
    }
    
    const [config] = await db.select()
      .from(licenseConfigurations)
      .where(and(...conditions))
      .orderBy(desc(licenseConfigurations.priority))
      .limit(1);
    
    return config || null;
  }
  
  /**
   * Get all configurations for a build/type
   */
  async getLicenseConfigurations(options?: {
    buildType?: string;
    licenseType?: string;
    configType?: string;
  }): Promise<LicenseConfiguration[]> {
    const db = await getDb();
    
    const conditions = [];
    
    if (options?.buildType) {
      conditions.push(eq(licenseConfigurations.buildType, options.buildType));
    }
    
    if (options?.licenseType) {
      conditions.push(eq(licenseConfigurations.licenseType, options.licenseType));
    }
    
    if (options?.configType) {
      conditions.push(eq(licenseConfigurations.configType, options.configType));
    }
    
    let query = db.select().from(licenseConfigurations);
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return query.orderBy(licenseConfigurations.priority);
  }
  
  /**
   * Set license configuration
   */
  async setLicenseConfiguration(data: InsertLicenseConfiguration): Promise<LicenseConfiguration> {
    const db = await getDb();
    
    // Check if configuration already exists
    const existing = await db.select()
      .from(licenseConfigurations)
      .where(
        and(
          eq(licenseConfigurations.configType, data.configType),
          eq(licenseConfigurations.configKey, data.configKey),
          data.buildType ? eq(licenseConfigurations.buildType, data.buildType) : isNull(licenseConfigurations.buildType),
          data.licenseType ? eq(licenseConfigurations.licenseType, data.licenseType) : isNull(licenseConfigurations.licenseType)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing
      const [config] = await db.update(licenseConfigurations)
        .set({
          configValue: data.configValue,
          description: data.description,
          isEnabled: data.isEnabled,
          priority: data.priority,
          validFrom: data.validFrom,
          validUntil: data.validUntil,
          updatedAt: new Date(),
        })
        .where(eq(licenseConfigurations.id, existing[0].id))
        .returning();
      
      return config;
    } else {
      // Create new
      const [config] = await db.insert(licenseConfigurations).values(data).returning();
      return config;
    }
  }
  
  /**
   * Analytics and Reporting
   */
  
  /**
   * Get license analytics dashboard data
   */
  async getLicenseAnalytics(options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalLicenses: number;
    activeLicenses: number;
    expiringLicenses: number;
    expiredLicenses: number;
    licenseTypes: Array<{ type: string; count: number }>;
    revenueByType: Array<{ type: string; revenue: number }>;
    activationTrend: Array<{ date: string; count: number }>;
  }> {
    const db = await getDb();
    
    const conditions = [isNull(licenseActivations.deletedAt)];
    
    if (options?.startDate) {
      conditions.push(gte(licenseActivations.createdAt, options.startDate));
    }
    
    if (options?.endDate) {
      conditions.push(lte(licenseActivations.createdAt, options.endDate));
    }
    
    // Get total and active licenses
    const licenseStats = await db.select({
      total: count(),
      active: sql<number>`COUNT(*) FILTER (WHERE ${licenseActivations.licenseStatus} = 'active')`,
      expiring: sql<number>`COUNT(*) FILTER (WHERE ${licenseActivations.licenseStatus} = 'active' AND ${licenseActivations.expiresAt} IS NOT NULL AND ${licenseActivations.expiresAt} > NOW() AND ${licenseActivations.expiresAt} <= NOW() + INTERVAL '30 days')`,
      expired: sql<number>`COUNT(*) FILTER (WHERE ${licenseActivations.licenseStatus} = 'active' AND ${licenseActivations.expiresAt} IS NOT NULL AND ${licenseActivations.expiresAt} <= NOW())`,
    })
    .from(licenseActivations)
    .where(and(...conditions));
    
    // Get license types distribution
    const licenseTypes = await db.select({
      type: licenseActivations.licenseType,
      count: count(),
    })
    .from(licenseActivations)
    .where(and(...conditions))
    .groupBy(licenseActivations.licenseType);
    
    // Get activation trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activationTrend = await db.select({
      date: sql<string>`DATE(${licenseActivations.createdAt})`,
      count: count(),
    })
    .from(licenseActivations)
    .where(
      and(
        gte(licenseActivations.createdAt, thirtyDaysAgo),
        ...conditions
      )
    )
    .groupBy(sql`DATE(${licenseActivations.createdAt})`)
    .orderBy(sql`DATE(${licenseActivations.createdAt})`);
    
    // Estimate revenue by type (this would come from actual payment data in production)
    const revenueByType = licenseTypes.map(lt => {
      let revenue = 0;
      switch (lt.type) {
        case 'enterprise':
          revenue = Number(lt.count) * 99; // $99/month
          break;
        case 'trial':
          revenue = 0; // Trials are free
          break;
        case 'community':
          revenue = 0; // Community is free
          break;
        default:
          revenue = Number(lt.count) * 49; // Default $49/month
      }
      return {
        type: lt.type,
        revenue,
      };
    });
    
    return {
      totalLicenses: Number(licenseStats[0]?.total) || 0,
      activeLicenses: Number(licenseStats[0]?.active) || 0,
      expiringLicenses: Number(licenseStats[0]?.expiring) || 0,
      expiredLicenses: Number(licenseStats[0]?.expired) || 0,
      licenseTypes: licenseTypes.map(lt => ({
        type: lt.type || 'unknown',
        count: Number(lt.count) || 0,
      })),
      revenueByType,
      activationTrend: activationTrend.map(at => ({
        date: at.date,
        count: Number(at.count) || 0,
      })),
    };
  }
}

// Export singleton instance
export const licenseDbService = new LicenseDbService();