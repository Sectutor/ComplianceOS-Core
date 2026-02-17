/**
 * License Management Schema for ComplianceOS
 * 
 * This schema handles license activations, validations, and feature tracking
 * for the dual-licensing model (AGPLv3 Community + Commercial Enterprise)
 */

import { pgTable, integer, varchar, text, timestamp, boolean, json, serial, index, uniqueIndex } from "drizzle-orm/pg-core";

// License types enum
export const licenseTypeEnum = pgTable("license_type_enum", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'community', 'trial', 'enterprise'
  description: text("description"),
});

// License status enum
export const licenseStatusEnum = pgTable("license_status_enum", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // 'active', 'expired', 'suspended', 'revoked'
  description: text("description"),
});

/**
 * License Activations Table
 * 
 * Tracks license activations for clients/users
 */
export const licenseActivations = pgTable("license_activations", {
  id: serial("id").primaryKey(),
  
  // License information
  licenseKey: varchar("license_key", { length: 255 }).notNull(),
  licenseType: varchar("license_type", { length: 50 }).notNull().default('community'), // 'community', 'trial', 'enterprise'
  licenseStatus: varchar("license_status", { length: 50 }).notNull().default('active'), // 'active', 'expired', 'suspended', 'revoked'
  
  // Product information
  productId: varchar("product_id", { length: 100 }), // Gumroad product ID
  productPermalink: varchar("product_permalink", { length: 255 }), // Gumroad product permalink
  productName: varchar("product_name", { length: 255 }), // Product name
  
  // Customer information
  customerEmail: varchar("customer_email", { length: 255 }),
  customerName: varchar("customer_name", { length: 255 }),
  
  // Activation context
  clientId: integer("client_id"), // Which client this license is activated for
  userId: integer("user_id"), // Which user activated the license
  activationIp: varchar("activation_ip", { length: 45 }), // IP address at activation
  
  // License limits
  maxUsers: integer("max_users").default(10),
  maxClients: integer("max_clients").default(5),
  maxFeatures: integer("max_features").default(0), // 0 = unlimited
  
  // Validity period
  issuedAt: timestamp("issued_at").defaultNow(),
  activatedAt: timestamp("activated_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  renewedAt: timestamp("renewed_at"),
  
  // Subscription information (for recurring licenses)
  subscriptionId: varchar("subscription_id", { length: 255 }),
  isRecurring: boolean("is_recurring").default(false),
  recurrencePeriod: varchar("recurrence_period", { length: 50 }), // 'monthly', 'yearly'
  
  // Features enabled for this license
  enabledFeatures: json("enabled_features").$type<string[]>().default([]),
  
  // Metadata
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  
  // Gumroad-specific data
  gumroadPurchaseId: varchar("gumroad_purchase_id", { length: 255 }),
  gumroadSaleId: varchar("gumroad_sale_id", { length: 255 }),
  gumroadValidationData: json("gumroad_validation_data").$type<Record<string, any>>(),
  
  // Audit fields
  lastValidatedAt: timestamp("last_validated_at"),
  validationCount: integer("validation_count").default(0),
  lastValidationResult: json("last_validation_result").$type<Record<string, any>>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
}, (table) => {
  return {
    // Indexes for common queries
    licenseKeyIdx: index("idx_license_activations_key").on(table.licenseKey),
    clientIdIdx: index("idx_license_activations_client").on(table.clientId),
    userIdIdx: index("idx_license_activations_user").on(table.userId),
    productIdIdx: index("idx_license_activations_product").on(table.productId),
    statusIdx: index("idx_license_activations_status").on(table.licenseStatus),
    expiresAtIdx: index("idx_license_activations_expires").on(table.expiresAt),
    
    // Unique constraint: one active license per client
    uniqueClientLicense: uniqueIndex("uniq_license_activations_client").on(
      table.clientId,
      table.licenseStatus
    ).where(table.licenseStatus === 'active'),
  };
});

export type LicenseActivation = typeof licenseActivations.$inferSelect;
export type InsertLicenseActivation = typeof licenseActivations.$inferInsert;

/**
 * License Validation Logs
 * 
 * Logs every license validation attempt for audit and analytics
 */
export const licenseValidationLogs = pgTable("license_validation_logs", {
  id: serial("id").primaryKey(),
  
  // License reference
  licenseActivationId: integer("license_activation_id"),
  licenseKey: varchar("license_key", { length: 255 }),
  
  // Validation context
  clientId: integer("client_id"),
  userId: integer("user_id"),
  requestIp: varchar("request_ip", { length: 45 }),
  userAgent: text("user_agent"),
  
  // Validation request
  requestedFeatures: json("requested_features").$type<string[]>(),
  validationType: varchar("validation_type", { length: 50 }), // 'startup', 'feature_check', 'periodic', 'admin'
  
  // Validation result
  isValid: boolean("is_valid").notNull(),
  validationResult: json("validation_result").$type<Record<string, any>>(),
  errorMessage: text("error_message"),
  missingFeatures: json("missing_features").$type<string[]>(),
  
  // Performance metrics
  validationDurationMs: integer("validation_duration_ms"),
  cacheHit: boolean("cache_hit").default(false),
  
  // External validation (if applicable)
  externalValidation: boolean("external_validation").default(false),
  externalService: varchar("external_service", { length: 50 }), // 'gumroad', 'stripe', 'custom'
  externalResponse: json("external_response").$type<Record<string, any>>(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    licenseKeyIdx: index("idx_license_logs_key").on(table.licenseKey),
    clientIdIdx: index("idx_license_logs_client").on(table.clientId),
    isValidIdx: index("idx_license_logs_valid").on(table.isValid),
    createdAtIdx: index("idx_license_logs_created").on(table.createdAt),
  };
});

export type LicenseValidationLog = typeof licenseValidationLogs.$inferSelect;
export type InsertLicenseValidationLog = typeof licenseValidationLogs.$inferInsert;

/**
 * License Feature Usage Tracking
 * 
 * Tracks which features are being used by which clients/users
 */
export const licenseFeatureUsage = pgTable("license_feature_usage", {
  id: serial("id").primaryKey(),
  
  // References
  licenseActivationId: integer("license_activation_id").notNull(),
  clientId: integer("client_id").notNull(),
  userId: integer("user_id"),
  
  // Feature information
  featureId: varchar("feature_id", { length: 100 }).notNull(),
  featureName: varchar("feature_name", { length: 255 }),
  featureCategory: varchar("feature_category", { length: 100 }),
  
  // Usage metrics
  usageCount: integer("usage_count").default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
  firstUsedAt: timestamp("first_used_at").defaultNow(),
  
  // Context
  usageContext: json("usage_context").$type<Record<string, any>>(),
  resourceId: varchar("resource_id", { length: 255 }), // Specific resource being accessed
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    // Indexes for analytics
    licenseFeatureIdx: index("idx_license_feature_license_feature").on(
      table.licenseActivationId,
      table.featureId
    ),
    clientFeatureIdx: index("idx_license_feature_client_feature").on(
      table.clientId,
      table.featureId
    ),
    usageDateIdx: index("idx_license_feature_usage_date").on(table.lastUsedAt),
    
    // Unique constraint: track unique feature usage per license
    uniqueFeatureUsage: uniqueIndex("uniq_license_feature_usage").on(
      table.licenseActivationId,
      table.featureId,
      table.resourceId
    ),
  };
});

export type LicenseFeatureUsage = typeof licenseFeatureUsage.$inferSelect;
export type InsertLicenseFeatureUsage = typeof licenseFeatureUsage.$inferInsert;

/**
 * Gumroad Webhook Events
 * 
 * Stores webhook events from Gumroad for audit and processing
 */
export const gumroadWebhookEvents = pgTable("gumroad_webhook_events", {
  id: serial("id").primaryKey(),
  
  // Webhook metadata
  eventId: varchar("event_id", { length: 255 }).notNull().unique(),
  eventType: varchar("event_type", { length: 100 }).notNull(), // 'license_validation', 'subscription_cancelled', 'refund', etc.
  resourceName: varchar("resource_name", { length: 100 }), // 'license', 'sale', 'subscription'
  
  // Gumroad data
  gumroadTimestamp: varchar("gumroad_timestamp", { length: 50 }),
  gumroadSignature: varchar("gumroad_signature", { length: 255 }),
  
  // Event payload
  rawPayload: json("raw_payload").$type<Record<string, any>>().notNull(),
  processedPayload: json("processed_payload").$type<Record<string, any>>(),
  
  // Processing status
  processingStatus: varchar("processing_status", { length: 50 }).default('pending'), // 'pending', 'processing', 'processed', 'failed'
  processingAttempts: integer("processing_attempts").default(0),
  processingError: text("processing_error"),
  processedAt: timestamp("processed_at"),
  
  // Related entities (extracted from payload)
  licenseKey: varchar("license_key", { length: 255 }),
  productId: varchar("product_id", { length: 100 }),
  purchaseId: varchar("purchase_id", { length: 255 }),
  subscriptionId: varchar("subscription_id", { length: 255 }),
  
  // Timestamps
  receivedAt: timestamp("received_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    eventTypeIdx: index("idx_gumroad_events_type").on(table.eventType),
    licenseKeyIdx: index("idx_gumroad_events_license").on(table.licenseKey),
    processingStatusIdx: index("idx_gumroad_events_status").on(table.processingStatus),
    receivedAtIdx: index("idx_gumroad_events_received").on(table.receivedAt),
  };
});

export type GumroadWebhookEvent = typeof gumroadWebhookEvents.$inferSelect;
export type InsertGumroadWebhookEvent = typeof gumroadWebhookEvents.$inferInsert;

/**
 * License Configuration
 * 
 * System-wide license configuration and feature definitions
 */
export const licenseConfigurations = pgTable("license_configurations", {
  id: serial("id").primaryKey(),
  
  // Configuration scope
  configType: varchar("config_type", { length: 50 }).notNull(), // 'system', 'build', 'feature', 'limit'
  configKey: varchar("config_key", { length: 100 }).notNull(),
  configValue: json("config_value").$type<any>(),
  
  // Context
  buildType: varchar("build_type", { length: 50 }), // 'AGPLv3', 'COMMERCIAL', 'TRIAL'
  licenseType: varchar("license_type", { length: 50 }), // 'community', 'trial', 'enterprise'
  featureId: varchar("feature_id", { length: 100 }),
  
  // Metadata
  description: text("description"),
  isEnabled: boolean("is_enabled").default(true),
  priority: integer("priority").default(0),
  
  // Validity
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    configKeyIdx: index("idx_license_config_key").on(table.configKey),
    buildTypeIdx: index("idx_license_config_build").on(table.buildType),
    licenseTypeIdx: index("idx_license_config_license").on(table.licenseType),
    uniqueConfig: uniqueIndex("uniq_license_config").on(
      table.configType,
      table.configKey,
      table.buildType,
      table.licenseType
    ),
  };
});

export type LicenseConfiguration = typeof licenseConfigurations.$inferSelect;
export type InsertLicenseConfiguration = typeof licenseConfigurations.$inferInsert;