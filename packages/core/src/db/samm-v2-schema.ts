// OWASP SAMM v2 Stream-Based Assessment Schema
// This implements the proper SAMM v2 methodology with 30 streams (15 practices × 2 streams each)

import { pgTable, serial, integer, varchar, text, timestamp, jsonb, uniqueIndex, boolean } from 'drizzle-orm/pg-core';

// ============================================================================
// SAMM Stream Assessments - Replaces sammMaturityAssessments
// ============================================================================

export const sammStreamAssessments = pgTable("samm_stream_assessments", {
    id: serial("id").primaryKey(),

    clientId: integer("client_id").notNull(),

    // Practice identification (e.g., "SM", "PC", "EG")
    practiceId: varchar("practice_id", { length: 10 }).notNull(),

    // Stream identification ("A" or "B")
    streamId: varchar("stream_id", { length: 1 }).notNull(),

    // Maturity levels (0-3)
    maturityLevel: integer("maturity_level").notNull().default(0),
    targetLevel: integer("target_level").notNull().default(1),

    // Assessment details - stores Yes/No answers to assessment questions
    // Format: { "level1": true, "level2": false, "level3": false }
    assessmentAnswers: jsonb("assessment_answers").$type<Record<string, boolean>>().default({}),

    // Quality criteria checklist
    // Format: { "level1": { "criteria1": true, "criteria2": false, ... }, ... }
    qualityCriteria: jsonb("quality_criteria").$type<Record<string, Record<string, boolean>>>().default({}),

    // Assessment metadata
    assessmentDate: timestamp("assessment_date"),
    assessedBy: integer("assessed_by"), // User ID who performed the assessment

    // Documentation and evidence
    evidence: jsonb("evidence").$type<string[]>().default([]), // URLs or file paths
    notes: text("notes"),
    improvementNotes: text("improvement_notes"),

    // Specific notes per level
    // Format: { "1": "Notes for level 1", "2": "Notes for level 2", ... }
    levelNotes: jsonb("level_notes").$type<Record<string, string>>().default({}),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {
    return {
        // Unique constraint: one assessment per client per stream
        clientPracticeStreamIdx: uniqueIndex("idx_samm_client_practice_stream")
            .on(table.clientId, table.practiceId, table.streamId),
    };
});

export type SammStreamAssessment = typeof sammStreamAssessments.$inferSelect;
export type InsertSammStreamAssessment = typeof sammStreamAssessments.$inferInsert;


// ============================================================================
// SAMM Stream Questions - Reference Data (Read-Only)
// ============================================================================

export const sammStreamQuestions = pgTable("samm_stream_questions", {
    id: serial("id").primaryKey(),

    // Stream identification
    practiceId: varchar("practice_id", { length: 10 }).notNull(), // e.g., "SM"
    practiceName: varchar("practice_name", { length: 100 }).notNull(), // e.g., "Strategy and Metrics"
    streamId: varchar("stream_id", { length: 1 }).notNull(), // "A" or "B"
    streamName: varchar("stream_name", { length: 100 }).notNull(), // e.g., "Create and Promote"
    streamDescription: text("stream_description"),

    // Level identification (0, 1, 2, or 3)
    level: integer("level").notNull(),
    levelName: varchar("level_name", { length: 50 }), // e.g., "Initial", "Defined", "Optimized"

    // Assessment question
    question: text("question").notNull(), // The main assessment question

    // Quality criteria - array of strings
    qualityCriteria: jsonb("quality_criteria").$type<string[]>().default([]),

    // Activities required at this level
    activities: jsonb("activities").$type<string[]>().default([]),

    // Benefits of achieving this level
    benefits: text("benefits"),

    // Maturity indicators - what to look for
    maturityIndicators: jsonb("maturity_indicators").$type<string[]>().default([]),

    // Suggested evidence types
    suggestedEvidence: jsonb("suggested_evidence").$type<string[]>().default([]),

    // Business function (Governance, Design, Implementation, Verification, Operations)
    businessFunction: varchar("business_function", { length: 50 }).notNull(),

    // Official SAMM documentation links
    officialLink: varchar("official_link", { length: 500 }),

    // Metadata
    isActive: boolean("is_active").default(true),
    version: varchar("version", { length: 20 }).default("2.0"), // SAMM version

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {
    return {
        // Unique constraint: one question set per stream per level
        practiceStreamLevelIdx: uniqueIndex("idx_samm_practice_stream_level")
            .on(table.practiceId, table.streamId, table.level),
    };
});

export type SammStreamQuestion = typeof sammStreamQuestions.$inferSelect;
export type InsertSammStreamQuestion = typeof sammStreamQuestions.$inferInsert;


// ============================================================================
// SAMM Practices - Reference Data (Read-Only)
// ============================================================================

export const sammPractices = pgTable("samm_practices", {
    id: serial("id").primaryKey(),

    practiceId: varchar("practice_id", { length: 10 }).notNull().unique(), // e.g., "SM"
    practiceName: varchar("practice_name", { length: 100 }).notNull(),
    description: text("description"),

    businessFunction: varchar("business_function", { length: 50 }).notNull(),

    // Stream definitions
    streamAName: varchar("stream_a_name", { length: 100 }),
    streamADescription: text("stream_a_description"),
    streamBName: varchar("stream_b_name", { length: 100 }),
    streamBDescription: text("stream_b_description"),

    // Additional metadata
    officialLink: varchar("official_link", { length: 500 }),
    order: integer("order"), // Display order

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export type SammPractice = typeof sammPractices.$inferSelect;
export type InsertSammPractice = typeof sammPractices.$inferInsert;
