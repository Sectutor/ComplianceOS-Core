import { pgTable, serial, integer, varchar, text, timestamp, jsonb, uniqueIndex, boolean, pgEnum } from 'drizzle-orm/pg-core';

// Framework status enum
export const maturityFrameworkStatusEnum = pgEnum("maturity_framework_status", ["draft", "active", "archived"]);

// 1. Framework Definition
export const maturityFrameworks = pgTable("maturity_frameworks", {
    id: varchar("id", { length: 50 }).primaryKey(), // e.g., "nist-csf-2", "cisa-ztmm-2", "cmmc-2"
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    version: varchar("version", { length: 20 }),
    logo: varchar("logo", { length: 255 }),
    levels: jsonb("levels").$type<{ level: number, name: string, description: string }[]>().notNull(),
    status: maturityFrameworkStatusEnum("status").default("active"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

// 2. Categories (Functions in NIST, Pillars in Zero Trust, Domains in CMMC)
export const maturityCategories = pgTable("maturity_categories", {
    id: serial("id").primaryKey(),
    frameworkId: varchar("framework_id", { length: 50 }).notNull(),
    parentId: integer("parent_id"), // For hierarchical categories (e.g. NIST Function > NIST Category)
    code: varchar("code", { length: 20 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }),
    order: integer("order").default(0),
});

// 3. Requirements / Controls
export const maturityRequirements = pgTable("maturity_requirements", {
    id: serial("id").primaryKey(),
    frameworkId: varchar("framework_id", { length: 50 }).notNull(),
    categoryId: integer("category_id").notNull(),
    code: varchar("code", { length: 50 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    level: integer("level").notNull(), // The level at which this requirement is assigned
    order: integer("order").default(0),
    benefits: text("benefits"),
    activities: jsonb("activities").$type<string[]>().default([]),
});

// 4. Client Assessments
export const maturityAssessments = pgTable("maturity_assessments", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull(),
    frameworkId: varchar("framework_id", { length: 50 }).notNull(),
    requirementId: integer("requirement_id").notNull(),

    // Assessment data
    isAchieved: boolean("is_achieved").default(false),
    notes: text("notes"),
    evidence: jsonb("evidence").$type<string[]>().default([]),

    // Target management
    isTarget: boolean("is_target").default(false),

    assessedBy: integer("assessed_by"),
    assessmentDate: timestamp("assessment_date"),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        clientFrameworkRequirementIdx: uniqueIndex("idx_maturity_client_framework_req")
            .on(table.clientId, table.frameworkId, table.requirementId),
    };
});

// 5. Overall Client Framework State (for summary/scoring caching)
export const maturityClientFrameworks = pgTable("maturity_client_frameworks", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull(),
    frameworkId: varchar("framework_id", { length: 50 }).notNull(),
    overallScore: integer("overall_score").default(0),
    targetScore: integer("target_score").default(0),
    status: varchar("status", { length: 20 }).default("not_started"), // not_started, in_progress, completed
    lastAssessedAt: timestamp("last_assessed_at"),
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        clientFrameworkIdx: uniqueIndex("idx_maturity_client_framework")
            .on(table.clientId, table.frameworkId),
    };
});

// 6. Roadmap Simulations
export const maturitySimulations = pgTable("maturity_simulations", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull(),
    frameworkId: varchar("framework_id", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // The simulation configuration 
    config: jsonb("config").$type<{
        targetLevel?: number;
        categoryIds?: number[];
        excludedRequirementIds?: number[];
    }>().notNull(),

    // Results (cached)
    results: jsonb("results").$type<{
        projectedScore: number;
        gapCount: number;
        estimatedEffort: number;
        impactScore: number;
    }>(),

    createdAt: timestamp("created_at").defaultNow(),
    createdBy: integer("created_by"),
});

// NIST Tiers (Organizational Profiles)
export const nistTiers = pgTable("nist_tiers", {
    id: serial("id").primaryKey(),
    clientId: integer("client_id").notNull(),
    functionCode: varchar("function_code", { length: 20 }).notNull(), // GV, ID, PR, DE, RS, RC
    currentTier: integer("current_tier").default(1), // 1-4
    targetTier: integer("target_tier").default(1), // 1-4
    updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
    return {
        clientFunctionIdx: uniqueIndex("idx_nist_tiers_client_function")
            .on(table.clientId, table.functionCode),
    };
});

