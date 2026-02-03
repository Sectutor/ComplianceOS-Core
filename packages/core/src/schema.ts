import { pgTable, integer, varchar, text, timestamp, pgEnum, boolean, json, jsonb, serial, index, uniqueIndex, customType } from "drizzle-orm/pg-core";



import { sql } from "drizzle-orm";



// Custom type for pgvector - will be used when pgvector extension is enabled





export const vector = customType<{ data: number[]; driverData: string }>({

  dataType() {

    return 'vector(1536)';

  },

  toDriver(value: number[]): string {

    return JSON.stringify(value);

  },

  fromDriver(value: string): number[] {

    return JSON.parse(value);

  },

});









export const roleEnum = pgEnum("role", ["owner", "admin", "editor", "viewer"]);



export const controlStatusEnum = pgEnum("control_status", ["active", "inactive", "draft"]);



export const clientControlStatusEnum = pgEnum("client_control_status", ["not_implemented", "in_progress", "implemented", "not_applicable"]);



export const crmEngagementStageEnum = pgEnum("crm_engagement_stage", ["planned", "gap_analysis", "remediation", "audit_prep", "audit_active", "certified", "maintenance"]);



export const policyStatusEnum = pgEnum("policy_status", ["draft", "review", "approved", "archived"]);



export const policyReviewStatusEnum = pgEnum("policy_review_status", ["analyzing", "completed", "applying_changes", "applied", "failed"]);



export const evidenceStatusEnum = pgEnum("evidence_status", ["pending", "collected", "verified", "expired", "not_applicable"]);



export const taskTypeEnum = pgEnum("task_type", ["control", "policy", "evidence", "mapping"]);



export const raciRoleEnum = pgEnum("raci_role", ["responsible", "accountable", "consulted", "informed"]);



export const kanbanStatusEnum = pgEnum("kanban_status", ["backlog", "todo", "in_progress", "review", "done"]);



export const roadmapStatusEnum = pgEnum("roadmap_status", ["draft", "active", "on_track", "delayed", "completed"]);



export const implementationStatusEnum = pgEnum("implementation_status", ["not_started", "planning", "in_progress", "testing", "completed", "blocked"]);



export const dataBreachStatusEnum = pgEnum("data_breach_status", ["open", "investigating", "closed", "reported"]);



export const reportVersionEnum = pgEnum("report_version", ["draft", "v1.0", "v1.1", "v2.0", "final"]);





export const projectTasks = pgTable("project_tasks", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 500 }).notNull(),



  description: text("description"),



  status: kanbanStatusEnum("status").default("todo"),



  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, critical



  dueDate: timestamp("due_date"),



  assigneeId: integer("assignee_id"), // User ID



  position: integer("position").default(0), // For Kanban ordering



  tags: json("tags").$type<string[]>(),



  sourceType: varchar("source_type", { length: 50 }), // 'remediation', 'policy', 'control', etc.



  sourceId: integer("source_id"), // ID of the linked entity



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientStatusIdx: index("idx_pt_client_status").on(table.clientId, table.status),



    assigneeIdx: index("idx_pt_assignee").on(table.assigneeId),



  };



});







export type ProjectTask = typeof projectTasks.$inferSelect;



export type InsertProjectTask = typeof projectTasks.$inferInsert;





// ==========================================

// Roadmap Module - Strategic Planning Layer

// ==========================================



export const roadmaps = pgTable("roadmaps", {

  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),



  // Strategic planning

  vision: text("vision"), // Overall compliance vision

  objectives: json("objectives").$type<string[]>(), // High-level objectives

  framework: varchar("framework", { length: 100 }), // ISO 27001, SOX, HIPAA, etc.



  // Timeline and status

  status: roadmapStatusEnum("status").default("draft"),

  startDate: timestamp("start_date"),

  targetDate: timestamp("target_date"),

  actualStartDate: timestamp("actual_start_date"),

  actualEndDate: timestamp("actual_end_date"),



  // KPIs and metrics

  kpiTargets: json("kpi_targets").$type<{ name: string; target: number; current?: number; unit: string }[]>(),



  // Metadata

  createdById: integer("created_by_id").notNull(),

  approvedById: integer("approved_by_id"),

  approvedAt: timestamp("approved_at"),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_roadmap_client_status").on(table.clientId, table.status),

    frameworkIdx: index("idx_roadmap_framework").on(table.framework),

  };

});



export type Roadmap = typeof roadmaps.$inferSelect;

export type InsertRoadmap = typeof roadmaps.$inferInsert;



// Roadmap milestones - key strategic milestones

export const roadmapMilestones = pgTable("roadmap_milestones", {

  id: serial("id").primaryKey(),



  roadmapId: integer("roadmap_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),



  // Timeline

  targetDate: timestamp("target_date").notNull(),

  actualDate: timestamp("actual_date"),



  // Status and dependencies

  status: varchar("status", { length: 50 }).default("pending"), // pending, completed, delayed

  dependencies: json("dependencies").$type<number[]>(), // IDs of prerequisite milestones



  // Progress tracking

  progressPercentage: integer("progress_percentage").default(0),

  completedItemsCount: integer("completed_items_count").default(0),

  totalItemsCount: integer("total_items_count").default(0),



  // Significance

  isGate: boolean("is_gate").default(false), // Gate milestone blocks progress

  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, critical



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    roadmapIdx: index("idx_milestone_roadmap").on(table.roadmapId),

    targetDateIdx: index("idx_milestone_target").on(table.targetDate),

  };

});



export type RoadmapMilestone = typeof roadmapMilestones.$inferSelect;

export type InsertRoadmapMilestone = typeof roadmapMilestones.$inferInsert;



// ==========================================

// Implementation Plan Module - Execution Layer

// ==========================================



export const complianceFrameworks = pgTable("compliance_frameworks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  shortCode: varchar("short_code", { length: 50 }).notNull(), // ISO27001, SOC2
  version: varchar("version", { length: 50 }), // 2022
  description: text("description"),
  type: varchar("type", { length: 50 }).default("framework"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const implementationPhases = pgTable("implementation_phases", {
  id: serial("id").primaryKey(),
  frameworkId: integer("framework_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("order").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    frameworkIdx: index("idx_phase_framework").on(table.frameworkId),
  };
});

export const frameworkRequirements = pgTable("framework_requirements", {
  id: serial("id").primaryKey(),
  frameworkId: integer("framework_id").notNull(),
  phaseId: integer("phase_id"),
  identifier: varchar("identifier", { length: 100 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  guidance: text("guidance"),
  mappingTags: json("mapping_tags").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    frameworkIdx: index("idx_req_framework").on(table.frameworkId),
    phaseIdx: index("idx_req_phase").on(table.phaseId),
  };
});

export const implementationPlans = pgTable("implementation_plans", {

  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),

  roadmapId: integer("roadmap_id"), // Links to strategic roadmap

  frameworkId: integer("framework_id"),
  customFrameworkName: varchar("custom_framework_name", { length: 255 }),
  harmonizationSourceIds: json("harmonization_source_ids").$type<number[]>(),



  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),



  // Planning and scope

  status: implementationStatusEnum("status").default("not_started"),

  priority: varchar("priority", { length: 50 }).default("medium"),



  // Timeline

  plannedStartDate: timestamp("planned_start_date"),

  plannedEndDate: timestamp("planned_end_date"),

  actualStartDate: timestamp("actual_start_date"),

  actualEndDate: timestamp("actual_end_date"),



  // Resources and budget

  estimatedHours: integer("estimated_hours"),

  actualHours: integer("actual_hours"),

  budgetAmount: integer("budget_amount"), // In cents/currency units

  actualCost: integer("actual_cost"),



  // Team assignments

  projectManagerId: integer("project_manager_id"),

  teamMemberIds: json("team_member_ids").$type<number[]>(),



  // Risk and compliance context

  linkedFramework: varchar("linked_framework", { length: 100 }),

  linkedControls: json("linked_controls").$type<number[]>(),

  riskMitigationFocus: json("risk_mitigation_focus").$type<string[]>(),



  // Dependencies

  prerequisites: json("prerequisites").$type<number[]>(), // IDs of prerequisite implementation plans

  blockedBy: json("blocked_by").$type<number[]>(),



  createdById: integer("created_by_id").notNull(),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_impl_plan_client_status").on(table.clientId, table.status),

    roadmapIdx: index("idx_impl_plan_roadmap").on(table.roadmapId),

    timelineIdx: index("idx_impl_plan_timeline").on(table.plannedStartDate, table.plannedEndDate),

  };

});



export type ImplementationPlan = typeof implementationPlans.$inferSelect;

export type InsertImplementationPlan = typeof implementationPlans.$inferInsert;



// Implementation tasks - granular work items

export const implementationTasks = pgTable("implementation_tasks", {

  id: serial("id").primaryKey(),



  implementationPlanId: integer("implementation_plan_id").notNull(),



  title: varchar("title", { length: 500 }).notNull(),

  description: text("description"),



  // Status and tracking

  status: kanbanStatusEnum("status").default("todo"),
  pdca: varchar("pdca", { length: 100 }), // Plan, Do, Check, Act or Framework Chapters
  nist: varchar("nist", { length: 50 }), // Govern, Identify, Protect, Detect, Respond, Recover

  progressPercentage: integer("progress_percentage").default(0),



  // Assignment

  assigneeId: integer("assignee_id"),

  reviewerId: integer("reviewer_id"),



  // Timeline

  estimatedHours: integer("estimated_hours"),

  actualHours: integer("actual_hours"),

  plannedStartDate: timestamp("planned_start_date"),

  plannedEndDate: timestamp("planned_end_date"),

  actualStartDate: timestamp("actual_start_date"),

  actualEndDate: timestamp("actual_end_date"),



  // Dependencies

  dependencies: json("dependencies").$type<number[]>(),

  blockedBy: json("blocked_by").$type<number[]>(),



  // Quality and deliverables

  acceptanceCriteria: text("acceptance_criteria"),

  deliverables: json("deliverables").$type<string[]>(),

  evidenceRequired: json("evidence_required").$type<string[]>(),



  // Risk and controls

  riskMitigation: text("risk_mitigation"),

  controlId: varchar("control_id", { length: 100 }),



  // Metadata

  tags: json("tags").$type<string[]>(),

  subtasks: json("subtasks").$type<{ id: string; title: string; completed: boolean; evidenceId?: string; evidenceUrl?: string; filename?: string }[]>(),

  priority: varchar("priority", { length: 50 }).default("medium"),



  createdById: integer("created_by_id").notNull(),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    planIdx: index("idx_impl_task_plan").on(table.implementationPlanId),

    assigneeIdx: index("idx_impl_task_assignee").on(table.assigneeId),

    statusIdx: index("idx_impl_task_status").on(table.status),

  };

});



export type ImplementationTask = typeof implementationTasks.$inferSelect;

export type InsertImplementationTask = typeof implementationTasks.$inferInsert;



// Progress tracking and feedback loops

export const implementationProgress = pgTable("implementation_progress", {

  id: serial("id").primaryKey(),



  implementationPlanId: integer("implementation_plan_id").notNull(),



  // Progress snapshot

  completedTasksCount: integer("completed_tasks_count").default(0),

  totalTasksCount: integer("total_tasks_count").default(0),

  overallProgressPercentage: integer("overall_progress_percentage").default(0),



  // Status changes

  statusChangeDate: timestamp("status_change_date").defaultNow(),

  previousStatus: varchar("previous_status", { length: 50 }),

  newStatus: varchar("new_status", { length: 50 }),



  // Milestone impact

  affectedMilestoneIds: json("affected_milestone_ids").$type<number[]>(),

  milestoneProgressUpdates: json("milestone_progress_updates").$type<{ milestoneId: number; progress: number }[]>(),



  // Workflows feedback

  workflowsCompletedCount: integer("workflows_completed_count").default(0),

  workflowsBlockedCount: integer("workflows_blocked_count").default(0),



  // Quality metrics

  qualityScore: integer("quality_score"), // 1-100 based on task completion quality

  adherenceScore: integer("adherence_score"), // 1-100 based on timeline/budget adherence



  reportedById: integer("reported_by_id").notNull(),

  notes: text("notes"),



  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    planIdx: index("idx_impl_progress_plan").on(table.implementationPlanId),

    dateIdx: index("idx_impl_progress_date").on(table.statusChangeDate),

  };

});



export type ImplementationProgress = typeof implementationProgress.$inferSelect;

export type InsertImplementationProgress = typeof implementationProgress.$inferInsert;





export const users = pgTable("users", {



  id: serial("id").primaryKey(),



  openId: varchar("open_id", { length: 255 }).notNull().unique(),



  name: varchar("name", { length: 255 }),



  email: varchar("email", { length: 255 }),



  loginMethod: varchar("login_method", { length: 255 }),



  lastSignedIn: timestamp("last_signed_in").defaultNow(),



  role: varchar("role", { length: 50 }).default("user"),



  deletedAt: timestamp("deleted_at"),



  maxClients: integer("max_clients").default(2), // Support Model 1 (Subscription)



  hasSeenTour: boolean("has_seen_tour").default(false),



  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),



  subscriptionStatus: varchar("subscription_status", { length: 50 }),



  planTier: varchar("plan_tier", { length: 50 }).default("free"),



  createdAt: timestamp("created_at").defaultNow(),



});








// ==========================================
// Auditor Portal Module
// ==========================================

export const findingSeverityEnum = pgEnum("finding_severity", ["low", "medium", "high", "critical"]);
export const findingStatusEnum = pgEnum("finding_status", ["open", "remediated", "accepted", "closed"]);

export const auditFindings = pgTable("audit_findings", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: findingSeverityEnum("severity").default("medium"),
  status: findingStatusEnum("status").default("open"),
  evidenceId: integer("evidence_id"), // Optional link to specific evidence
  authorId: integer("author_id").notNull(), // Auditor who created it
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_findings_client").on(table.clientId),
    statusIdx: index("idx_findings_status").on(table.status),
  };
});

export type AuditFinding = typeof auditFindings.$inferSelect;
export type InsertAuditFinding = typeof auditFindings.$inferInsert;




export type InsertUser = typeof users.$inferInsert;







export const clients = pgTable("clients", {



  id: serial("id").primaryKey(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  industry: varchar("industry", { length: 255 }),



  size: varchar("size", { length: 50 }),



  status: varchar("status", { length: 50 }).default("active"),



  notes: text("notes"),



  logoUrl: varchar("logo_url", { length: 1024 }),



  primaryContactName: varchar("primary_contact_name", { length: 255 }),



  primaryContactEmail: varchar("primary_contact_email", { length: 255 }),



  primaryContactPhone: varchar("primary_contact_phone", { length: 50 }),



  deploymentType: varchar("deployment_type", { length: 50 }),



  region: varchar("region", { length: 100 }),



  clientTier: varchar("client_tier", { length: 50 }),



  serviceModel: varchar("service_model", { length: 50 }).default("subscription"), // subscription, guided, managed

  // Branding
  brandPrimaryColor: varchar("brand_primary_color", { length: 20 }),
  brandSecondaryColor: varchar("brand_secondary_color", { length: 20 }),
  portalTitle: varchar("portal_title", { length: 255 }),

  weeklyFocus: text("weekly_focus"), // Advisor-set goal for Model 2



  targetComplianceScore: integer("target_compliance_score").default(80),



  cisoName: varchar("ciso_name", { length: 255 }),



  dpoName: varchar("dpo_name", { length: 255 }),



  headquarters: varchar("headquarters", { length: 255 }),



  mainServiceRegion: varchar("main_service_region", { length: 255 }),



  // Policy Settings



  policyLanguage: varchar("policy_language", { length: 50 }).default("en"), // Language code: en, de, fr, es, etc.



  legalEntityName: varchar("legal_entity_name", { length: 500 }), // For policy headers



  regulatoryJurisdictions: json("regulatory_jurisdictions"), // Array: ["EU", "US", "UK"]



  defaultDocumentClassification: varchar("default_document_classification", { length: 50 }).default("internal"),



  // SaaS / Stripe Integration (Nullable for Single-Tenant Mode)



  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),



  subscriptionStatus: varchar("subscription_status", { length: 50 }), // 'active', 'trialing', 'past_due', 'canceled', 'incomplete'



  planTier: varchar("plan_tier", { length: 50 }).default("free"), // 'free', 'startup', 'pro', 'enterprise'



  subscriptionEndDate: timestamp("subscription_end_date"),



  // Modules - Feature Flagging



  activeModules: json("active_modules").$type<string[]>(), // e.g. ["crm", "billing"]



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type Client = typeof clients.$inferSelect;



export type InsertClient = typeof clients.$inferInsert;







export const userClients = pgTable("user_clients", {



  id: serial("id").primaryKey(),



  userId: integer("user_id").notNull(),



  clientId: integer("client_id").notNull(),



  role: roleEnum("role").default("viewer").notNull(),



  joinedAt: timestamp("joined_at").defaultNow(),



}, (table) => {



  return {



    userIdIdx: index("idx_uc_user").on(table.userId),



    clientIdIdx: index("idx_uc_client").on(table.clientId),



  };



});







export type UserClient = typeof userClients.$inferSelect;



export type InsertUserClient = typeof userClients.$inferInsert;







export const controls = pgTable("controls", {



  id: serial("id").primaryKey(),



  controlId: varchar("control_id", { length: 50 }).notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  framework: varchar("framework", { length: 255 }).notNull(),



  owner: varchar("owner", { length: 255 }),



  frequency: varchar("frequency", { length: 50 }),



  evidenceType: varchar("evidence_type", { length: 100 }),



  status: controlStatusEnum("status").default("draft"),



  version: integer("version").default(1).notNull(),



  category: varchar("category", { length: 255 }),



  grouping: varchar("grouping", { length: 255 }), // Used for sub-grouping like NIST Categories (e.g. "Asset Management")



  implementationGuidance: text("implementation_guidance"), // For detailed examples or instructions



  suggestedPolicies: text("suggested_policies"),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),

  clientId: integer("client_id"), // Nullable for system frameworks, set for private imports



}, (table) => {

  return {

    // Unique constraint per client (or global if client_id is null)

    // We can't easily do a partial unique index in simple Drizzle syntax without sql, but we can verify in app logic or use raw SQL.

    // For now, we index the columns for lookup.

    frameworkIdx: index("idx_controls_framework").on(table.framework),

    clientIdx: index("idx_controls_client").on(table.clientId),

  };

});







export type Control = typeof controls.$inferSelect;
export type InsertControl = typeof controls.$inferInsert;













export const controlHistory = pgTable("control_history", {



  id: serial("id").primaryKey(),



  controlId: integer("control_id").notNull(),



  version: integer("version").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  framework: varchar("framework", { length: 255 }),



  owner: varchar("owner", { length: 255 }),



  frequency: varchar("frequency", { length: 50 }),



  evidenceType: varchar("evidence_type", { length: 100 }),



  changedBy: integer("changed_by"),



  changeNote: text("change_note"),



  changedAt: timestamp("changed_at").defaultNow(),



});







export type ControlHistory = typeof controlHistory.$inferSelect;



export type InsertControlHistory = typeof controlHistory.$inferInsert;







// Cross-Framework Control Harmonization



export const controlMappings = pgTable("control_mappings", {



  id: serial("id").primaryKey(),



  sourceControlId: integer("source_control_id").notNull(), // FK to controls.id



  targetControlId: integer("target_control_id").notNull(), // FK to controls.id



  mappingType: varchar("mapping_type", { length: 50 }).notNull().default('equivalent'), // 'equivalent', 'partial', 'related'



  confidence: varchar("confidence", { length: 50 }).default('manual'), // 'manual', 'ai_high', 'ai_medium'



  notes: text("notes"),



  createdAt: timestamp("created_at").defaultNow(),



  entityId: integer("entity_id"),

  entityType: varchar("entity_type", { length: 50 }),



  createdBy: integer("created_by"), // FK to users

  isAiGenerated: boolean("is_ai_generated").default(false),

}, (table) => {

  return {

    sourceIdx: index("idx_cm_source").on(table.sourceControlId),

    targetIdx: index("idx_cm_target").on(table.targetControlId),

    uniqueMapping: uniqueIndex("idx_cm_unique").on(table.sourceControlId, table.targetControlId),

  };

});







export type ControlMapping = typeof controlMappings.$inferSelect;



export type InsertControlMapping = typeof controlMappings.$inferInsert;







// Automated Evidence Suggestions



export const evidenceTemplates = pgTable("evidence_templates", {



  id: serial("id").primaryKey(),



  name: varchar("name", { length: 255 }).notNull(),



  controlPattern: varchar("control_pattern", { length: 255 }).notNull(), // Regex or keyword: e.g., "access control|AC-|A.9"



  framework: varchar("framework", { length: 100 }), // Optional: ISO 27001, SOC 2, etc.



  category: varchar("category", { length: 100 }), // Optional: e.g., "Access Control", "Encryption"



  suggestedSources: json("suggested_sources").$type<string[]>().default([]), // ["AWS Config", "Jira", "Screenshot"]



  sampleDescription: text("sample_description"), // Example evidence description



  integrationType: varchar("integration_type", { length: 50 }).default('manual'), // 'manual', 'api', 'file'



  priority: integer("priority").default(50), // Higher = more likely to show first



  createdAt: timestamp("created_at").defaultNow(),



});







export type EvidenceTemplate = typeof evidenceTemplates.$inferSelect;



export type InsertEvidenceTemplate = typeof evidenceTemplates.$inferInsert;







// Remediation Playbooks



export const remediationPlaybooks = pgTable("remediation_playbooks", {



  id: serial("id").primaryKey(),



  title: varchar("title", { length: 255 }).notNull(),



  gapPattern: varchar("gap_pattern", { length: 255 }).notNull(), // Regex or keyword: e.g., "access control|MFA|authentication"



  category: varchar("category", { length: 100 }), // e.g., "Access Control", "Encryption"



  framework: varchar("framework", { length: 100 }), // Optional: ISO 27001, SOC 2, etc.



  severity: varchar("severity", { length: 20 }).default('medium'), // 'critical', 'high', 'medium', 'low'



  estimatedEffort: varchar("estimated_effort", { length: 50 }), // e.g., "2-4 hours", "1-2 days"



  steps: json("steps").$type<{



    order: number;



    title: string;



    description: string;



    owner?: string;



    dueOffset?: number; // days from start



    checklist?: string[];



  }[]>().default([]),



  ownerTemplate: text("owner_template"), // e.g., "IT Security Team, with approval from CISO"



  policyLanguage: text("policy_language"), // Sample policy text to include



  itsmTemplate: json("itsm_template").$type<{



    type: string; // 'jira', 'servicenow', 'generic'



    summary: string;



    description: string;



    priority: string;



    labels?: string[];



  }>(),



  priority: integer("priority").default(50),



  createdAt: timestamp("created_at").defaultNow(),



});







export type RemediationPlaybook = typeof remediationPlaybooks.$inferSelect;



export type InsertRemediationPlaybook = typeof remediationPlaybooks.$inferInsert;







// Compliance Posture Snapshots for Trending & Forecasting



export const complianceSnapshots = pgTable("compliance_snapshots", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  snapshotDate: timestamp("snapshot_date").notNull().defaultNow(),







  // Control metrics



  totalControls: integer("total_controls").default(0),



  implementedControls: integer("implemented_controls").default(0),



  inProgressControls: integer("in_progress_controls").default(0),



  notImplementedControls: integer("not_implemented_controls").default(0),



  notApplicableControls: integer("not_applicable_controls").default(0),







  // Gap metrics  



  totalGaps: integer("total_gaps").default(0),



  closedGaps: integer("closed_gaps").default(0),



  criticalGaps: integer("critical_gaps").default(0),



  highGaps: integer("high_gaps").default(0),







  // Risk metrics



  totalRisks: integer("total_risks").default(0),



  mitigatedRisks: integer("mitigated_risks").default(0),







  // Calculated scores



  complianceScore: integer("compliance_score").default(0), // 0-100



  riskScore: integer("risk_score").default(0), // 0-100 (lower is better)







  // Velocity metrics (calculated from previous snapshot)



  controlsClosedThisPeriod: integer("controls_closed_this_period").default(0),



  gapsClosedThisPeriod: integer("gaps_closed_this_period").default(0),







  createdAt: timestamp("created_at").defaultNow(),



});







export type ComplianceSnapshot = typeof complianceSnapshots.$inferSelect;



export type InsertComplianceSnapshot = typeof complianceSnapshots.$inferInsert;







// Gap Email Questionnaire Requests



export const gapQuestionnaireRequests = pgTable("gap_questionnaire_requests", {



  id: serial("id").primaryKey(),



  assessmentId: integer("assessment_id").notNull(), // FK to gap_assessments



  token: varchar("token", { length: 64 }).notNull().unique(), // Secure access token



  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),



  recipientName: varchar("recipient_name", { length: 255 }),



  controlIds: json("control_ids").$type<number[]>().default([]), // Control IDs included



  message: text("message"), // Custom message to recipient



  status: varchar("status", { length: 20 }).default('pending'), // pending, viewed, completed, expired



  sentAt: timestamp("sent_at"),



  expiresAt: timestamp("expires_at"),



  viewedAt: timestamp("viewed_at"),



  completedAt: timestamp("completed_at"),



  appliedAt: timestamp("applied_at"), // When response was approved/applied to assessment



  archivedAt: timestamp("archived_at"), // For compliance records (hidden/read-only)



  respondentName: varchar("respondent_name", { length: 255 }), // Who actually filled it out



  responses: json("responses").$type<{



    controlId: number;



    currentStatus: string;



    notes: string;



    answeredAt: string;



  }[]>().default([]),



  createdBy: integer("created_by"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type GapQuestionnaireRequest = typeof gapQuestionnaireRequests.$inferSelect;



export type InsertGapQuestionnaireRequest = typeof gapQuestionnaireRequests.$inferInsert;







export const policyTemplates = pgTable("policy_templates", {



  id: serial("id").primaryKey(),



  templateId: varchar("template_id", { length: 50 }).notNull().unique(),



  name: varchar("name", { length: 255 }).notNull(),



  content: text("content"),

  // Ownership
  ownerId: integer("owner_id"),
  isPublic: boolean("is_public").default(false),



  sections: json("sections").$type<{



    id: string;



    title: string;



    content: string;



    optional: boolean;



    defaultEnabled: boolean;



  }[]>(),



  frameworks: json("frameworks").$type<string[]>(), // Changed from single framework string



  createdAt: timestamp("created_at").defaultNow(),



});







export type PolicyTemplate = typeof policyTemplates.$inferSelect;



export type InsertPolicyTemplate = typeof policyTemplates.$inferInsert;







export const clientControls = pgTable("client_controls", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  controlId: integer("control_id").notNull(),



  clientControlId: varchar("client_control_id", { length: 50 }),



  customDescription: text("custom_description"),



  owner: varchar("owner", { length: 255 }),



  dueDate: timestamp("due_date"),



  // SoA Fields



  applicability: varchar("applicability", { length: 50 }).default("applicable"), // "applicable", "not_applicable"



  justification: text("justification"),



  implementationDate: timestamp("implementation_date"),



  implementationNotes: text("implementation_notes"),



  evidenceLocation: text("evidence_location"),



  status: clientControlStatusEnum("status").default("not_implemented"),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIdIdx: index("idx_cc_client").on(table.clientId),



    clientStatusIdx: index("idx_cc_client_status").on(table.clientId, table.status),



  };



});







export type ClientControl = typeof clientControls.$inferSelect;



export type InsertClientControl = typeof clientControls.$inferInsert;







export const policyModuleEnum = pgEnum("policy_module", ["general", "privacy"]);



export const clientPolicies = pgTable("client_policies", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  templateId: integer("template_id"),



  clientPolicyId: varchar("client_policy_id", { length: 50 }),



  name: varchar("name", { length: 255 }).notNull(),



  content: text("content"),



  status: policyStatusEnum("status").default("draft"),



  version: integer("version").default(1),



  owner: varchar("owner", { length: 255 }),



  module: varchar("module", { length: 50 }).default("general"), // Reverted enum to varchar to avoid casting error during push



  isAiGenerated: boolean("is_ai_generated").default(false),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIdIdx: index("idx_cp_client").on(table.clientId),



    clientStatusIdx: index("idx_cp_client_status").on(table.clientId, table.status),



  };



});







export type ClientPolicy = typeof clientPolicies.$inferSelect;



export type InsertClientPolicy = typeof clientPolicies.$inferInsert;







export const controlPolicyMappings = pgTable("control_policy_mappings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  clientControlId: integer("client_control_id").notNull(),



  clientPolicyId: integer("client_policy_id").notNull(),



  evidenceReference: text("evidence_reference"),



  notes: text("notes"),



  isAiGenerated: boolean("is_ai_generated").default(false),



  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    policyIdx: index("idx_cpm_policy").on(table.clientPolicyId),

    controlIdx: index("idx_cpm_control").on(table.clientControlId),

    uniqueMapping: uniqueIndex("idx_cpm_unique").on(table.clientPolicyId, table.clientControlId),

  };

});











export type ControlPolicyMapping = typeof controlPolicyMappings.$inferSelect;



export type InsertControlPolicyMapping = typeof controlPolicyMappings.$inferInsert;











export const evidence = pgTable("evidence", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  clientControlId: integer("client_control_id").notNull(),



  evidenceId: varchar("evidence_id", { length: 50 }).notNull(),



  description: text("description"),

  framework: varchar("framework", { length: 50 }).default('ISO 27001'),
  type: varchar("type", { length: 100 }),

  status: evidenceStatusEnum("status").default("pending"),

  dueDate: timestamp("due_date"),
  fileCount: integer("file_count").default(0),

  owner: varchar("owner", { length: 255 }),

  location: varchar("location", { length: 1024 }),

  lastVerified: timestamp("last_verified"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdIdx: index("idx_ev_client").on(table.clientId),

    clientStatusIdx: index("idx_ev_client_status").on(table.clientId, table.status),

  };

});



export type Evidence = typeof evidence.$inferSelect;

export type InsertEvidence = typeof evidence.$inferInsert;




// Consent Management Tables

export const consentStatusEnum = pgEnum("consent_status", ["active", "withdrawn", "expired", "revoked"]);



export const consentTypeEnum = pgEnum("consent_type", ["marketing", "analytics", "functional", "third_party", "cookie"]);



export const consents = pgTable("consents", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  dataSubjectId: varchar("data_subject_id", { length: 255 }).notNull(), // User ID, email, or identifier

  consentType: consentTypeEnum("consent_type").notNull(),

  purpose: text("purpose").notNull(), // Description of data processing purpose

  legalBasis: text("legal_basis").notNull(), // GDPR Article 6 legal basis

  granularConsents: json("granular_consents").$type<Record<string, boolean>>(), // Granular consent options

  consentTimestamp: timestamp("consent_timestamp").defaultNow(),

  ipAddress: varchar("ip_address", { length: 45 }),

  userAgent: text("user_agent"),

  consentForm: text("consent_form"), // Consent form version or type

  withdrawalTimestamp: timestamp("withdrawal_timestamp"),

  withdrawalReason: text("withdrawal_reason"),

  expirationDate: timestamp("expiration_date"),

  status: consentStatusEnum("status").default("active"),

  retentionPeriod: integer("retention_period"), // Days to retain consent records

  metadata: json("metadata"), // Additional consent metadata

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientIdIdx: index("idx_consent_client").on(table.clientId),

    dataSubjectIdx: index("idx_consent_subject").on(table.dataSubjectId),

    statusIdx: index("idx_consent_status").on(table.status),

  };

});



export const consentTemplates = pgTable("consent_templates", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  consentType: consentTypeEnum("consent_type").notNull(),

  templateContent: text("template_content").notNull(), // HTML or markdown template

  granularOptions: json("granular_options").$type<Array<{ id: string, label: string, required: boolean }>>(),

  retentionPeriod: integer("retention_period").default(2555), // 7 years default

  isActive: boolean("is_active").default(true),

  version: varchar("version", { length: 20 }).default("1.0"),

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



// Template Management Tables

export const dsarTemplates = pgTable("dsar_templates", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  requestType: varchar("request_type", { length: 100 }).notNull(), // access, erasure, correction, etc.

  templateContent: json("template_content").$type<{

    subject: string,

    description: string,

    verificationSteps: Array<{

      type: string,

      label: string,

      required: boolean

    }>,

    dataCategories: Array<{

      category: string,

      included: boolean,

      description: string

    }>

  }>(),

  isActive: boolean("is_active").default(true),

  usageCount: integer("usage_count").default(0),

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export const dpiaTemplates = pgTable("dpia_templates", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  category: varchar("category", { length: 100 }).notNull(), // high_risk, systematic, etc.

  templateContent: json("template_content").$type<{

    screeningQuestions: Array<{

      id: string,

      question: string,

      type: 'boolean' | 'text' | 'select',

      options?: string[],

      required: boolean

    }>,

    riskFactors: Array<{

      factor: string,

      weight: number,

      description: string

    }>,

    mitigationMeasures: Array<{

      measure: string,

      category: string,

      description: string

    }>

  }>(),

  isActive: boolean("is_active").default(true),

  usageCount: integer("usage_count").default(0),

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



// Data Flow Visualization Tables

export const dataFlowVisualizations = pgTable("data_flow_visualizations", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  sourceSystem: varchar("source_system", { length: 255 }).notNull(),

  targetSystem: varchar("target_system", { length: 255 }).notNull(),

  dataType: varchar("data_type", { length: 100 }).notNull(), // personal_data, sensitive_data, etc.

  flowType: varchar("flow_type", { length: 100 }).notNull(), // internal, external, third_party

  processId: integer("process_id"), // Link to business process

  legalBasis: text("legal_basis"),

  frequency: varchar("frequency", { length: 50 }), // real_time, daily, weekly, etc.

  volume: varchar("volume", { length: 100 }), // records_per_day, mb_per_hour, etc.

  securityMeasures: text("security_measures"),

  countries: json("countries").$type<Array<{ country: string, purpose: string }>>(), // Cross-border flows

  flowMetadata: json("flow_metadata").$type<{

    technologies: string[],

    protocols: string[],

    storageDuration: string,

    retentionPeriod: string

  }>(),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientIdIdx: index("idx_dataflow_client").on(table.clientId),

    processIdx: index("idx_dataflow_process").on(table.processId),

    sourceIdx: index("idx_dataflow_source").on(table.sourceSystem),

    targetIdx: index("idx_dataflow_target").on(table.targetSystem),

  };

});



export const dataFlowNodes = pgTable("data_flow_nodes", {

  id: serial("id").primaryKey(),

  flowId: integer("flow_id").notNull().references(() => dataFlowVisualizations.id),

  nodeType: varchar("node_type", { length: 50 }).notNull(), // system, process, storage, person

  nodeName: varchar("node_name", { length: 255 }).notNull(),

  nodeDescription: text("node_description"),

  nodeCategory: varchar("node_category", { length: 100 }), // internal_system, external_vendor, cloud_service

  positionX: integer("position_x").default(0),

  positionY: integer("position_y").default(0),

  nodeMetadata: json("node_metadata"),

  createdAt: timestamp("created_at").defaultNow(),

});



export const dataFlowConnections = pgTable("data_flow_connections", {

  id: serial("id").primaryKey(),

  flowId: integer("flow_id").notNull().references(() => dataFlowVisualizations.id),

  sourceNodeId: integer("source_node_id").notNull().references(() => dataFlowNodes.id),

  targetNodeId: integer("target_node_id").notNull().references(() => dataFlowNodes.id),

  connectionType: varchar("connection_type", { length: 50 }).notNull(), // api, file_transfer, manual

  dataType: varchar("data_type", { length: 100 }).notNull(),

  frequency: varchar("frequency", { length: 50 }),

  securityControls: text("security_controls"),

  isActive: boolean("is_active").default(true),

  createdAt: timestamp("created_at").defaultNow(),

});



// Types

export type Consent = typeof consents.$inferSelect;

export type InsertConsent = typeof consents.$inferInsert;

export type ConsentTemplate = typeof consentTemplates.$inferSelect;

export type InsertConsentTemplate = typeof consentTemplates.$inferInsert;

export type DsarTemplate = typeof dsarTemplates.$inferSelect;

export type InsertDsarTemplate = typeof dsarTemplates.$inferInsert;

export type DpiaTemplate = typeof dpiaTemplates.$inferSelect;

export type InsertDpiaTemplate = typeof dpiaTemplates.$inferInsert;

export type DataFlowVisualization = typeof dataFlowVisualizations.$inferSelect;

export type InsertDataFlowVisualization = typeof dataFlowVisualizations.$inferInsert;

export type DataFlowNode = typeof dataFlowNodes.$inferSelect;

export type InsertDataFlowNode = typeof dataFlowNodes.$inferInsert;

export type DataFlowConnection = typeof dataFlowConnections.$inferSelect;

export type InsertDataFlowConnection = typeof dataFlowConnections.$inferInsert;









export const integrationDefinitions = pgTable("integration_definitions", {

  id: serial("id").primaryKey(),

  provider: varchar("provider", { length: 50 }).notNull().unique(), // 'jira', 'slack'

  name: varchar("name", { length: 100 }).notNull(), // 'Jira Cloud', 'Slack'

  clientId: text("client_id").notNull(),

  clientSecret: text("client_secret").notNull(),

  scopes: text("scopes"), // Space separated scopes

  redirectUri: text("redirect_uri"), // Optional override

  isActive: boolean("is_active").default(true),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export const integrations = pgTable("integrations", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  provider: varchar("provider", { length: 50 }).notNull(), // 'jira', 'slack', etc.

  accessToken: text("access_token"),

  refreshToken: text("refresh_token"),

  expiresAt: timestamp("expires_at"),

  externalAccountId: varchar("external_account_id", { length: 255 }), // cloudId, workspaceId

  scopes: json("scopes").$type<string[]>(),

  metadata: json("metadata"), // { siteName: "My Jira", email: "..." }

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientProviderIdx: uniqueIndex("idx_integrations_client_provider").on(table.clientId, table.provider),

  };

});



export type IntegrationDefinition = typeof integrationDefinitions.$inferSelect;

export type InsertIntegrationDefinition = typeof integrationDefinitions.$inferInsert;

export type Integration = typeof integrations.$inferSelect;

export type InsertIntegration = typeof integrations.$inferInsert;







export const notificationSettings = pgTable("notification_settings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  emailEnabled: boolean("email_enabled").default(true),



  overdueEnabled: boolean("overdue_enabled").default(true),



  upcomingReviewDays: integer("upcoming_review_days").default(7),



  dailyDigestEnabled: boolean("daily_digest_enabled").default(false),



  weeklyDigestEnabled: boolean("weekly_digest_enabled").default(true),



  notifyControlReviews: boolean("notify_control_reviews").default(true),



  notifyPolicyRenewals: boolean("notify_policy_renewals").default(true),



  notifyEvidenceExpiration: boolean("notify_evidence_expiration").default(true),



  notifyRiskReviews: boolean("notify_risk_reviews").default(true),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    clientIdIdx: index("idx_ns_client").on(table.clientId),



  };



});







export type NotificationSettings = typeof notificationSettings.$inferSelect;



export type InsertNotificationSettings = typeof notificationSettings.$inferInsert;







export const evidenceRequests = pgTable("evidence_requests", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  clientControlId: integer("client_control_id").notNull(),



  requesterId: integer("requester_id").notNull(), // User ID



  assigneeId: integer("assignee_id").notNull(), // Employee ID



  status: varchar("status", { length: 50 }).default("open"), // open, submitted, verified, rejected



  dueDate: timestamp("due_date"),



  description: text("description"),



  evidenceId: integer("evidence_id"), // Linked evidence once submitted



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_er_client_status").on(table.clientId, table.status),

    assigneeIdx: index("idx_er_assignee").on(table.assigneeId),

    controlIdx: index("idx_er_control").on(table.clientControlId),

  };

});







export type EvidenceRequest = typeof evidenceRequests.$inferSelect;



export type InsertEvidenceRequest = typeof evidenceRequests.$inferInsert;







export const auditNotes = pgTable("audit_notes", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  controlId: integer("control_id").notNull(),



  userId: integer("user_id"),



  note: text("note").notNull(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type AuditNote = typeof auditNotes.$inferSelect;



export type InsertAuditNote = typeof auditNotes.$inferInsert;







export const evidenceFiles = pgTable("evidence_files", {



  id: serial("id").primaryKey(),



  evidenceId: integer("evidence_id").notNull(),



  filename: varchar("filename", { length: 255 }).notNull(),



  fileUrl: varchar("file_url", { length: 1024 }).notNull(),



  fileKey: varchar("file_key", { length: 1024 }).notNull(),



  contentType: varchar("content_type", { length: 100 }),



  fileSize: integer("file_size"),



  uploadedBy: integer("uploaded_by"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type EvidenceFile = typeof evidenceFiles.$inferSelect;



export type InsertEvidenceFile = typeof evidenceFiles.$inferInsert;













export const notificationLog = pgTable("notification_log", {



  id: serial("id").primaryKey(),



  userId: integer("user_id").notNull(),



  type: varchar("type", { length: 50 }),



  channel: varchar("channel", { length: 20 }).default("email"), // email, system, push



  title: varchar("title", { length: 255 }),



  message: text("message"),



  sentAt: timestamp("sent_at").defaultNow(),



  status: varchar("status", { length: 20 }).default("sent"), // sent, failed, queued



  metadata: json("metadata"), // Context data



  relatedEntityType: varchar("related_entity_type", { length: 50 }), // risk, policy, gap, questionnaire



  relatedEntityId: integer("related_entity_id"),



});







export type NotificationLog = typeof notificationLog.$inferSelect;



export type InsertNotificationLog = typeof notificationLog.$inferInsert;







export const communicationTemplates = pgTable("communication_templates", {



  id: serial("id").primaryKey(),



  key: varchar("key", { length: 100 }).notNull().unique(), // e.g. RISK_RAISED



  name: varchar("name", { length: 255 }).notNull(),



  subjectTemplate: varchar("subject_template", { length: 500 }).notNull(),



  bodyTemplate: text("body_template").notNull(), // HTML/Markdown with {{variables}}



  category: varchar("category", { length: 50 }).default("general"), // alert, digest, report, onboarding



  tags: json("tags").$type<string[]>(),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type CommunicationTemplate = typeof communicationTemplates.$inferSelect;



export type InsertCommunicationTemplate = typeof communicationTemplates.$inferInsert;







export const emailMessages = pgTable("email_messages", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(), // FK to clients (not enforced via FK constraint in simple setup, but logical)



  userId: integer("user_id"), // Author/Sender (System = null or 0)







  // Organization



  folder: varchar("folder", { length: 20 }).default("inbox"), // inbox, drafts, sent, archive, trash



  status: varchar("status", { length: 20 }).default("draft"), // draft, scheduled, sending, sent, failed







  // Content



  subject: varchar("subject", { length: 500 }),



  body: text("body"), // HTML content



  snippet: varchar("snippet", { length: 255 }), // Preview text







  // Recipients



  from: varchar("from", { length: 255 }), // e.g. "Compliance Team <compliance@example.com>"



  to: json("to").$type<string[]>(),



  cc: json("cc").$type<string[]>(),



  bcc: json("bcc").$type<string[]>(),







  // Flags



  isRead: boolean("is_read").default(false),



  isStarred: boolean("is_starred").default(false),







  // Meta



  metadata: json("metadata"), // { entityType: 'risk', entityId: 123, templateKey: 'RISK_RAISED' }



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



  sentAt: timestamp("sent_at"),



});







export type EmailMessage = typeof emailMessages.$inferSelect;



export type InsertEmailMessage = typeof emailMessages.$inferInsert;







export const orgRoles = pgTable("org_roles", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),



  description: text("description"), // Summary



  responsibilities: text("responsibilities"), // Detailed Markdown



  department: varchar("department", { length: 255 }),



  reportingRoleId: integer("reporting_role_id"), // FK to self for hierarchy



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type OrgRole = typeof orgRoles.$inferSelect;



export type InsertOrgRole = typeof orgRoles.$inferInsert;







export const employees = pgTable("employees", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  firstName: varchar("first_name", { length: 255 }).notNull(),



  lastName: varchar("last_name", { length: 255 }).notNull(),



  email: varchar("email", { length: 255 }).notNull(),



  jobTitle: varchar("job_title", { length: 255 }),



  department: varchar("department", { length: 255 }),



  role: varchar("role", { length: 255 }), // Keeping for fallback/legacy



  orgRoleId: integer("org_role_id"), // Link to structured role



  managerId: integer("manager_id"), // Link to manager (another employee)



  employmentStatus: varchar("employment_status", { length: 50 }),



  startDate: timestamp("start_date"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type Employee = typeof employees.$inferSelect;



export type InsertEmployee = typeof employees.$inferInsert;







export const employeeTaskAssignments = pgTable("employee_task_assignments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  employeeId: integer("employee_id").notNull(),



  taskType: taskTypeEnum("task_type").notNull(),



  taskId: integer("task_id").notNull(),



  raciRole: raciRoleEnum("raci_role").notNull(),



  notes: text("notes"),



  dueDate: timestamp("due_date"),



  assignedAt: timestamp("assigned_at").defaultNow().notNull(),



  assignedBy: integer("assigned_by"),



  updatedAt: timestamp("updated_at").defaultNow().notNull(),



});







export type EmployeeTaskAssignment = typeof employeeTaskAssignments.$inferSelect;



export type InsertEmployeeTaskAssignment = typeof employeeTaskAssignments.$inferInsert;







export const policyVersions = pgTable("policy_versions", {



  id: serial("id").primaryKey(),



  clientPolicyId: integer("client_policy_id").notNull(),



  version: varchar("version", { length: 50 }).notNull(), // "1.0", "1.1"



  content: text("content"), // Snapshot



  status: varchar("status", { length: 50 }), // 'approved', 'archived'



  description: text("description"), // Change log / Release notes



  publishedBy: integer("published_by"), // User ID



  createdAt: timestamp("created_at").defaultNow(),



});







export type PolicyVersion = typeof policyVersions.$inferSelect;



export type InsertPolicyVersion = typeof policyVersions.$inferInsert;







export const llmProviders = pgTable("llm_providers", {



  id: serial("id").primaryKey(),



  name: varchar("name", { length: 255 }).notNull(), // e.g., "Company OpenAI"



  provider: varchar("provider", { length: 50 }).notNull(), // "openai", "anthropic", "gemini", "deepseek", "qwen", "custom"



  model: varchar("model", { length: 100 }).notNull(), // "gpt-4", "deepseek-coder", "qwen-72b"



  apiKey: text("api_key").notNull(), // Stores ENCRYPTED string



  baseUrl: varchar("base_url", { length: 512 }), // Optional: For OpenRouter, vLLM, or specific provider endpoints



  priority: integer("priority").default(0), // Higher number = Higher priority



  isEnabled: boolean("is_enabled").default(false),



  supportsEmbeddings: boolean("supports_embeddings").default(false),



  createdAt: timestamp("created_at").defaultNow(),



});







export type LLMProvider = typeof llmProviders.$inferSelect;



export type InsertLLMProvider = typeof llmProviders.$inferInsert;



export const llmRouterRules = pgTable("llm_router_rules", {

  id: serial("id").primaryKey(),

  feature: varchar("feature", { length: 100 }).notNull().unique(), // e.g., 'risk_analysis', 'policy_generation'

  providerId: integer("provider_id").references(() => llmProviders.id, { onDelete: 'set null' }),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type LLMRouterRule = typeof llmRouterRules.$inferSelect;

export type InsertLLMRouterRule = typeof llmRouterRules.$inferInsert;







export const auditLogs = pgTable("audit_logs", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id"), // Can be null for system events



  userId: integer("user_id").notNull(),



  action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'delete', 'publish'



  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'policy', 'control', 'client'



  entityId: integer("entity_id"),



  details: json("details"), // Changed fields, snapshots



  severity: varchar("severity", { length: 20 }).default("info"), // 'info', 'warning', 'critical'



  ipAddress: varchar("ip_address", { length: 45 }),



  userAgent: text("user_agent"),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientTimeIdx: index("idx_al_client_time").on(table.clientId, table.createdAt),



  };



});







export type AuditLog = typeof auditLogs.$inferSelect;



export type InsertAuditLog = typeof auditLogs.$inferInsert;







// controlMappings table is defined earlier in the file (Cross-Framework Control Harmonization section)







export const crmEngagements = pgTable("crm_engagements", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(), // e.g., "SOC 2 Type II 2024"



  stage: crmEngagementStageEnum("stage").default("planned"),



  framework: varchar("framework", { length: 100 }), // e.g., "SOC 2"



  priority: varchar("priority", { length: 50 }).default("medium"),



  targetDate: timestamp("target_date"),



  progress: integer("progress").default(0), // 0-100



  owner: varchar("owner", { length: 255 }),



  // Compliance Metrics



  controlsCount: integer("controls_count").default(0),



  mitigatedRisksCount: integer("mitigated_risks_count").default(0),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type CrmEngagement = typeof crmEngagements.$inferSelect;



export type InsertCrmEngagement = typeof crmEngagements.$inferInsert;







export const comments = pgTable("comments", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  userId: integer("user_id").notNull(),

  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'process', 'bia', 'plan', 'strategy', 'control', 'policy', 'evidence'

  entityId: integer("entity_id").notNull(),

  content: text("content").notNull(),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {
  return {
    entityIdx: index("idx_comments_entity").on(table.entityType, table.entityId),
    clientIdx: index("idx_comments_client").on(table.clientId),
  };
});







export type Comment = typeof comments.$inferSelect;



export type InsertComment = typeof comments.$inferInsert;







// User Invitations



export const userInvitations = pgTable("user_invitations", {



  id: serial("id").primaryKey(),



  email: varchar("email", { length: 255 }).notNull(),



  role: varchar("role", { length: 50 }).notNull().default("viewer"),



  clientId: integer("client_id"),



  invitedBy: integer("invited_by").notNull(),



  status: varchar("status", { length: 50 }).default("pending"), // pending, accepted, expired



  token: varchar("token", { length: 255 }).notNull().unique(),



  expiresAt: timestamp("expires_at").notNull(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type UserInvitation = typeof userInvitations.$inferSelect;



export type InsertUserInvitation = typeof userInvitations.$inferInsert;







export const regulationMappings = pgTable("regulation_mappings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  regulationId: varchar("regulation_id", { length: 50 }).notNull(), // e.g. "nis2"



  articleId: varchar("article_id", { length: 50 }).notNull(), // e.g. "nis2-art-21-2-a"



  mappedType: varchar("mapped_type", { length: 50 }).notNull(), // 'policy', 'evidence'



  mappedId: integer("mapped_id").notNull(), // ID of the policy or evidence



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientRegArtIdx: index("idx_rm_client_reg_art").on(table.clientId, table.regulationId, table.articleId),



  };



});







export type RegulationMapping = typeof regulationMappings.$inferSelect;



export type InsertRegulationMapping = typeof regulationMappings.$inferInsert;







export const clientReadinessResponses = pgTable("client_readiness_responses", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  regulationId: varchar("regulation_id", { length: 50 }).notNull(),



  questionId: varchar("question_id", { length: 50 }).notNull(),



  response: varchar("response", { length: 50 }), // 'yes', 'no', '1'-'5'



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type ClientReadinessResponse = typeof clientReadinessResponses.$inferSelect;



export type InsertClientReadinessResponse = typeof clientReadinessResponses.$inferInsert;







// Phase 5: Cloud Integrations



export const cloudProviderEnum = pgEnum("cloud_provider", ["aws", "azure", "gcp"]);







export const cloudConnections = pgTable("cloud_connections", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  provider: varchar("provider", { length: 50 }).notNull(), // aws, azure, gcp



  name: varchar("name", { length: 255 }).notNull(),



  credentials: text("credentials").notNull(), // Encrypted JSON with access keys



  region: varchar("region", { length: 100 }),



  status: varchar("status", { length: 50 }).default("pending"), // pending, connected, error



  lastSyncAt: timestamp("last_sync_at"),



  errorMessage: text("error_message"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type CloudConnection = typeof cloudConnections.$inferSelect;



export type InsertCloudConnection = typeof cloudConnections.$inferInsert;







export const cloudAssets = pgTable("cloud_assets", {



  id: serial("id").primaryKey(),



  connectionId: integer("connection_id").notNull(),



  clientId: integer("client_id").notNull(),



  assetType: varchar("asset_type", { length: 100 }).notNull(), // ec2, s3, iam_user, vm, storage_account, etc.



  assetId: varchar("asset_id", { length: 255 }).notNull(), // Provider's asset ID



  name: varchar("name", { length: 255 }),



  region: varchar("region", { length: 100 }),



  metadata: json("metadata"), // Additional provider-specific details



  complianceStatus: varchar("compliance_status", { length: 50 }).default("unknown"), // compliant, non_compliant, unknown



  lastScannedAt: timestamp("last_scanned_at"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type CloudAsset = typeof cloudAssets.$inferSelect;



export type InsertCloudAsset = typeof cloudAssets.$inferInsert;







// Phase 5: Issue Tracker Integrations



export const issueTrackerConnections = pgTable("issue_tracker_connections", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  provider: varchar("provider", { length: 50 }).notNull(), // jira, linear



  name: varchar("name", { length: 255 }).notNull(),



  baseUrl: varchar("base_url", { length: 1024 }), // For Jira self-hosted



  credentials: text("credentials").notNull(), // Encrypted: API token, OAuth tokens



  projectKey: varchar("project_key", { length: 100 }), // Default project for syncing



  status: varchar("status", { length: 50 }).default("pending"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type IssueTrackerConnection = typeof issueTrackerConnections.$inferSelect;



export type InsertIssueTrackerConnection = typeof issueTrackerConnections.$inferInsert;







export const remediationTasks = pgTable("remediation_tasks", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  clientControlId: integer("client_control_id"), // Link to control if applicable



  title: varchar("title", { length: 500 }).notNull(),



  description: text("description"),



  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, critical



  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, resolved, closed



  dueDate: timestamp("due_date"),



  assigneeId: integer("assignee_id"), // Link to employee



  // External sync



  issueTrackerConnectionId: integer("issue_tracker_connection_id"),



  externalIssueId: varchar("external_issue_id", { length: 255 }), // Jira issue key or Linear ID



  externalIssueUrl: varchar("external_issue_url", { length: 1024 }),



  lastSyncedAt: timestamp("last_synced_at"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_rt_client_status").on(table.clientId, table.status),

    assigneeIdx: index("idx_rt_assignee").on(table.assigneeId),

  };

});







export type RemediationTask = typeof remediationTasks.$inferSelect;



export type InsertRemediationTask = typeof remediationTasks.$inferInsert;







// Policy Review Feature



export const policyReviews = pgTable("policy_reviews", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  policyReviewId: varchar("policy_review_id", { length: 50 }).notNull().unique(),



  policyName: varchar("policy_name", { length: 500 }).notNull(),



  policyContent: text("policy_content").notNull(),



  selectedRequirements: json("selected_requirements").$type<string[]>(), // ["SOC2", "GDPR", "EU", "ISO27001"]



  status: policyReviewStatusEnum("status").default("analyzing"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type PolicyReview = typeof policyReviews.$inferSelect;



export type InsertPolicyReview = typeof policyReviews.$inferInsert;







export const policyReviewResults = pgTable("policy_review_results", {



  id: serial("id").primaryKey(),



  policyReviewId: integer("policy_review_id").notNull(),



  overallScore: integer("overall_score"), // 0-100



  gaps: json("gaps").$type<{ requirement: string, issue: string, severity: string }[]>(),



  compliance: json("compliance").$type<{ requirement: string, status: string, details: string }[]>(),



  recommendations: json("recommendations").$type<{ section: string, current: string, improved: string, reasoning: string }[]>(),



  improvedPolicyContent: text("improved_policy_content"), // Full improved version



  aiProvider: varchar("ai_provider", { length: 100 }),



  aiModel: varchar("ai_model", { length: 100 }),



  createdAt: timestamp("created_at").defaultNow(),



});







export type PolicyReviewResult = typeof policyReviewResults.$inferSelect;



export type InsertPolicyReviewResult = typeof policyReviewResults.$inferInsert;







// Features/Remediation Roadmap



export const remediationPlans = pgTable("remediation_plans", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(), // e.g., "ISO 27001 Remediation Q1-Q2"



  status: varchar("status", { length: 50 }).default("draft"), // draft, active, completed, archived



  startDate: timestamp("start_date").defaultNow(),



  targetDate: timestamp("target_date"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type RemediationPlan = typeof remediationPlans.$inferSelect;



export type InsertRemediationPlan = typeof remediationPlans.$inferInsert;







export const roadmapItems = pgTable("roadmap_items", {



  id: serial("id").primaryKey(),



  planId: integer("plan_id").notNull(), // FK to remediation_plans



  controlId: varchar("control_id", { length: 100 }), // Optional link to control



  gapResponseId: integer("gap_response_id"), // Optional link to specific gap



  title: varchar("title", { length: 500 }).notNull(),



  description: text("description"),



  phase: integer("phase").default(1), // 1, 2, 3...



  order: integer("order").default(0), // Ordering within phase



  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, done



  ownerRole: varchar("owner_role", { length: 255 }), // Suggested role e.g. "CISO"



  assigneeId: integer("assignee_id"), // Actual user



  estimatedDuration: integer("estimated_duration"), // In days



  actualStartDate: timestamp("actual_start_date"),



  actualEndDate: timestamp("actual_end_date"),



  dependencies: json("dependencies").$type<number[]>(), // IDs of prerequisite roadmap_items



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    planPhaseIdx: index("idx_ri_plan_phase").on(table.planId, table.phase),



  };



});







export type RoadmapItem = typeof roadmapItems.$inferSelect;



export type InsertRoadmapItem = typeof roadmapItems.$inferInsert;











// Phase 3: BYOF (Bring Your Own Framework)



export const clientFrameworks = pgTable("client_frameworks", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  version: varchar("version", { length: 50 }),



  sourceFileName: varchar("source_file_name", { length: 255 }),



  importedAt: timestamp("imported_at").defaultNow(),



  status: varchar("status", { length: 50 }).default("active"),



});







export type ClientFramework = typeof clientFrameworks.$inferSelect;



export type InsertClientFramework = typeof clientFrameworks.$inferInsert;







export const clientFrameworkControls = pgTable("client_framework_controls", {



  id: serial("id").primaryKey(),



  frameworkId: integer("framework_id").notNull(),



  controlCode: varchar("control_code", { length: 100 }).notNull(),



  title: text("title").notNull(),



  description: text("description"),



  grouping: varchar("grouping", { length: 255 }),



  originalData: json("original_data"), // Stores extra fields flexible to the imported file



  // State Tracking (Parity with client_controls)



  status: varchar("status", { length: 50 }).default("not_implemented"), // not_implemented, in_progress, implemented, not_applicable



  applicability: varchar("applicability", { length: 50 }).default("applicable"),



  owner: varchar("owner", { length: 255 }),



  customDescription: text("custom_description"),



  implementationNotes: text("implementation_notes"),



  evidenceLocation: text("evidence_location"),



  justification: text("justification"),



  implementationDate: timestamp("implementation_date"),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    frameworkIdx: index("idx_cfc_framework").on(table.frameworkId),



  };



});







export type ClientFrameworkControl = typeof clientFrameworkControls.$inferSelect;



export type InsertClientFrameworkControl = typeof clientFrameworkControls.$inferInsert;







export const clientFrameworkMappings = pgTable("client_framework_mappings", {



  id: serial("id").primaryKey(),



  frameworkControlId: integer("framework_control_id").notNull(),



  clientControlId: integer("client_control_id").notNull(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    fwCtrlIdx: index("idx_cfm_fw_ctrl").on(table.frameworkControlId),



    clCtrlIdx: index("idx_cfm_cl_ctrl").on(table.clientControlId),



    // Ensure one framework control is mapped to one client control (optional, but good for "Test Once")



    // allowing multiple mappings is cleaner for edge cases.



    uniqueMapping: index("idx_cfm_unique").on(table.frameworkControlId, table.clientControlId),



  };



});







export type ClientFrameworkMapping = typeof clientFrameworkMappings.$inferSelect;



export type InsertClientFrameworkMapping = typeof clientFrameworkMappings.$inferInsert;







// ==================== AI ADVISOR SYSTEM ====================







// Knowledge Articles for RAG



export const knowledgeArticles = pgTable("knowledge_articles", {



  id: serial("id").primaryKey(),



  title: varchar("title", { length: 500 }).notNull(),



  body: text("body").notNull(),



  tags: json("tags").$type<string[]>(),



  source: varchar("source", { length: 255 }), // 'internal', 'catalog', 'external'



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;



export type InsertKnowledgeArticle = typeof knowledgeArticles.$inferInsert;







// Tech Suggestions from AI



export const techSuggestions = pgTable("tech_suggestions", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  controlId: integer("control_id").notNull(),



  suggestionText: text("suggestion_text").notNull(),



  techId: varchar("tech_id", { length: 100 }),



  vendor: varchar("vendor", { length: 100 }),



  sources: json("sources").$type<{ type: string; id?: string; url?: string; title?: string }[]>(),



  createdBy: varchar("created_by", { length: 50 }).default("ai"),



  createdAt: timestamp("created_at").defaultNow(),



  status: varchar("status", { length: 50 }).default("proposed"), // proposed, accepted, rejected



  feedback: text("feedback"),



  appliedAt: timestamp("applied_at"),



}, (table) => {



  return {



    clientIdIdx: index("idx_ts_client").on(table.clientId),



    controlIdIdx: index("idx_ts_control").on(table.controlId),



  };



});







export type TechSuggestion = typeof techSuggestions.$inferSelect;



export type InsertTechSuggestion = typeof techSuggestions.$inferInsert;







// Control to Technology Mappings (Catalog)



export const controlTechMappings = pgTable("control_tech_mappings", {



  id: serial("id").primaryKey(),



  controlCode: varchar("control_code", { length: 50 }).notNull(),



  framework: varchar("framework", { length: 100 }).notNull(),



  techId: varchar("tech_id", { length: 100 }).notNull(),



  vendor: varchar("vendor", { length: 100 }),



  serviceName: varchar("service_name", { length: 200 }),



  description: text("description"),



  pros: json("pros").$type<string[]>(),



  cons: json("cons").$type<string[]>(),



  implementationEffort: varchar("implementation_effort", { length: 50 }), // 'low', 'medium', 'high'



  maturityLevel: varchar("maturity_level", { length: 50 }), // 'emerging', 'mainstream', 'mature'



  references: json("references").$type<{ url: string; title: string }[]>(),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    controlFrameworkIdx: index("idx_ctm_control_framework").on(table.controlCode, table.framework),



    techIdIdx: index("idx_ctm_tech").on(table.techId),



  };



});







export type ControlTechMapping = typeof controlTechMappings.$inferSelect;



export type InsertControlTechMapping = typeof controlTechMappings.$inferInsert;







// Embeddings for RAG (pgvector ready)



export const embeddings = pgTable("embeddings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id"), // Optional: for client-specific embeddings



  entityType: varchar("entity_type", { length: 50 }), // Added to match DB

  entityId: varchar("entity_id", { length: 100 }), // Added to match DB

  docId: varchar("doc_id", { length: 100 }).notNull(),



  docType: varchar("doc_type", { length: 50 }).notNull(), // 'control', 'policy', 'catalog', 'article', 'evidence', 'vendor', 'knowledge'



  embeddingData: text("embedding_data"), // JSON stringified vector (legacy/fallback)



  embeddingVector: vector("embedding_vector"), // pgvector column (preferred)

  embedding: vector("embedding"), // Added to resolve migration conflict

  content: text("content"), // Original text content for reference



  metadata: json("metadata").$type<Record<string, any>>(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    docTypeIdx: index("idx_emb_doctype").on(table.docType),



    docIdIdx: index("idx_emb_docid").on(table.docId),



    clientIdIdx: index("idx_emb_client").on(table.clientId),



  };



});







export type Embedding = typeof embeddings.$inferSelect;



export type InsertEmbedding = typeof embeddings.$inferInsert;





// AI Usage Metrics for tracking token consumption and costs



export const aiUsageMetrics = pgTable("ai_usage_metrics", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id"),



  userId: integer("user_id"),



  entityType: varchar("entity_type", { length: 50 }),

  entityId: integer("entity_id"),



  endpoint: varchar("endpoint", { length: 255 }).notNull(), // e.g., 'suggestTechnologies', 'askQuestion'



  provider: varchar("provider", { length: 50 }).notNull(), // 'openai', 'anthropic', 'gemini'



  model: varchar("model", { length: 100 }).notNull(), // e.g., 'gpt-4', 'claude-3-opus'



  promptTokens: integer("prompt_tokens").notNull().default(0),



  completionTokens: integer("completion_tokens").notNull().default(0),



  totalTokens: integer("total_tokens").notNull().default(0),



  estimatedCostCents: integer("estimated_cost_cents").notNull().default(0), // Cost in cents



  latencyMs: integer("latency_ms"), // Request latency in milliseconds



  success: boolean("success").default(true),



  errorMessage: text("error_message"),



  requestMetadata: json("request_metadata").$type<Record<string, any>>(), // Additional context



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIdIdx: index("idx_ai_usage_client").on(table.clientId),



    providerIdx: index("idx_ai_usage_provider").on(table.provider),



    endpointIdx: index("idx_ai_usage_endpoint").on(table.endpoint),



    createdAtIdx: index("idx_ai_usage_created").on(table.createdAt),



  };



});







export type AIUsageMetric = typeof aiUsageMetrics.$inferSelect;



export type InsertAIUsageMetric = typeof aiUsageMetrics.$inferInsert;







// AI Advisor Conversations



export const advisorConversations = pgTable("advisor_conversations", {



  id: serial("id").primaryKey(),



  userId: integer("user_id").notNull(),



  clientId: integer("client_id"),



  conversationId: varchar("conversation_id", { length: 100 }).notNull().unique(),



  title: varchar("title", { length: 500 }),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type AdvisorConversation = typeof advisorConversations.$inferSelect;



export type InsertAdvisorConversation = typeof advisorConversations.$inferInsert;







// AI Advisor Messages



export const advisorMessages = pgTable("advisor_messages", {



  id: serial("id").primaryKey(),



  conversationId: varchar("conversation_id", { length: 100 }).notNull(),



  role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant'



  content: text("content").notNull(),



  sources: json("sources").$type<{ type: string; id?: string; url?: string; title?: string }[]>(),



  metadata: json("metadata").$type<{ model?: string; provider?: string; tokens?: number }>(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    conversationIdx: index("idx_am_conversation").on(table.conversationId),



  };



});







export type AdvisorMessage = typeof advisorMessages.$inferSelect;



export type InsertAdvisorMessage = typeof advisorMessages.$inferInsert;







// ==================== RISK MANAGEMENT MODULE ====================







export const assetStatusEnum = pgEnum("asset_status", ["active", "archived", "disposed"]);







// 1. Assets (The things we protect) - ISO 27005



export const assets = pgTable("assets", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  type: varchar("type", { length: 100 }).notNull(), // Hardware, Software, Information, People, Service, Reputation



  owner: varchar("owner", { length: 255 }),







  // Technical Identifiers (for NVD/CVE matching)



  vendor: varchar("vendor", { length: 255 }), // e.g., "Microsoft", "Apache", "Oracle"



  productName: varchar("product_name", { length: 255 }), // e.g., "SQL Server", "Tomcat", "MySQL"



  version: varchar("version", { length: 100 }), // e.g., "2019", "9.0.50", "8.0.32"



  technologies: json("technologies").$type<string[]>(), // e.g., ["nodejs", "postgresql", "docker"]







  // CIA Valuation (1-5 Scale)



  valuationC: integer("valuation_c").default(3), // Confidentiality



  valuationI: integer("valuation_i").default(3), // Integrity



  valuationA: integer("valuation_a").default(3), // Availability







  description: text("description"),



  location: varchar("location", { length: 255 }),



  department: varchar("department", { length: 255 }),







  // New columns



  status: assetStatusEnum("status").default("active"),



  acquisitionDate: timestamp("acquisition_date"),



  lastReviewDate: timestamp("last_review_date"),



  // Additional columns required by router

  category: varchar("category", { length: 100 }),

  criticality: varchar("criticality", { length: 50 }),

  ipAddress: varchar("ip_address", { length: 50 }),

  macAddress: varchar("mac_address", { length: 50 }),

  os: varchar("os", { length: 100 }),

  customFields: json("custom_fields"),

  tags: json("tags").$type<string[]>().default([]),



  // Privacy / Data Inventory Extension

  isPersonalData: boolean("is_personal_data").default(false),

  dataSensitivity: varchar("data_sensitivity", { length: 50 }), // Public, Internal, Confidential, Restricted

  dataFormat: varchar("data_format", { length: 50 }), // Digital, Physical

  dataOwner: varchar("data_owner", { length: 255 }), // Specific Data Owner if different from Asset Owner







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type Asset = typeof assets.$inferSelect;



export type InsertAsset = typeof assets.$inferInsert;







// 2. Risk Scenarios (The Risk Register)



export const riskScenarios = pgTable("risk_scenarios", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),







  // Flexible Risk Scope (Polymorphic)



  assessmentType: varchar("assessment_type", { length: 50 }).notNull().default('asset'), // 'asset', 'process', 'vendor', 'scenario'



  assetId: integer("asset_id"), // Linked Asset (if asset-based)



  processId: varchar("process_id", { length: 100 }), // Linked Business Process (if process-based)



  vendorId: integer("vendor_id"), // Linked Vendor (if vendor-based)

  devProjectId: integer("dev_project_id"), // Linked Dev Project
  threatModelId: integer("threat_model_id"), // Linked Threat Model







  // Linked Context (New)



  threatId: integer("threat_id"), // FK to threats



  vulnerabilityId: integer("vulnerability_id"), // FK to vulnerabilities







  // The "What can go wrong"



  title: varchar("title", { length: 500 }).notNull(), // Short risk name



  description: text("description"),







  // Threat & Vulnerability (ISO 27005 Model)



  threatCategory: varchar("threat_category", { length: 100 }), // e.g., "Theft", "Natural Disaster"



  vulnerability: varchar("vulnerability", { length: 255 }), // e.g., "Lack of Encryption"







  // Link to Gap Analysis



  gapResponseId: integer("gap_response_id"),







  // Scoring (5x5 Matrix)



  likelihood: integer("likelihood").default(1), // 1-5
  impact: integer("impact").default(1), // 1-5
  inherentScore: integer("inherent_score"), // Likelihood * Impact
  inherentRisk: varchar("inherent_risk", { length: 50 }),
  residualLikelihood: integer("residual_likelihood"),
  residualImpact: integer("residual_impact"),
  residualScore: integer("residual_score"),
  residualRisk: varchar("residual_risk", { length: 50 }),







  inherentRiskScore: integer("inherent_risk_score"), // Likelihood * Impact (Calculated in app)







  // Status



  status: varchar("status", { length: 50 }).default("identified"), // identified, analyzed, treated, monitored



  owner: varchar("owner", { length: 255 }),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientRiskIdx: index("idx_rs_client").on(table.clientId),



    clientStatusIdx: index("idx_rs_client_status").on(table.clientId, table.status),



  };



});







export type RiskScenario = typeof riskScenarios.$inferSelect;



export type InsertRiskScenario = typeof riskScenarios.$inferInsert;







// 3. Risk Framework Settings (Scope, Context, Appetite)



export const riskSettings = pgTable("risk_settings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  scope: text("scope"),



  context: text("context"),



  riskAppetite: text("risk_appetite"),



  riskTolerance: json("risk_tolerance").$type<{ category: string, threshold: string, unit: string }[]>(),



  methodology: varchar("methodology", { length: 255 }).default("ISO 27005"),



  impactCriteria: json("impact_criteria").$type<{ level: number, name: string, description: string }[]>(),



  likelihoodCriteria: json("likelihood_criteria").$type<{ level: number, name: string, description: string }[]>(),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientSettingsIdx: index("idx_rsettings_client").on(table.clientId),



  };



});







export type RiskSettings = typeof riskSettings.$inferSelect;



export type InsertRiskSettings = typeof riskSettings.$inferInsert;







// 4. Risk Assessments (Periodic Reviews) - Enhanced for comprehensive tracking



export const riskTreatments = pgTable("risk_treatments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id"), // For direct client access



  riskScenarioId: integer("risk_scenario_id"), // Link to risk scenarios (optional)



  riskAssessmentId: integer("risk_assessment_id"), // Link to risk assessments (optional)







  // Strategy



  treatmentType: varchar("treatment_type", { length: 50 }).notNull().default("mitigate"), // mitigate, avoid, transfer, accept



  strategy: text("strategy"), // Detailed description of treatment strategy



  justification: text("justification"), // Required for 'accept' type







  // Link to Controls (The "How do we fix it")



  controlId: integer("control_id"), // Single control link (legacy support)







  // Implementation Tracking



  status: varchar("status", { length: 50 }).default("planned"), // planned, in_progress, implemented, verified



  dueDate: timestamp("due_date"),



  implementationDate: timestamp("implementation_date"),



  owner: varchar("owner", { length: 255 }),







  // Priority & Cost



  priority: varchar("priority", { length: 50 }), // critical, high, medium, low



  estimatedCost: varchar("estimated_cost", { length: 100 }), // Simple string for flexibility







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    scenarioIdx: index("idx_treatment_scenario").on(table.riskScenarioId),



    assessmentIdx: index("idx_treatment_assessment").on(table.riskAssessmentId),



  };



});







export type RiskTreatment = typeof riskTreatments.$inferSelect;



export type InsertRiskTreatment = typeof riskTreatments.$inferInsert;







// Many-to-Many: Treatments can have multiple Controls



export const treatmentControls = pgTable("treatment_controls", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull().default(0), // Default 0 for migration, should be required

  treatmentId: integer("treatment_id").notNull(),

  controlId: integer("control_id").notNull(),

  effectiveness: varchar("effectiveness", { length: 50 }), // effective, partially_effective, ineffective

  implementationNotes: text("implementation_notes"),

  notes: text("notes"), // Added for consistency with plan if needed, or alias implementationNotes

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    treatmentIdx: index("idx_tc_treatment").on(table.treatmentId),



    controlIdx: index("idx_tc_control").on(table.controlId),



  };



});







export type TreatmentControl = typeof treatmentControls.$inferSelect;



export type InsertTreatmentControl = typeof treatmentControls.$inferInsert;







// 5. Key Risk Indicators (KRIs)



export const kris = pgTable("kris", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  status: varchar("status", { length: 50 }).default("active"), // active, archived







  // Threshold definitions



  thresholdGreen: text("threshold_green"), // e.g., "< 7 days"



  thresholdAmber: text("threshold_amber"), // e.g., "7-30 days"



  thresholdRed: text("threshold_red"),     // e.g., "> 30 days"







  // Current State



  currentValue: text("current_value"),



  currentStatus: varchar("current_status", { length: 50 }).default("green"), // green, amber, red







  owner: varchar("owner", { length: 255 }),



  lastUpdated: timestamp("last_updated").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientKriIdx: index("idx_kri_client").on(table.clientId),



  };



});







export type KRI = typeof kris.$inferSelect;



export type InsertKRI = typeof kris.$inferInsert;







// ==================== CRM MODULE ====================







export const crmContacts = pgTable("crm_contacts", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  firstName: varchar("first_name", { length: 255 }).notNull(),



  lastName: varchar("last_name", { length: 255 }).notNull(),



  email: varchar("email", { length: 255 }),



  phone: varchar("phone", { length: 50 }),



  jobTitle: varchar("job_title", { length: 255 }),



  // CRM Specifics



  isPrimary: boolean("is_primary").default(false),



  category: varchar("category", { length: 50 }), // billing, technical, executive, champion



  linkedInUrl: varchar("linkedin_url", { length: 1024 }),



  notes: text("notes"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIdx: index("idx_crm_contact_client").on(table.clientId),



    emailIdx: index("idx_crm_contact_email").on(table.email),



  };



});







export type CrmContact = typeof crmContacts.$inferSelect;



export type InsertCrmContact = typeof crmContacts.$inferInsert;







export const crmActivities = pgTable("crm_activities", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  userId: integer("user_id").notNull(), // Performed by







  type: varchar("type", { length: 50 }).notNull(), // email, call, meeting, note, task



  subject: varchar("subject", { length: 500 }),



  content: text("content"),



  outcome: varchar("outcome", { length: 255 }), // e.g. "Scheduled demo", "Left voicemail"







  occurredAt: timestamp("occurred_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIdx: index("idx_crm_activity_client").on(table.clientId),



    occurredIdx: index("idx_crm_activity_date").on(table.occurredAt),



  };



});







export type CrmActivity = typeof crmActivities.$inferSelect;



export type InsertCrmActivity = typeof crmActivities.$inferInsert;















export const vulnerabilityStatusEnum = pgEnum("vulnerability_status", ["open", "mitigated", "accepted", "remediated"]);







export const vulnerabilities = pgTable("vulnerabilities", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  vulnerabilityId: varchar("vulnerability_id", { length: 50 }).notNull(), // e.g. VULN-2024-001



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  cveId: varchar("cve_id", { length: 50 }),



  cvssScore: integer("cvss_score"), // Store as x10 (e.g. 7.5 -> 75) to avoid float issues



  severity: varchar("severity", { length: 50 }), // Critical, High, Medium, Low







  // Scope



  affectedAssets: json("affected_assets").$type<string[]>(), // Array of Asset IDs or Names







  // Discovery



  discoveryDate: timestamp("discovery_date"),



  source: varchar("source", { length: 100 }), // Scanner, Manual, Vendor







  // Technical Details



  exploitability: varchar("exploitability", { length: 255 }), // DoS, RCE, etc.



  impact: varchar("impact", { length: 255 }), // CIA Impact







  // Management



  status: vulnerabilityStatusEnum("status").default("open"),



  owner: varchar("owner", { length: 255 }),



  remediationPlan: text("remediation_plan"),



  dueDate: timestamp("due_date"),



  lastReviewDate: timestamp("last_review_date"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientVulnIdx: index("idx_vuln_client").on(table.clientId),







    clientStatusIdx: index("idx_vuln_client_status").on(table.clientId, table.status),



  };



});







export type Vulnerability = typeof vulnerabilities.$inferSelect;



export type InsertVulnerability = typeof vulnerabilities.$inferInsert;







export const threatStatusEnum = pgEnum("threat_status", ["active", "dormant", "monitored"]);







export const threats = pgTable("threats", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  threatId: varchar("threat_id", { length: 50 }).notNull(), // e.g. T-2024-001



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),







  // Classification



  category: varchar("category", { length: 100 }), // Natural, Human, Environmental, Technical



  source: varchar("source", { length: 100 }), // Internal, External, Hacker, Insider, Nature



  intent: varchar("intent", { length: 50 }), // Accidental, Deliberate







  // Risk Analysis



  likelihood: varchar("likelihood", { length: 50 }), // Rare, Unlikely, Possible, Likely, Almost Certain



  potentialImpact: text("potential_impact"), // Description of impact if realized







  // Scope & Relations



  affectedAssets: json("affected_assets").$type<string[]>(), // Array of Asset IDs/Names



  relatedVulnerabilities: json("related_vulnerabilities").$type<string[]>(), // Array of Vuln IDs



  associatedRisks: json("associated_risks").$type<string[]>(), // Array of Risk IDs







  // Details



  scenario: text("scenario"), // Threat Scenario/Example



  detectionMethod: text("detection_method"),







  // Management



  status: threatStatusEnum("status").default("active"),



  owner: varchar("owner", { length: 255 }),



  lastReviewDate: timestamp("last_review_date"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientThreatIdx: index("idx_threat_client").on(table.clientId),



    clientStatusIdx: index("idx_threat_client_status").on(table.clientId, table.status),



  };



});







export type Threat = typeof threats.$inferSelect;



export type InsertThreat = typeof threats.$inferInsert;







export const riskAssessmentStatusEnum = pgEnum("risk_assessment_status", ["draft", "approved", "reviewed"]);







export const riskAssessments = pgTable("risk_assessments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  assessmentId: varchar("assessment_id", { length: 50 }).notNull(), // e.g. RA-2024-001



  title: varchar("title", { length: 255 }), // User-friendly name



  riskId: integer("risk_id"), // Linked Risk Scenario ID







  // Assessment Details



  assessmentDate: timestamp("assessment_date"),



  assessor: varchar("assessor", { length: 255 }),



  method: varchar("method", { length: 100 }), // Qualitative, Quantitative







  // Context



  threatId: integer("threat_id"), // FK to threats table



  threatDescription: text("threat_description"),



  vulnerabilityId: integer("vulnerability_id"), // FK to vulnerabilities table



  vulnerabilityDescription: text("vulnerability_description"),



  affectedAssets: json("affected_assets").$type<string[]>(),



  affectedProcessIds: json("affected_process_ids").$type<number[]>(),



  contextSnapshot: json("context_snapshot"), // Snapshots of description, controls, etc.



  gapResponseId: integer("gap_response_id"),







  // Analysis (Pre-Control)



  likelihood: varchar("likelihood", { length: 50 }),



  impact: varchar("impact", { length: 50 }),



  inherentRisk: varchar("inherent_risk", { length: 50 }), // High, Medium, Low

  inherentScore: integer("inherent_score"), // 1-25







  // Controls



  existingControls: text("existing_controls"),



  controlIds: json("control_ids").$type<number[]>(), // Linked Controls from Dictionary



  controlEffectiveness: varchar("control_effectiveness", { length: 50 }), // Effective, Partially, Ineffective







  // Evaluation (Post-Control)



  residualRisk: varchar("residual_risk", { length: 50 }),

  residualScore: integer("residual_score"), // 1-25









  // Treatment



  riskOwner: varchar("risk_owner", { length: 255 }),



  treatmentOption: varchar("treatment_option", { length: 50 }), // Avoid, Mitigate, Transfer, Accept



  recommendedActions: text("recommended_actions"),



  priority: varchar("priority", { length: 50 }),



  targetResidualRisk: varchar("target_residual_risk", { length: 50 }),







  // Review



  reviewDueDate: timestamp("review_due_date"),



  status: riskAssessmentStatusEnum("status").default("draft"),



  notes: text("notes"),



  nextReviewDate: timestamp("next_review_date"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientRaIdx: index("idx_ra_client").on(table.clientId),



    riskIdIdx: index("idx_ra_risk").on(table.riskId),

    statusIdx: index("idx_ra_status").on(table.status),

    nextReviewDateIdx: index("idx_ra_next_review").on(table.nextReviewDate),

    clientStatusIdx: index("idx_ra_client_status").on(table.clientId, table.status),

  };



});







export type RiskAssessment = typeof riskAssessments.$inferSelect;



export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;











export const riskPolicyMappings = pgTable("risk_policy_mappings", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  riskAssessmentId: integer("risk_assessment_id").notNull(),



  clientPolicyId: integer("client_policy_id").notNull(),



  notes: text("notes"),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientPolicyIdx: index("idx_rpm_policy").on(table.clientPolicyId),



    riskAssessmentIdx: index("idx_rpm_risk").on(table.riskAssessmentId),



    uniqueMapping: index("idx_rpm_unique").on(table.riskAssessmentId, table.clientPolicyId),



  };



});







export type RiskPolicyMapping = typeof riskPolicyMappings.$inferSelect;



export type InsertRiskPolicyMapping = typeof riskPolicyMappings.$inferInsert;











// ==================== THREAT INTELLIGENCE MODULE ====================







// NVD CVE Cache - Stores fetched CVE data to reduce API calls



export const nvdCveCache = pgTable("nvd_cve_cache", {



  id: serial("id").primaryKey(),



  cveId: varchar("cve_id", { length: 50 }).notNull().unique(), // e.g. CVE-2024-12345



  cvssScore: varchar("cvss_score", { length: 10 }), // e.g. "9.8"



  cvssVector: varchar("cvss_vector", { length: 255 }),



  cweIds: json("cwe_ids").$type<string[]>(), // e.g. ["CWE-79", "CWE-89"]



  description: text("description"),



  publishedDate: timestamp("published_date"),



  lastModifiedDate: timestamp("last_modified_date"),



  affectedProducts: json("affected_products").$type<string[]>(), // CPE strings



  references: json("references").$type<{ url: string; tags?: string[] }[]>(),



  rawData: json("raw_data"), // Full NVD response for reference



  fetchedAt: timestamp("fetched_at").defaultNow(),



  expiresAt: timestamp("expires_at"), // For cache invalidation



}, (table) => {



  return {



    cveIdIdx: index("idx_nvd_cve_id").on(table.cveId),



  };



});







export type NvdCveCache = typeof nvdCveCache.$inferSelect;



export type InsertNvdCveCache = typeof nvdCveCache.$inferInsert;







// CISA Known Exploited Vulnerabilities (KEV) Cache



export const cisaKevCache = pgTable("cisa_kev_cache", {



  id: serial("id").primaryKey(),



  cveId: varchar("cve_id", { length: 50 }).notNull().unique(),



  vendorProject: varchar("vendor_project", { length: 255 }),



  product: varchar("product", { length: 255 }),



  vulnerabilityName: varchar("vulnerability_name", { length: 500 }),



  shortDescription: text("short_description"),



  requiredAction: text("required_action"),



  dueDate: timestamp("due_date"), // CISA deadline for remediation



  knownRansomwareCampaignUse: boolean("known_ransomware_campaign_use").default(false),



  dateAdded: timestamp("date_added"),



  fetchedAt: timestamp("fetched_at").defaultNow(),



}, (table) => {



  return {



    kevCveIdx: index("idx_kev_cve_id").on(table.cveId),



  };



});







export type CisaKevCache = typeof cisaKevCache.$inferSelect;



export type InsertCisaKevCache = typeof cisaKevCache.$inferInsert;







// Asset to CVE Matches - Links discovered CVEs to assets



export const assetCveMatches = pgTable("asset_cve_matches", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  assetId: integer("asset_id").notNull(),



  cveId: varchar("cve_id", { length: 50 }).notNull(), // e.g. CVE-2024-12345



  matchScore: integer("match_score").default(100), // AI confidence 0-100



  matchReason: text("match_reason"), // Why this CVE was matched



  isKev: boolean("is_kev").default(false), // Is in CISA KEV catalog



  status: varchar("status", { length: 50 }).default("suggested"), // suggested, accepted, dismissed, imported



  importedVulnerabilityId: integer("imported_vulnerability_id"), // FK to vulnerabilities if imported



  discoveredAt: timestamp("discovered_at").defaultNow(),



  reviewedAt: timestamp("reviewed_at"),



  reviewedBy: integer("reviewed_by"), // User ID



}, (table) => {



  return {



    clientAssetIdx: index("idx_acm_client_asset").on(table.clientId, table.assetId),



    cveIdx: index("idx_acm_cve").on(table.cveId),



    statusIdx: index("idx_acm_status").on(table.status),



  };



});







export type AssetCveMatch = typeof assetCveMatches.$inferSelect;



export type InsertAssetCveMatch = typeof assetCveMatches.$inferInsert;







// Threat Intelligence Sync Log - Tracks when data was last synced



export const threatIntelSyncLog = pgTable("threat_intel_sync_log", {



  id: serial("id").primaryKey(),



  source: varchar("source", { length: 50 }).notNull(), // 'nvd', 'cisa_kev'



  syncType: varchar("sync_type", { length: 50 }).notNull(), // 'full', 'incremental', 'asset_scan'



  status: varchar("status", { length: 50 }).default("completed"), // started, completed, failed



  recordsProcessed: integer("records_processed").default(0),



  errorMessage: text("error_message"),



  startedAt: timestamp("started_at").defaultNow(),



  completedAt: timestamp("completed_at"),



});







export type ThreatIntelSyncLog = typeof threatIntelSyncLog.$inferSelect;



export type InsertThreatIntelSyncLog = typeof threatIntelSyncLog.$inferInsert;







// ==================== TPRM MODULE (Vendors) ====================







export const vendors = pgTable("vendors", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  website: varchar("website", { length: 512 }),







  // Risk Profiling



  criticality: varchar("criticality", { length: 50 }).default("Low"), // High, Medium, Low



  dataAccess: varchar("data_access", { length: 50 }).default("Internal"), // Restricted, Confidential, Internal, Public



  miscData: json("misc_data"), // Flexible storage for tags, custom fields



  serviceDescription: text("service_description"),

  // AI Risk Flagging
  usesAi: boolean("uses_ai").default(false),
  isAiService: boolean("is_ai_service").default(false),
  aiDataUsage: text("ai_data_usage"), // e.g., "Inputs used for training", "Zero retention"


  additionalNotes: text("additional_notes"),

  additionalDocuments: json("additional_documents").$type<{ name: string; url: string; date?: string }[]>(),







  // Lifecycle



  status: varchar("status", { length: 50 }).default("Active"), // Onboarding, Active, Offboarding, Offboarded



  ownerId: integer("owner_id"), // Internal employee owner (Business Owner)



  securityOwnerId: integer("security_owner_id"), // Internal security owner







  // Discovery & Classification



  category: varchar("category", { length: 100 }).default("Unassigned"),



  source: varchar("source", { length: 100 }), // e.g. "Google Workspace", "Manual", "Netskope"



  discoveryDate: timestamp("discovery_date"),



  reviewStatus: varchar("review_status", { length: 50 }).default("needs_review"), // needs_review, ignored, active, rejected







  // AI VRM Agent Data



  trustCenterUrl: varchar("trust_center_url", { length: 512 }),



  trustCenterData: json("trust_center_data"), // Stores analyzed docs, gaps, etc.



  trustScore: integer("trust_score"),



  // Advanced GDPR / Subprocessor Fields

  isSubprocessor: boolean("is_subprocessor").default(false),

  dataLocation: varchar("data_location", { length: 255 }), // e.g., "EU/Amsterdam", "US-East-1"

  transferMechanism: varchar("transfer_mechanism", { length: 255 }), // SCCs, DPF, Adequacy, etc.

  recursiveSubprocessors: json("recursive_subprocessors").$type<{ name: string; purpose: string; location: string }[]>(), // Chain of Trust

  dpaAnalysis: json("dpa_analysis").$type<{

    liabilityCap?: string;

    auditRights?: string;

    breachNoticeWindow?: string;

    lastVerified?: string;

  }>(),

  lastTrustCenterChange: timestamp("last_trust_center_change"),











  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientVendorIdx: index("idx_vendor_client").on(table.clientId),



  };



});







export type Vendor = typeof vendors.$inferSelect;

export type InsertVendor = typeof vendors.$inferInsert;



export const vendorChangeLogs = pgTable("vendor_change_logs", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id").notNull(),

  changeType: varchar("change_type", { length: 50 }).notNull(), // 'trust_center_update', 'dpa_signed', 'subprocessor_added'

  description: text("description"),

  oldValue: json("old_value"),

  newValue: json("new_value"),

  detectedAt: timestamp("detected_at").defaultNow(),

}, (table) => {

  return {

    clientVendorIdx: index("idx_vcl_client_vendor").on(table.clientId, table.vendorId),

  };

});



export type VendorChangeLog = typeof vendorChangeLogs.$inferSelect;

export type InsertVendorChangeLog = typeof vendorChangeLogs.$inferInsert;



export const dpaTemplates = pgTable("dpa_templates", {

  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  content: text("content").notNull(), // Markdown or HTML content

  version: integer("version").default(1),

  isDefault: boolean("is_default").default(false),

  jurisdiction: varchar("jurisdiction", { length: 100 }), // e.g. "EU", "US", "Global"

  createdAt: timestamp("created_at").defaultNow(),

});



export type DpaTemplate = typeof dpaTemplates.$inferSelect;

export type InsertDpaTemplate = typeof dpaTemplates.$inferInsert;



export const vendorDpas = pgTable("vendor_dpas", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id").notNull(),

  templateId: integer("template_id"), // Optional: can be custom without template

  name: varchar("name", { length: 255 }).notNull(),

  content: text("content").notNull(), // Generated or custom DPA content

  status: varchar("status", { length: 50 }).default('Draft'), // Draft, Review, Signed, Archived

  version: integer("version").default(1),

  signedAt: timestamp("signed_at"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientVendorIdx: index("idx_vdpa_client_vendor").on(table.clientId, table.vendorId),

  };

});



export type VendorDpa = typeof vendorDpas.$inferSelect;

export type InsertVendorDpa = typeof vendorDpas.$inferInsert;



export const vendorAuthorizations = pgTable("vendor_authorizations", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id").notNull(),

  initiatedBy: integer("initiated_by"), // User ID

  status: varchar("status", { length: 50 }).default("Pending"), // Pending, Notified, Objection_Window, Approved, Rejected

  notificationDate: timestamp("notification_date"),

  objectionDeadline: timestamp("objection_deadline"),

  approvalDate: timestamp("approval_date"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientVendorIdx: index("idx_va_client_vendor").on(table.clientId, table.vendorId),

  };

});



export type VendorAuthorization = typeof vendorAuthorizations.$inferSelect;

export type InsertVendorAuthorization = typeof vendorAuthorizations.$inferInsert;



export const dataFlows = pgTable("process_data_flows", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id"), // Optional link to vendor

  name: varchar("name", { length: 255 }).notNull(),

  source: varchar("source", { length: 255 }),

  destination: varchar("destination", { length: 255 }),

  dataCategory: varchar("data_category", { length: 255 }), // e.g. "PII", "Financial"

  transferMechanism: varchar("transfer_mechanism", { length: 255 }),

  isCrossBorder: boolean("is_cross_border").default(false),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_pdf_client").on(table.clientId),

  };

});



export type DataFlow = typeof dataFlows.$inferSelect;

export type InsertDataFlow = typeof dataFlows.$inferInsert;







export const vendorAssessments = pgTable("vendor_assessments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  vendorId: integer("vendor_id").notNull(),







  type: varchar("type", { length: 100 }), // e.g. "Security Questionnaire", "SOC2 Review"



  status: varchar("status", { length: 50 }).default("Planned"), // Planned, Sent, In Progress, Review, Completed







  // Risk Assessment



  // Inherent Risk (Before Controls)



  inherentImpact: varchar("inherent_impact", { length: 50 }),



  inherentLikelihood: varchar("inherent_likelihood", { length: 50 }),



  inherentRiskLevel: varchar("inherent_risk_level", { length: 50 }),







  // Residual Risk (After Controls/Assessment)



  residualImpact: varchar("residual_impact", { length: 50 }),



  residualLikelihood: varchar("residual_likelihood", { length: 50 }),



  residualRiskLevel: varchar("residual_risk_level", { length: 50 }),







  score: integer("score"), // 0-100 or specific rating



  findings: text("findings"), // Summary of risks found



  documentUrl: varchar("document_url", { length: 1024 }), // Link to stored evidence







  dueDate: timestamp("due_date"),



  completedDate: timestamp("completed_date"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    vendorAssessmentIdx: index("idx_assessment_vendor").on(table.vendorId),
    clientAssessmentIdx: index("idx_assessment_client").on(table.clientId),
  };



});







export type VendorAssessment = typeof vendorAssessments.$inferSelect;



export type InsertVendorAssessment = typeof vendorAssessments.$inferInsert;







export const vendorContacts = pgTable("vendor_contacts", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  vendorId: integer("vendor_id").notNull(),







  name: varchar("name", { length: 255 }).notNull(),



  email: varchar("email", { length: 255 }),



  phone: varchar("phone", { length: 50 }),







  role: varchar("role", { length: 100 }), // e.g. "Account Manager", "Security Lead"



  isPrimary: boolean("is_primary").default(false),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    vendorContactIdx: index("idx_contact_vendor").on(table.vendorId),



  };



});







export type VendorContact = typeof vendorContacts.$inferSelect;



export type InsertVendorContact = typeof vendorContacts.$inferInsert;







export const vendorContracts = pgTable("vendor_contracts", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  vendorId: integer("vendor_id").notNull(),







  title: varchar("title", { length: 255 }).notNull(),



  description: text("description"),







  startDate: timestamp("start_date"),



  endDate: timestamp("end_date"),



  autoRenew: boolean("auto_renew").default(false),







  value: varchar("value", { length: 50 }), // stored as string for flexibility e.g. "$10,000/yr"



  status: varchar("status", { length: 50 }).default('Active'), // Active, Expired, Draft



  documentUrl: text("document_url"),



  // Enhanced Vanta-style fields

  noticePeriod: varchar("notice_period", { length: 50 }), // e.g., "30 days"

  paymentTerms: varchar("payment_terms", { length: 50 }), // e.g., "Net 30"

  slaDetails: text("sla_details"), // e.g., "99.9% uptime"

  dpaStatus: varchar("dpa_status", { length: 50 }).default('Not Signed'), // Signed, Not Signed, Not Required

  owner: varchar("owner", { length: 100 }), // Internal owner name/email



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    vendorContractIdx: index("idx_contract_vendor").on(table.vendorId),



  };



});







export type VendorContract = typeof vendorContracts.$inferSelect;



export type InsertVendorContract = typeof vendorContracts.$inferInsert;



export const vendorRequests = pgTable("vendor_requests", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  requesterId: integer("requester_id"), // User ID of employee



  name: varchar("name", { length: 255 }).notNull(),

  website: varchar("website", { length: 255 }),

  category: varchar("category", { length: 100 }), // SaaS, Contractor, etc.

  description: text("description"),



  status: varchar("status", { length: 50 }).default('pending'), // pending, approved, rejected

  businessOwner: varchar("business_owner", { length: 100 }),



  rejectionReason: text("rejection_reason"),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    vendorRequestClientIdx: index("idx_vendor_request_client").on(table.clientId),

    vendorRequestStatusIdx: index("idx_vendor_request_status").on(table.status),

  };

});



export type VendorRequest = typeof vendorRequests.$inferSelect;

export type InsertVendorRequest = typeof vendorRequests.$inferInsert;







// ==================== GAP ANALYSIS ====================







export const gapAssessments = pgTable("gap_assessments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(), // e.g. "Q1 2024 ISO 27001 Gap Analysis"



  framework: varchar("framework", { length: 100 }).notNull(), // e.g. "ISO 27001"



  status: varchar("status", { length: 50 }).default("draft"), // draft, in_progress, completed



  scope: text("scope"),



  userId: integer("user_id"), // Creator



  assignees: json("assignees").$type<number[]>(), // Array of User IDs



  // Report Content

  executiveSummary: text("executive_summary"),

  introduction: text("introduction"),

  keyRecommendations: json("key_recommendations").$type<string[]>(), // Array of AI recommendations

  methodology: text("methodology"),

  assumptions: text("assumptions"),

  references: text("references"),





  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export const gapResponses = pgTable("gap_responses", {



  id: serial("id").primaryKey(),



  assessmentId: integer("assessment_id").notNull(),



  controlId: varchar("control_id", { length: 100 }).notNull(), // Code or ID from master controls



  currentStatus: varchar("current_status", { length: 50 }), // implemented, partial, not_implemented



  targetStatus: varchar("target_status", { length: 50 }), // required, not_required



  notes: text("notes"),



  evidenceLinks: json("evidence_links"), // Array of URLs or IDs



  remediationPlan: text("remediation_plan"),



  gapSeverity: varchar("gap_severity", { length: 20 }), // critical, high, medium, low



  priorityScore: integer("priority_score"), // 0-100, AI-calculated priority score



  priorityReason: text("priority_reason"), // AI explanation of priority



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    assessCtrlIdx: index("idx_gr_assess_ctrl").on(table.assessmentId, table.controlId),



  };



});















export type GapAssessment = typeof gapAssessments.$inferSelect;



export type InsertGapAssessment = typeof gapAssessments.$inferInsert;







export type GapResponse = typeof gapResponses.$inferSelect;



export type InsertGapResponse = typeof gapResponses.$inferInsert;







// ==================== FRAMEWORK MAPPINGS ====================







export const frameworkMappings_deprecated = pgTable("framework_mappings_deprecated", {



  id: serial("id").primaryKey(),



  sourceControlId: integer("source_control_id").notNull(),



  targetControlId: integer("target_control_id").notNull(),



  mappingType: varchar("mapping_type", { length: 50 }).default("equivalent"), // equivalent, partial, related



  notes: text("notes"),



  confidence: integer("confidence"), // AI confidence score 0-100



  status: varchar("status", { length: 50 }).default("approved"), // approved, suggested



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    sourceIdx: index("idx_fm_source").on(table.sourceControlId),



    targetIdx: index("idx_fm_target").on(table.targetControlId),



    uniqueMapping: index("idx_fm_unique").on(table.sourceControlId, table.targetControlId),



  };



});







export type FrameworkMapping = typeof frameworkMappings.$inferSelect;



export type InsertFrameworkMapping = typeof frameworkMappings.$inferInsert;







// ==================== INTEGRATIONS ====================







// Client Integrations (SMTP, etc.)



export const clientIntegrations = pgTable("client_integrations", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  provider: varchar("provider", { length: 50 }).notNull().default("smtp"), // smtp, sendgrid, aws_ses



  settings: json("settings").$type<{



    host?: string;



    port?: number;



    user?: string;



    pass?: string; // In a real app, this should be encrypted at rest



    fromName?: string;



    fromEmail?: string;



    apiKey?: string; // For API providers



  }>(),



  isEnabled: boolean("is_enabled").default(true),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientIntegrationIdx: index("idx_integration_client").on(table.clientId),



  };



});







export type ClientIntegration = typeof clientIntegrations.$inferSelect;



export type InsertClientIntegration = typeof clientIntegrations.$inferInsert;











export const vendorScans = pgTable("vendor_scans", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  vendorId: integer("vendor_id").notNull(),







  scanDate: timestamp("scan_date").defaultNow(),



  status: varchar("status", { length: 50 }).default("Completed"), // In Progress, Completed, Failed







  riskScore: integer("risk_score"), // 0-100 calculated risk



  vulnerabilityCount: integer("vulnerability_count").default(0),



  breachCount: integer("breach_count").default(0),







  rawResult: text("raw_result"), // JSON string of full results if needed







  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    vendorScanIdx: index("idx_scan_vendor").on(table.vendorId),



  };



});







export type VendorScan = typeof vendorScans.$inferSelect;



export type InsertVendorScan = typeof vendorScans.$inferInsert;







export const vendorCveMatches = pgTable("vendor_cve_matches", {



  id: serial("id").primaryKey(),



  vendorId: integer("vendor_id").notNull(),



  scanId: integer("scan_id"), // Links CVE to a specific scan



  cveId: varchar("cve_id", { length: 50 }).notNull(),







  matchScore: integer("match_score"),

  matchReason: text("match_reason"),



  description: text("description"),

  cvssScore: varchar("cvss_score", { length: 10 }),







  status: varchar("status", { length: 50 }).default("Active"), // Active, Ignored, Remediated







  discoveredAt: timestamp("discovered_at").defaultNow(),



}, (table) => {



  return {



    vendorCveIdx: index("idx_vendor_cve").on(table.vendorId),



    cveIdIdx: index("idx_vendor_cve_id").on(table.cveId),



  };



});







export type VendorCveMatch = typeof vendorCveMatches.$inferSelect;



export type InsertVendorCveMatch = typeof vendorCveMatches.$inferInsert;







export const vendorBreaches = pgTable("vendor_breaches", {



  id: serial("id").primaryKey(),



  vendorId: integer("vendor_id").notNull(),







  title: varchar("title", { length: 255 }).notNull(),



  description: text("description"),



  breachDate: timestamp("breach_date"),



  severity: varchar("severity", { length: 50 }), // High, Medium, Low







  source: varchar("source", { length: 255 }), // e.g., "HaveIBeenPwned", "DarkWeb"







  status: varchar("status", { length: 50 }).default("Active"),







  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    vendorBreachIdx: index("idx_breach_vendor").on(table.vendorId),



  };



});







export type VendorBreach = typeof vendorBreaches.$inferSelect;





export const globalVendors = pgTable("global_vendors", {

  id: serial("id").primaryKey(),

  name: varchar("name", { length: 255 }).notNull(),

  website: varchar("website", { length: 512 }),

  trustCenterUrl: varchar("trust_center_url", { length: 512 }),

  platform: varchar("platform", { length: 100 }),

  faviconUrl: varchar("favicon_url", { length: 512 }),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type GlobalVendor = typeof globalVendors.$inferSelect;

export type InsertGlobalVendor = typeof globalVendors.$inferInsert;







// ==========================================



// Business Continuity Management System (BCMS)



// ==========================================







// Module 1: Project & Scope Setup



export const bcpProjects = pgTable("bcp_projects", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),



  scope: text("scope"), // e.g. "Organization-wide", "IT Dept Only"



  managerId: integer("manager_id"),



  startDate: timestamp("start_date"),



  targetDate: timestamp("target_date"),



  status: varchar("status", { length: 50 }).default('planning'), // planning, active, review, completed



  createdAt: timestamp("created_at").defaultNow(),



});







export type BcpProject = typeof bcpProjects.$inferSelect;



export type InsertBcpProject = typeof bcpProjects.$inferInsert;







// Module 2: Process Registry (Foundation)



// Catalog of critical business functions/processes



export const businessProcesses = pgTable("business_processes", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  ownerId: integer("owner_id"),



  parentId: integer("parent_id"), // For hierarchical process trees



  department: varchar("department", { length: 255 }),



  criticalityTier: varchar("criticality_tier", { length: 50 }), // Tier 1 (Critical), Tier 2, etc.



  rto: varchar("rto", { length: 50 }),



  rpo: varchar("rpo", { length: 50 }),



  mtpd: varchar("mtpd", { length: 50 }),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type BusinessProcess = typeof businessProcesses.$inferSelect;



export type InsertBusinessProcess = typeof businessProcesses.$inferInsert;







// Module 2: Process Dependencies



// Links processes to other entities (upstream, downstream, assets)



export const processDependencies = pgTable("process_dependencies", {



  id: serial("id").primaryKey(),



  processId: integer("process_id").notNull(),



  dependencyType: varchar("dependency_type", { length: 50 }).notNull(), // 'upstream_process', 'downstream_process', 'it_system', 'vendor', 'people', 'facility'



  dependencyName: varchar("dependency_name", { length: 255 }).notNull(), // Name or reference to another entity



  dependencyId: integer("dependency_id"), // Optional FK if linking to internal entity



  criticality: varchar("criticality", { length: 50 }).default('medium'),



  notes: text("notes"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type ProcessDependency = typeof processDependencies.$inferSelect;



export type InsertProcessDependency = typeof processDependencies.$inferInsert;







// Business Impact Analysis (BIA)



export const businessImpactAnalyses = pgTable("business_impact_analyses", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  projectId: integer("project_id"), // Optional link to a BCP Project cycle



  processId: integer("process_id"), // Optional link to specific process being analyzed



  title: varchar("title", { length: 255 }).notNull(),



  status: varchar("status", { length: 50 }).default('draft'),



  conductorId: integer("conductor_id"),



  approvedBy: integer("approved_by"),



  approvedAt: timestamp("approved_at"),



  methodology: text("methodology"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type BusinessImpactAnalysis = typeof businessImpactAnalyses.$inferSelect;



export type InsertBusinessImpactAnalysis = typeof businessImpactAnalyses.$inferInsert;







export const biaQuestionnaires = pgTable("bia_questionnaires", {



  id: serial("id").primaryKey(),



  biaId: integer("bia_id").notNull(), // FK to business_impact_analyses



  question: text("question").notNull(),



  category: varchar("category", { length: 100 }), // e.g., Financial, Operational, Legal, Reputation



  response: text("response"),



  impactLevel: varchar("impact_level", { length: 50 }), // low, medium, high, critical



  notes: text("notes"),



  order: integer("order").default(0),



});







export type BiaQuestionnaire = typeof biaQuestionnaires.$inferSelect;



export type InsertBiaQuestionnaire = typeof biaQuestionnaires.$inferInsert;







export const recoveryObjectives = pgTable("recovery_objectives", {

  id: serial("id").primaryKey(),

  biaId: integer("bia_id").notNull(),

  activity: varchar("activity", { length: 255 }).notNull(),

  criticality: varchar("criticality", { length: 50 }), // low, medium, high, critical

  rto: varchar("rto", { length: 50 }), // e.g., "4 hours", "24 hours"

  rpo: varchar("rpo", { length: 50 }), // e.g., "1 hour"

  mtpd: varchar("mtpd", { length: 50 }), // Max Tolerable Period of Disruption

  dependencies: text("dependencies"), // Upstream/downstream dependencies

  resources: text("resources"), // Required resources (people, tech, data)

  createdAt: timestamp("created_at").defaultNow(),

});



export type RecoveryObjective = typeof recoveryObjectives.$inferSelect;

export type InsertRecoveryObjective = typeof recoveryObjectives.$inferInsert;



// Business Continuity Strategies

export const bcStrategies = pgTable("bc_strategies", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  resourceRequirements: text("resource_requirements"),

  estimatedCost: varchar("estimated_cost", { length: 100 }),

  benefits: text("benefits"),

  approvalStatus: varchar("approval_status", { length: 50 }).default('draft'),

  createdAt: timestamp("created_at").defaultNow(),

});



export type BcStrategy = typeof bcStrategies.$inferSelect;

export type InsertBcStrategy = typeof bcStrategies.$inferInsert;



// Business Continuity Plans (BCP)

export const bcPlans = pgTable("bc_plans", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  version: varchar("version", { length: 50 }).default('1.0'),

  status: varchar("status", { length: 50 }).default('draft'),

  ownerId: integer("owner_id"),

  lastTestedDate: timestamp("last_tested_date"),

  nextTestDate: timestamp("next_test_date"),

  content: text("content"), // Can be JSON or stricture text for the plan details (LEGACY / SNAPSHOT)

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type BcPlan = typeof bcPlans.$inferSelect;

export type InsertBcPlan = typeof bcPlans.$inferInsert;



// --- New Normalized BCP Tables ---



// Join: Plan <-> BIA

export const bcPlanBias = pgTable("bc_plan_bias", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  biaId: integer("bia_id").notNull(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    planBiaIdx: index("idx_bpb_plan_bia").on(table.planId, table.biaId),

  };

});



export type BcPlanBia = typeof bcPlanBias.$inferSelect;

export type InsertBcPlanBia = typeof bcPlanBias.$inferInsert;



// Join: Plan <-> Strategies

export const bcPlanStrategies = pgTable("bc_plan_strategies", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  strategyId: integer("strategy_id").notNull(),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    planStratIdx: index("idx_bps_plan_strat").on(table.planId, table.strategyId),

  };

});



export type BcPlanStrategy = typeof bcPlanStrategies.$inferSelect;

export type InsertBcPlanStrategy = typeof bcPlanStrategies.$inferInsert;



// Join: Plan <-> Scenarios

export const bcPlanScenarios = pgTable("bc_plan_scenarios", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  scenarioId: integer("scenario_id").notNull(),

  coverageNotes: text("coverage_notes"),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    planScenIdx: index("idx_bpsc_plan_scen").on(table.planId, table.scenarioId),

  };

});



export type BcPlanScenario = typeof bcPlanScenarios.$inferSelect;

export type InsertBcPlanScenario = typeof bcPlanScenarios.$inferInsert;



// Plan Contacts (Call Tree / Stakeholders specific to a plan)

export const bcPlanContacts = pgTable("bc_plan_contacts", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  userId: integer("user_id"), // Internal user

  vendorContactId: integer("vendor_contact_id"), // External vendor contact

  role: varchar("role", { length: 100 }), // e.g. "Incident Commander", "Legal", "PR"

  isPrimary: boolean("is_primary").default(false),

  createdAt: timestamp("created_at").defaultNow(),

});



export type BcPlanContact = typeof bcPlanContacts.$inferSelect;

export type InsertBcPlanContact = typeof bcPlanContacts.$inferInsert;



// Plan Versions (History)

export const planVersions = pgTable("plan_versions", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  version: varchar("version", { length: 50 }).notNull(),

  contentSnapshot: json("content_snapshot"), // Full snapshot of plan + relationships

  changeSummary: text("change_summary"),

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

});



export type PlanVersion = typeof planVersions.$inferSelect;

export type InsertPlanVersion = typeof planVersions.$inferInsert;



// Plan Change Log (Audit)

export const planChangeLog = pgTable("plan_change_log", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  userId: integer("user_id").notNull(),

  action: varchar("action", { length: 50 }).notNull(), // 'create', 'update', 'approve', 'publish'

  details: text("details"),

  createdAt: timestamp("created_at").defaultNow(),

});



export type PlanChangeLog = typeof planChangeLog.$inferSelect;

export type InsertPlanChangeLog = typeof planChangeLog.$inferInsert;



// Plan Exercises (Testing)

export const planExercises = pgTable("plan_exercises", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  planId: integer("plan_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  type: varchar("type", { length: 50 }).notNull(), // 'tabletop', 'walkthrough', 'simulation', 'full_interrupt'

  startDate: timestamp("start_date").defaultNow(),

  conductorId: integer("conductor_id"),

  status: varchar("status", { length: 50 }).default('planned'), // planned, in_progress, completed, cancelled

  outcome: varchar("outcome", { length: 50 }), // success, partial, fail

  notes: text("notes"),

  followUpTasks: json("follow_up_tasks"), // Array of tasks

  reportUrl: varchar("report_url", { length: 1024 }),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type PlanExercise = typeof planExercises.$inferSelect;

export type InsertPlanExercise = typeof planExercises.$inferInsert;







// Disruptive Scenarios (for Testing/Exercising)



export const disruptiveScenarios = pgTable("disruptive_scenarios", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),



  description: text("description").notNull(),



  likelihood: varchar("likelihood", { length: 50 }), // low, medium, high



  potentialImpact: text("potential_impact"),



  mitigationStrategies: text("mitigation_strategies"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type DisruptiveScenario = typeof disruptiveScenarios.$inferSelect;



export type InsertDisruptiveScenario = typeof disruptiveScenarios.$inferInsert;



// Link Risks to Disruptive Scenarios (Many-to-Many)

export const riskScenarioLinks = pgTable("risk_scenario_links", {

  id: serial("id").primaryKey(),

  riskId: integer("risk_id").notNull(), // FK to risk_scenarios

  scenarioId: integer("scenario_id").notNull(), // FK to disruptive_scenarios

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    riskIdx: index("idx_rsl_risk").on(table.riskId),

    scenarioIdx: index("idx_rsl_scenario").on(table.scenarioId),

    uniqueLink: index("idx_rsl_unique").on(table.riskId, table.scenarioId),

  };

});



export type RiskScenarioLink = typeof riskScenarioLinks.$inferSelect;

export type InsertRiskScenarioLink = typeof riskScenarioLinks.$inferInsert;







// ==========================================



// Collaboration & Workflow (Module 2 Extension)



// ==========================================











export const tasks = pgTable("tasks", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),



  description: text("description"),



  assigneeId: integer("assignee_id"), // User ID



  dueDate: timestamp("due_date"),



  status: varchar("status", { length: 50 }).default('pending'), // pending, in_progress, completed, blocked



  priority: varchar("priority", { length: 20 }).default('medium'), // low, medium, high, critical



  relatedEntityType: varchar("related_entity_type", { length: 50 }),



  relatedEntityId: integer("related_entity_id"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



  createdBy: integer("created_by"),



});







export type Task = typeof tasks.$inferSelect;



export type InsertTask = typeof tasks.$inferInsert;







export const bcApprovals = pgTable("bc_approvals", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'plan', 'bia', 'strategy'



  entityId: integer("entity_id").notNull(),



  approverId: integer("approver_id").notNull(),



  status: varchar("status", { length: 50 }).default('pending'), // pending, approved, rejected



  requestedAt: timestamp("requested_at").defaultNow(),



  respondedAt: timestamp("responded_at"),



  comments: text("comments"), // Optional rejection reason or approval note



});







export type BcApproval = typeof bcApprovals.$inferSelect;



export type InsertBcApproval = typeof bcApprovals.$inferInsert;







// ==========================================



// Advanced BIA Extensions (Phase 2)



// ==========================================







// Stakeholders & Roles



export const bcpStakeholders = pgTable("bcp_stakeholders", {



  id: serial("id").primaryKey(),



  projectId: integer("project_id"),



  processId: integer("process_id"),



  userId: integer("user_id").notNull(),



  role: varchar("role", { length: 50 }).notNull(), // 'owner', 'contributor', 'reviewer', 'approver'



  assignedDate: timestamp("assigned_date").defaultNow(),



});







export type BcpStakeholder = typeof bcpStakeholders.$inferSelect;



export type InsertBcpStakeholder = typeof bcpStakeholders.$inferInsert;







// Time-Based Impact Assessment



// Stores impact ratings for specific time intervals (e.g., 0-4h, 1-3d)



export const impactAssessments = pgTable("impact_assessments", {



  id: serial("id").primaryKey(),



  biaId: integer("bia_id").notNull(), // Links to the parent BIA



  timeInterval: varchar("time_interval", { length: 50 }).notNull(), // '0-4h', '4-24h', '1-3d', '3-7d', '7-30d'







  // Impact Ratings (1-10 or Low/Med/High/Critical)



  financialRating: integer("financial_rating"),



  operationalRating: integer("operational_rating"),



  reputationRating: integer("reputation_rating"),



  legalRating: integer("legal_rating"),







  financialValue: varchar("financial_value", { length: 100 }), // Estimated $ loss



  notes: text("notes"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type ImpactAssessment = typeof impactAssessments.$inferSelect;



export type InsertImpactAssessment = typeof impactAssessments.$inferInsert;







// Detailed Financial Impact Parameters



export const financialImpacts = pgTable("financial_impacts", {



  id: serial("id").primaryKey(),



  biaId: integer("bia_id").notNull(),



  lossCategory: varchar("loss_category", { length: 100 }).notNull(), // 'Revenue', 'Productivity', 'Penalties'



  amountPerUnit: integer("amount_per_unit"), // e.g., $ loss per hour



  unit: varchar("unit", { length: 50 }), // 'hour', 'day', 'event'



  description: text("description"),



  createdAt: timestamp("created_at").defaultNow(),



});







export type FinancialImpact = typeof financialImpacts.$inferSelect;



export type InsertFinancialImpact = typeof financialImpacts.$inferInsert;

















// ==========================================

// BIA & BCP Enhancements (Comprehensive Pack)

// ==========================================



export const biaSeasonalEvents = pgTable("bia_seasonal_events", {

  id: serial("id").primaryKey(),

  biaId: integer("bia_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(), // e.g. "Black Friday"

  startDate: varchar("start_date", { length: 50 }),

  endDate: varchar("end_date", { length: 50 }),

  impactDescription: text("impact_description"),

  createdAt: timestamp("created_at").defaultNow(),

});

export type BiaSeasonalEvent = typeof biaSeasonalEvents.$inferSelect;

export type InsertBiaSeasonalEvent = typeof biaSeasonalEvents.$inferInsert;



export const biaVitalRecords = pgTable("bia_vital_records", {

  id: serial("id").primaryKey(),

  biaId: integer("bia_id").notNull(),

  recordName: varchar("record_name", { length: 255 }).notNull(),

  mediaType: varchar("media_type", { length: 50 }), // Digital, Physical/Paper

  location: varchar("location", { length: 255 }),

  backupMethod: varchar("backup_method", { length: 255 }),

  rto: varchar("rto", { length: 50 }), // Recovery Time for this specific record

  createdAt: timestamp("created_at").defaultNow(),

});

export type BiaVitalRecord = typeof biaVitalRecords.$inferSelect;

export type InsertBiaVitalRecord = typeof biaVitalRecords.$inferInsert;



export const bcPlanCommunicationChannels = pgTable("bc_plan_communication_channels", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  audience: varchar("audience", { length: 100 }).notNull(), // Staff, Customers, Media, Regulators

  channel: varchar("channel", { length: 100 }), // Email, SMS, Phone Call, Press Release

  responsibleRole: varchar("responsible_role", { length: 255 }),

  messageTemplate: text("message_template"),

  frequency: varchar("frequency", { length: 100 }), // Initial, Daily, Resolution

  createdAt: timestamp("created_at").defaultNow(),

});

export type BcPlanCommunicationChannel = typeof bcPlanCommunicationChannels.$inferSelect;

export type InsertBcPlanCommunicationChannel = typeof bcPlanCommunicationChannels.$inferInsert;



// BCP Logistics / Recovery Sites (Assembly Points, Alternate Work Sites)

export const bcPlanLogistics = pgTable("bc_plan_logistics", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(), // FK to bc_plans

  type: varchar("type", { length: 50 }).notNull(), // 'assembly_point', 'alternate_site', 'war_room', 'shelter'

  locationName: varchar("location_name", { length: 255 }).notNull(),

  address: text("address"),

  capacity: integer("capacity"),

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),

});



export type BcPlanLogistic = typeof bcPlanLogistics.$inferSelect;

export type InsertBcPlanLogistic = typeof bcPlanLogistics.$inferInsert;



// BC Program Governance

export const bcPrograms = pgTable("bc_programs", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  programName: varchar("program_name", { length: 255 }).notNull().default('Business Continuity Management Program'),

  scopeDescription: text("scope_description"), // Geographical, Organizational, Assets

  policyStatement: text("policy_statement"), // The BCP Policy

  budgetAllocated: varchar("budget_allocated", { length: 100 }),

  programManagerId: integer("program_manager_id"),

  executiveSponsorId: integer("executive_sponsor_id"),

  status: varchar("status", { length: 50 }).default('draft'), // draft, approved, active

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type BcProgram = typeof bcPrograms.$inferSelect;

export type InsertBcProgram = typeof bcPrograms.$inferInsert;



export const bcCommitteeMembers = pgTable("bc_committee_members", {

  id: serial("id").primaryKey(),

  programId: integer("program_id").notNull(),

  userId: integer("user_id").notNull(),

  role: varchar("role", { length: 100 }).notNull(), // e.g., 'Committee Chair', 'IT Representative'

  name: varchar("name", { length: 255 }), // Snapshot of name if user removed? Or just rely on join. Let's keep it clean.

  responsibilities: text("responsibilities"),

  assignedAt: timestamp("assigned_at").defaultNow(),

});



export type BcCommitteeMember = typeof bcCommitteeMembers.$inferSelect;



export type InsertBcCommitteeMember = typeof bcCommitteeMembers.$inferInsert;



export const bcPlanSections = pgTable("bc_plan_sections", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  sectionKey: varchar("section_key", { length: 100 }).notNull(), // 'intro', 'scope', 'assumptions', 'activation_criteria'

  content: text("content"),

  order: integer("order").default(0),

  updatedAt: timestamp("updated_at").defaultNow(),

});

export type BcPlanSection = typeof bcPlanSections.$inferSelect;

export type InsertBcPlanSection = typeof bcPlanSections.$inferInsert;



export const bcPlanAppendices = pgTable("bc_plan_appendices", {

  id: serial("id").primaryKey(),

  planId: integer("plan_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),

  fileUrl: varchar("file_url", { length: 1024 }), // Or internal link

  type: varchar("type", { length: 50 }), // 'file', 'link', 'contact_list'

  updatedAt: timestamp("updated_at").defaultNow(),

});

export type BcPlanAppendix = typeof bcPlanAppendices.$inferSelect;

export type InsertBcPlanAppendix = typeof bcPlanAppendices.$inferInsert;



export const bcTrainingRecords = pgTable("bc_training_records", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  userId: integer("user_id").notNull(), // Trainee

  trainingType: varchar("training_type", { length: 100 }).notNull(), // 'awareness', 'role_based', 'simulation'

  completionDate: timestamp("completion_date"),

  expiryDate: timestamp("expiry_date"), // For certification renewal

  status: varchar("status", { length: 50 }).default('completed'), // completed, scheduled, overdue

  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow(),

});

export type BcTrainingRecord = typeof bcTrainingRecords.$inferSelect;

export type InsertBcTrainingRecord = typeof bcTrainingRecords.$inferInsert;







// ==========================================



// ISO 27001 Readiness Assessment (Wizard)



// ==========================================







export const readinessAssessments = pgTable("readiness_assessments", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  status: varchar("status", { length: 50 }).default("in_progress"), // in_progress, completed
  standardId: varchar("standard_id", { length: 50 }).notNull().default("ISO27001"),



  currentStep: integer("current_step").default(1),







  // JSONB storage for the wizard steps



  scopeDetails: json("scope_details"),



  stakeholders: json("stakeholders"),



  existingPolicies: json("existing_policies"), // Checklist from step 3



  businessContext: json("business_context"),



  maturityExpectations: json("maturity_expectations"),

  // AI Generated Executive Report
  scopingReport: text("scoping_report"),

  // Framework Specific Questionnaire Answers
  questionnaireData: jsonb("questionnaire_data"),







  updatedAt: timestamp("updated_at").defaultNow(),



  createdAt: timestamp("created_at").defaultNow(),



});







export type ReadinessAssessment = typeof readinessAssessments.$inferSelect;



export type InsertReadinessAssessment = typeof readinessAssessments.$inferInsert;







export const checklistStates = pgTable("checklist_states", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  checklistId: varchar("checklist_id", { length: 255 }).notNull(), // e.g., 'iso-27001-readiness'



  items: json("items").$type<Record<string, boolean>>().default({}),



  updatedAt: timestamp("updated_at").defaultNow(),



});







export type ChecklistState = typeof checklistStates.$inferSelect;



export type InsertChecklistState = typeof checklistStates.$inferInsert;







// ==========================================

// Governance Workbench

// ==========================================



export const workItemTypeEnum = pgEnum("work_item_type", ["review", "approval", "evidence_collection", "raci_assignment", "risk_treatment", "vendor_assessment", "bcp_approval", "policy_review", "control_implementation", "risk_review", "control_assessment"]);



export const workItemStatusEnum = pgEnum("work_item_status", ["pending", "in_progress", "completed", "cancelled", "escalated"]);



export const workItemPriorityEnum = pgEnum("work_item_priority", ["low", "medium", "high", "critical"]);



export const escalationTriggerEnum = pgEnum("escalation_trigger", ["overdue", "risk_threshold_breach", "approval_rejected", "status_regression", "missing_evidence", "missing_raci"]);



export const governanceEntityTypeEnum = pgEnum("governance_entity_type", ["policy", "control", "risk", "bcp_plan", "vendor", "evidence", "task", "roadmap", "implementation_plan"]);



export const workItems = pgTable("work_items", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  type: workItemTypeEnum("type").notNull(),



  status: workItemStatusEnum("status").default("pending"),



  priority: workItemPriorityEnum("priority").default("medium"),



  title: varchar("title", { length: 500 }).notNull(),



  description: text("description"),



  // Link to the entity this work item is about

  entityType: governanceEntityTypeEnum("entity_type"),



  entityId: integer("entity_id"),



  // Assignment (RACI-based)

  assignedToUserId: integer("assigned_to_user_id"),



  assignedToEmployeeId: integer("assigned_to_employee_id"),



  assignedRole: varchar("assigned_role", { length: 50 }), // 'accountable', 'responsible', etc.



  // Timing

  dueDate: timestamp("due_date"),



  completedAt: timestamp("completed_at"),



  // Escalation tracking

  isEscalated: boolean("is_escalated").default(false),



  escalatedAt: timestamp("escalated_at"),



  escalationRuleId: integer("escalation_rule_id"), // FK to escalation_rules



  // Metadata

  metadata: json("metadata").$type<{

    previousStatus?: string;

    approvalCount?: number;

    requiredApprovals?: number;

    rejectionReason?: string;

    [key: string]: any;

  }>(),



  createdBy: integer("created_by"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    clientStatusIdx: index("idx_wi_client_status").on(table.clientId, table.status),



    assignedUserIdx: index("idx_wi_assigned_user").on(table.assignedToUserId),



    dueDateIdx: index("idx_wi_due_date").on(table.dueDate),



    entityIdx: index("idx_wi_entity").on(table.entityType, table.entityId),



  };



});







export type WorkItem = typeof workItems.$inferSelect;



export type InsertWorkItem = typeof workItems.$inferInsert;







export const escalationRules = pgTable("escalation_rules", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  name: varchar("name", { length: 255 }).notNull(),



  description: text("description"),



  isActive: boolean("is_active").default(true),



  // Trigger conditions

  trigger: escalationTriggerEnum("trigger").notNull(),



  entityType: governanceEntityTypeEnum("entity_type"), // null = applies to all



  // Trigger parameters (JSON for flexibility)

  triggerConditions: json("trigger_conditions").$type<{

    overdueDays?: number;

    riskThreshold?: number;

    statusFrom?: string;

    statusTo?: string;

    [key: string]: any;

  }>(),



  // Actions to take

  actions: json("actions").$type<{

    createWorkItem?: boolean;

    notifyAccountable?: boolean;

    notifyResponsible?: boolean;

    sendEmail?: boolean;

    createTask?: boolean;

    escalateToRole?: string; // 'admin', 'owner', etc.

    [key: string]: any;

  }>().default({}),



  // Priority for the created work item

  workItemPriority: workItemPriorityEnum("work_item_priority").default("high"),



  createdBy: integer("created_by"),



  createdAt: timestamp("created_at").defaultNow(),



  updatedAt: timestamp("updated_at").defaultNow(),



}, (table) => {



  return {



    clientActiveIdx: index("idx_er_client_active").on(table.clientId, table.isActive),



    triggerIdx: index("idx_er_trigger").on(table.trigger),



  };



});







export type EscalationRule = typeof escalationRules.$inferSelect;



export type InsertEscalationRule = typeof escalationRules.$inferInsert;







export const governanceEvents = pgTable("governance_events", {



  id: serial("id").primaryKey(),



  clientId: integer("client_id").notNull(),



  // Entity information

  entityType: governanceEntityTypeEnum("entity_type").notNull(),



  entityId: integer("entity_id").notNull(),



  entityName: varchar("entity_name", { length: 500 }), // Denormalized for quick display



  // Event details

  eventType: varchar("event_type", { length: 100 }).notNull(), // 'status_change', 'approval', 'rejection', 'assignment', etc.



  fromState: varchar("from_state", { length: 100 }),



  toState: varchar("to_state", { length: 100 }),



  action: varchar("action", { length: 100 }), // 'approve', 'reject', 'assign', 'transition', etc.



  // Actor

  actorUserId: integer("actor_user_id"),



  actorName: varchar("actor_name", { length: 255 }), // Denormalized



  // Additional context

  metadata: json("metadata").$type<{

    reason?: string;

    comment?: string;

    assignedTo?: string;

    previousAssignee?: string;

    workItemId?: number;

    [key: string]: any;

  }>(),



  createdAt: timestamp("created_at").defaultNow(),



}, (table) => {



  return {



    clientEntityIdx: index("idx_ge_client_entity").on(table.clientId, table.entityType, table.entityId),



    clientCreatedIdx: index("idx_ge_client_created").on(table.clientId, table.createdAt),



    entityTypeIdx: index("idx_ge_entity_type").on(table.entityType),



  };



});







export type GovernanceEvent = typeof governanceEvents.$inferSelect;



export type InsertGovernanceEvent = typeof governanceEvents.$inferInsert;







export const riskReports = pgTable("risk_reports", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).default('Risk Management Report'),

  executiveSummary: text("executive_summary"),

  introduction: text("introduction"),

  scope: text("scope"),

  methodology: text("methodology"),

  keyFindings: text("key_findings"),

  recommendations: text("recommendations"),

  conclusion: text("conclusion"),

  assumptions: text("assumptions"),

  references: text("references"),

  status: varchar("status", { length: 50 }).default('draft'),

  version: integer("version").default(1),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type RiskReport = typeof riskReports.$inferSelect;

export type InsertRiskReport = typeof riskReports.$inferInsert;





// Federal Compliance (NIST 800-171/172, FIPS 199, POA&M)



export const federalSSPs = pgTable("federal_ssps", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  framework: varchar("framework", { length: 50 }).notNull(), // NIST 800-171 or NIST 800-172

  systemName: varchar("system_name", { length: 255 }),

  systemType: varchar("system_type", { length: 255 }),

  boundaryDescription: text("boundary_description"),

  responsibleRole: varchar("responsible_role", { length: 255 }),

  content: text("content").default('{}'), // Monolithic JSON storage for SSP sections

  status: varchar("status", { length: 50 }).default('draft'),

  version: integer("version").default(1),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type FederalSSP = typeof federalSSPs.$inferSelect;

export type InsertFederalSSP = typeof federalSSPs.$inferInsert;



export const federalSARs = pgTable("federal_sars", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  sspId: integer("ssp_id"),// .references(() => federalSSPs.id), (Avoiding circular or missing reference errors if added in one go)

  title: varchar("title", { length: 255 }).notNull(),

  assessorName: varchar("assessor_name", { length: 255 }),

  assessmentDate: timestamp("assessment_date"),

  summaryOfFindings: text("summary_of_findings"),

  riskExecutiveSummary: text("risk_executive_summary"),



  // DoD SAR Header Fields

  systemAcronym: varchar("system_acronym", { length: 50 }),

  systemIdentification: varchar("system_identification", { length: 255 }),

  systemType: varchar("system_type", { length: 50 }),

  version: varchar("version", { length: 50 }),

  agency: varchar("agency", { length: 100 }), // CC/S/A/FA

  assessmentCompletionDate: timestamp("assessment_completion_date"),

  systemOwnerId: integer("system_owner_id"),

  confidentiality: varchar("confidentiality", { length: 20 }),

  integrity: varchar("integrity", { length: 20 }),

  availability: varchar("availability", { length: 20 }),

  impact: varchar("impact", { length: 20 }),

  packageType: varchar("package_type", { length: 100 }),

  executiveSummary: text("executive_summary"),



  status: varchar("status", { length: 50 }).default('draft'),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type FederalSAR = typeof federalSARs.$inferSelect;

export type InsertFederalSAR = typeof federalSARs.$inferInsert;



export const fipsCategorizations = pgTable("fips_categorizations", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  systemName: varchar("system_name", { length: 255 }),

  informationTypes: json("information_types").$type<{

    type: string;

    description: string;

    confidentiality: 'low' | 'moderate' | 'high';

    integrity: 'low' | 'moderate' | 'high';

    availability: 'low' | 'moderate' | 'high';

  }[]>(),

  confidentialityImpact: varchar("confidentiality_impact", { length: 20 }),

  integrityImpact: varchar("integrity_impact", { length: 20 }),

  availabilityImpact: varchar("availability_impact", { length: 20 }),

  highWaterMark: varchar("high_water_mark", { length: 20 }),

  status: varchar("status", { length: 50 }).default('draft'),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type FipsCategorization = typeof fipsCategorizations.$inferSelect;

export type InsertFipsCategorization = typeof fipsCategorizations.$inferInsert;



export const federalPoams = pgTable("federal_poams", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull(),

  sourceSspId: integer("source_ssp_id"),// .references(() => federalSSPs.id),

  status: varchar("status", { length: 50 }).default('active'),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type FederalPoam = typeof federalPoams.$inferSelect;

export type InsertFederalPoam = typeof federalPoams.$inferInsert;



export const poamItems = pgTable("poam_items", {

  id: serial("id").primaryKey(),

  poamId: integer("poam_id").notNull(),

  controlId: varchar("control_id", { length: 100 }),

  weaknessName: varchar("weakness_name", { length: 500 }),

  weaknessDescription: text("weakness_description"),

  weaknessDetectorSource: varchar("weakness_detector_source", { length: 255 }),

  sourceIdentifier: varchar("source_identifier", { length: 255 }),

  assetIdentifier: varchar("asset_identifier", { length: 255 }),

  pointOfContact: varchar("point_of_contact", { length: 255 }),

  resourcesRequired: text("resources_required"),

  overallRemediationPlan: text("overall_remediation_plan"),

  assigneeId: integer("assignee_id"),

  originalDetectionDate: timestamp("original_detection_date"),

  scheduledCompletionDate: timestamp("scheduled_completion_date"),

  milestones: json("milestones").$type<{

    description: string;

    scheduledDate: string;

    status: 'pending' | 'completed';

  }[]>(),

  milestoneChanges: json("milestone_changes"),

  status: varchar("status", { length: 50 }).default('open'), // open, closed, risk_accepted

  statusDate: timestamp("status_date"),

  vendorDependency: varchar("vendor_dependency", { length: 255 }),

  lastVendorCheckinDate: timestamp("last_vendor_checkin_date"),

  productName: varchar("product_name", { length: 255 }),

  originalRiskRating: varchar("original_risk_rating", { length: 50 }),

  adjustedRiskRating: varchar("adjusted_risk_rating", { length: 50 }),

  riskAdjustment: text("risk_adjustment"),

  falsePositive: boolean("false_positive").default(false),

  operationalRequirement: text("operational_requirement"),

  deviationRationale: text("deviation_rationale"),

  supportingDocuments: json("supporting_documents"),

  comments: text("comments"),

  autoApprove: boolean("auto_approve").default(false),

  relatedRiskId: integer("related_risk_id"), // Linked Risk Assessment

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

});



export type PoamItem = typeof poamItems.$inferSelect;

export type InsertPoamItem = typeof poamItems.$inferInsert;



// SSP Content Sections (e.g. System Identification, Boundary, etc.)

export const federalSspSections = pgTable("federal_ssp_sections", {

  id: serial("id").primaryKey(),

  sspId: integer("ssp_id").notNull(),

  sectionKey: varchar("section_key", { length: 100 }).notNull(), // 'system_identification', 'system_boundary', 'operational_environment', 'roles_responsibilities', 'attachments'

  content: json("content"), // Flexible JSON for various fields

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type FederalSspSection = typeof federalSspSections.$inferSelect;

export type InsertFederalSspSection = typeof federalSspSections.$inferInsert;



// SSP Control Implementation Details

export const federalSspControls = pgTable("federal_ssp_controls", {

  id: serial("id").primaryKey(),

  sspId: integer("ssp_id").notNull(),

  controlId: varchar("control_id", { length: 50 }).notNull(), // e.g., 'AC-2'

  implementationStatus: varchar("implementation_status", { length: 50 }).default('not_implemented'), // implemented, partial, planned, not_applicable

  implementationDescription: text("implementation_description"),

  responsibleRole: varchar("responsible_role", { length: 255 }),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type FederalSspControl = typeof federalSspControls.$inferSelect;

export type InsertFederalSspControl = typeof federalSspControls.$inferInsert;



// SAR Findings

export const federalSarFindings = pgTable("federal_sar_findings", {

  id: serial("id").primaryKey(),

  sarId: integer("sar_id").notNull(),

  controlId: varchar("control_id", { length: 50 }).notNull(),

  result: varchar("result", { length: 50 }).default('other_than_satisfied'), // satisfied, other_than_satisfied

  observation: text("observation"),

  riskLevel: varchar("risk_level", { length: 20 }), // low, moderate, high

  remediationPlan: text("remediation_plan"),



  // DoD SAR Table Columns

  overlay: varchar("overlay", { length: 100 }),

  naJustification: text("na_justification"),

  vulnerabilitySummary: text("vulnerability_summary"),

  vulnerabilitySeverity: varchar("vulnerability_severity", { length: 20 }),

  residualRiskLevel: varchar("residual_risk_level", { length: 20 }),

  recommendations: text("recommendations"),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type FederalSarFinding = typeof federalSarFindings.$inferSelect;

export type InsertFederalSarFinding = typeof federalSarFindings.$inferInsert;



// ==================== MANAGED SERVICE MODULE (Accountant Model) ====================



export const intakeItems = pgTable("intake_items", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  filename: varchar("filename", { length: 255 }).notNull(),

  fileUrl: varchar("file_url", { length: 1024 }).notNull(),

  fileKey: varchar("file_key", { length: 500 }), // S3 Key or local path

  status: varchar("status", { length: 50 }).default("pending"), // pending, classified, mapped, rejected

  classification: varchar("classification", { length: 255 }), // AI-detected type

  confidence: integer("confidence"), // AI confidence 0-100

  details: json("details"), // AI-detected details (dates, amounts, etc.)

  uploadedBy: integer("uploaded_by"),

  processedBy: integer("processed_by"), // Advisor who mapped it

  mappedEvidenceId: integer("mapped_evidence_id"), // Linked evidence record

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientIntakeIdx: index("idx_intake_client").on(table.clientId),

    statusIdx: index("idx_intake_status").on(table.status),

  };

});



export type IntakeItem = typeof intakeItems.$inferSelect;

export type InsertIntakeItem = typeof intakeItems.$inferInsert;



// ==================== SALES CRM MODULE (Krayin Integration) ====================



// Sales CRM - Leads

export const crmLeads = pgTable("crm_leads", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id"), // Optional: if linked to existing client

  firstName: varchar("first_name", { length: 255 }).notNull(),

  lastName: varchar("last_name", { length: 255 }).notNull(),

  email: varchar("email", { length: 255 }),

  companyName: varchar("company_name", { length: 255 }),

  jobTitle: varchar("job_title", { length: 255 }),

  status: varchar("status", { length: 50 }).default("new"), // new, contacted, qualified, converted, disqualified

  source: varchar("source", { length: 100 }), // website, referral, linkedin

  notes: text("notes"),

  ownerId: integer("owner_id"), // User ID

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type CrmLead = typeof crmLeads.$inferSelect;

export type InsertCrmLead = typeof crmLeads.$inferInsert;



// Sales CRM - Pipelines/Stages

export const crmDealStages = pgTable("crm_deal_stages", {

  id: serial("id").primaryKey(),

  name: varchar("name", { length: 100 }).notNull(), // Qualification, Proposal, etc.

  order: integer("order").default(0),

  winProbability: integer("win_probability"), // 0-100

  color: varchar("color", { length: 50 }),

  createdAt: timestamp("created_at").defaultNow(),

});



export type CrmDealStage = typeof crmDealStages.$inferSelect;

export type InsertCrmDealStage = typeof crmDealStages.$inferInsert;



// Sales CRM - Deals

export const crmDeals = pgTable("crm_deals", {

  id: serial("id").primaryKey(),

  title: varchar("title", { length: 255 }).notNull(),

  value: integer("value"), // Value in cents or main currency unit

  currency: varchar("currency", { length: 10 }).default("USD"),

  stageId: integer("stage_id").notNull(), // Link to crmDealStages

  leadId: integer("lead_id"), // Link to crmLeads

  clientId: integer("client_id"), // Link to existing clients (if converted)

  ownerId: integer("owner_id"),

  expectedCloseDate: timestamp("expected_close_date"),

  probability: integer("probability"), // Override stage probability

  notes: text("notes"),

  status: varchar("status", { length: 50 }).default("open"), // open, won, lost

  lostReason: text("lost_reason"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

});



export type CrmDeal = typeof crmDeals.$inferSelect;

export type InsertCrmDeal = typeof crmDeals.$inferInsert;



export const reportTypeEnum = pgEnum("report_type", ["executive_summary", "controls", "policies", "evidence", "mappings", "soa", "compliance_readiness", "audit_bundle"]);



export const reportLogs = pgTable("report_logs", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  userId: integer("user_id"),

  reportType: reportTypeEnum("report_type").notNull(),

  format: varchar("format", { length: 20 }).notNull(), // pdf, docx, csv, zip

  timestamp: timestamp("timestamp").defaultNow().notNull(),

  metadata: json("metadata").$type<{

    filename?: string;

    aiGenerated?: boolean;

    bundleContents?: string[];

  }>(),

}, (table) => {

  return {

    clientIdx: index("idx_rl_client").on(table.clientId),

    typeIdx: index("idx_rl_type").on(table.reportType),

  };

});



export type ReportLog = typeof reportLogs.$inferSelect;

export type InsertReportLog = typeof reportLogs.$inferInsert;



export const waitingList = pgTable("waiting_list", {

  id: serial("id").primaryKey(),

  email: varchar("email", { length: 255 }).notNull().unique(),

  firstName: varchar("first_name", { length: 255 }),

  lastName: varchar("last_name", { length: 255 }),

  company: varchar("company", { length: 255 }),

  role: varchar("role", { length: 255 }),

  certification: varchar("certification", { length: 255 }),

  orgSize: varchar("org_size", { length: 100 }),

  industry: varchar("industry", { length: 255 }),

  status: varchar("status", { length: 50 }).default("pending"),

  source: varchar("source", { length: 50 }).default("landing_page"),

  createdAt: timestamp("created_at").defaultNow(),

});



export type WaitingListEntry = typeof waitingList.$inferSelect;

export type InsertWaitingListEntry = typeof waitingList.$inferInsert;





// ============================================

// CRM Tables

// ============================================



// Global CRM - Platform-level contacts for admin sales/marketing

export const globalContacts = pgTable("global_contacts", {

  id: serial("id").primaryKey(),

  firstName: varchar("first_name", { length: 255 }),

  lastName: varchar("last_name", { length: 255 }),

  email: varchar("email", { length: 255 }).notNull().unique(),

  company: varchar("company", { length: 255 }),

  role: varchar("role", { length: 255 }),

  phone: varchar("phone", { length: 50 }),

  source: varchar("source", { length: 50 }).default("manual"), // 'waitlist', 'manual', 'import'

  status: varchar("status", { length: 50 }).default("lead"), // 'lead', 'prospect', 'customer', 'churned'

  notes: text("notes"),

  createdBy: integer("created_by"), // FK to users

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    emailIdx: index("idx_gc_email").on(table.email),

    statusIdx: index("idx_gc_status").on(table.status),

  };

});



export type GlobalContact = typeof globalContacts.$inferSelect;

export type InsertGlobalContact = typeof globalContacts.$inferInsert;



// Client CRM - Per-workspace contacts (stakeholders, vendors, auditors)

export const clientContacts = pgTable("client_contacts", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(), // FK to clients

  firstName: varchar("first_name", { length: 255 }),

  lastName: varchar("last_name", { length: 255 }),

  email: varchar("email", { length: 255 }),

  department: varchar("department", { length: 255 }),

  role: varchar("role", { length: 100 }), // 'stakeholder', 'auditor', 'vendor', 'employee'

  phone: varchar("phone", { length: 50 }),

  notes: text("notes"),

  createdBy: integer("created_by"), // FK to users

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_clc_client").on(table.clientId),

  };

});



export type ClientContact = typeof clientContacts.$inferSelect;

export type InsertClientContact = typeof clientContacts.$inferInsert;



// Global CRM Activities - Track calls, emails, meetings per global contact

export const globalCrmActivities = pgTable("global_crm_activities", {

  id: serial("id").primaryKey(),

  contactId: integer("contact_id").notNull(), // FK to global_contacts

  type: varchar("type", { length: 50 }).notNull(), // 'call', 'email', 'meeting', 'note', 'task'

  subject: varchar("subject", { length: 255 }),

  description: text("description"),

  outcome: varchar("outcome", { length: 100 }), // 'completed', 'no_answer', 'scheduled', 'cancelled'

  scheduledAt: timestamp("scheduled_at"),

  completedAt: timestamp("completed_at"),

  duration: integer("duration"), // in minutes

  createdBy: integer("created_by"), // FK to users

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    contactIdx: index("idx_gcrm_act_contact").on(table.contactId),

    typeIdx: index("idx_gcrm_act_type").on(table.type),

  };

});



export type GlobalCrmActivity = typeof globalCrmActivities.$inferSelect;

export type InsertGlobalCrmActivity = typeof globalCrmActivities.$inferInsert;



// Global CRM Notes - Notes for each global contact

export const globalCrmNotes = pgTable("global_crm_notes", {

  id: serial("id").primaryKey(),

  contactId: integer("contact_id").notNull(), // FK to global_contacts

  content: text("content").notNull(),

  isPinned: boolean("is_pinned").default(false),

  createdBy: integer("created_by"), // FK to users

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    contactIdx: index("idx_gcrm_notes_contact").on(table.contactId),

  };

});



export type GlobalCrmNote = typeof globalCrmNotes.$inferSelect;

export type InsertGlobalCrmNote = typeof globalCrmNotes.$inferInsert;



// Global CRM Deals - Track revenue opportunities

export const globalCrmDeals = pgTable("global_crm_deals", {

  id: serial("id").primaryKey(),

  contactId: integer("contact_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  value: integer("value").notNull(), // in cents

  probability: integer("probability").default(0), // 0-100

  stage: varchar("stage", { length: 50 }).notNull(), // 'discovery', 'proposal', 'negotiation', 'closed_won', 'closed_lost'

  expectedCloseDate: timestamp("expected_close_date"),

  description: text("description"),

  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    contactIdx: index("idx_gcrm_deals_contact").on(table.contactId),

    stageIdx: index("idx_gcrm_deals_stage").on(table.stage),

  };

});



export type GlobalCrmDeal = typeof globalCrmDeals.$inferSelect;

export type InsertGlobalCrmDeal = typeof globalCrmDeals.$inferInsert;



// Global CRM Tags - Custom categorization labels

export const globalCrmTags = pgTable("global_crm_tags", {

  id: serial("id").primaryKey(),

  name: varchar("name", { length: 50 }).notNull().unique(),

  color: varchar("color", { length: 20 }), // Hex code or tailwind color name

  createdAt: timestamp("created_at").defaultNow(),

});



export type GlobalCrmTag = typeof globalCrmTags.$inferSelect;

export type InsertGlobalCrmTag = typeof globalCrmTags.$inferInsert;



// Global CRM Contact Tags - Join table for many-to-many

export const globalCrmContactTags = pgTable("global_crm_contact_tags", {

  id: serial("id").primaryKey(),

  contactId: integer("contact_id").notNull(),

  tagId: integer("tag_id").notNull(),

}, (table) => {

  return {

    contactTagIdx: uniqueIndex("idx_gcrm_contact_tag").on(table.contactId, table.tagId),

  };

});



export type GlobalCrmContactTag = typeof globalCrmContactTags.$inferSelect;

export type InsertGlobalCrmContactTag = typeof globalCrmContactTags.$inferInsert;





// ==========================================

// Privacy Compliance (GDPR/CCPA)

// ==========================================



export const processDataFlows = pgTable("process_data_flows", {

  id: serial("id").primaryKey(),

  processId: integer("process_id").notNull(), // Link to Business Process

  assetId: integer("asset_id"), // Link to Data Asset (if mapped to specific asset) 



  // Data Elements (if not strictly tied to an asset record, or to refine asset content)

  dataElements: text("data_elements"), // Description of specific data points (e.g. "Name, Email")



  // Processing Details

  interactionType: varchar("interaction_type", { length: 50 }), // Collection, Storage, Transmission, Use, Deletion

  legalBasis: varchar("legal_basis", { length: 100 }), // Consent, Contract, Legal Obligation, Vital Interests, Public Task, Legitimate Interests

  purpose: text("purpose"), // Specific purpose for this flow



  // Subjects & Recipients

  dataSubjectType: varchar("data_subject_type", { length: 100 }), // Employees, Customers, Patients, Minors

  recipients: text("recipients"), // Internal or External parties

  isCrossBorder: boolean("is_cross_border").default(false),

  transferMechanism: varchar("transfer_mechanism", { length: 100 }), // SCCs, Adequacy Decision



  // Retention

  retentionPeriod: varchar("retention_period", { length: 100 }),

  disposalMethod: varchar("disposal_method", { length: 100 }),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    procFlowIdx: index("idx_pdf_process").on(table.processId),

    assetFlowIdx: index("idx_pdf_asset").on(table.assetId),

  };

});



export type ProcessDataFlow = typeof processDataFlows.$inferSelect;

export type InsertProcessDataFlow = typeof processDataFlows.$inferInsert;



export const dsarRequests = pgTable("dsar_requests", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),



  // Request Details

  requestId: varchar("request_id", { length: 50 }).notNull(), // Unique ID e.g., DSAR-2024-001

  requestType: varchar("request_type", { length: 50 }).notNull(), // Access, Deletion, Rectification, Portability, Restriction

  status: varchar("status", { length: 50 }).default("New"), // New, Verifying Identity, In Progress, Review, Completed, Rejected

  priority: varchar("priority", { length: 20 }).default("medium"), // low, medium, high, critical



  // Requester Info

  subjectEmail: varchar("subject_email", { length: 255 }),

  subjectName: varchar("subject_name", { length: 255 }),

  verificationStatus: varchar("verification_status", { length: 50 }).default("Pending"), // Pending, Verified, Failed

  verificationMethod: varchar("verification_method", { length: 100 }), // e.g., "Email Validation", "Passport"

  submissionMethod: varchar("submission_method", { length: 50 }).default("manual"), // email, form, portal, manual



  // Workflow

  requestDate: timestamp("request_date").defaultNow(),

  dueDate: timestamp("due_date"), // Auto-calculated target

  completedDate: timestamp("completed_date"),



  assigneeId: integer("assignee_id"), // Internal user handling the request



  // Resolution

  resolutionNotes: text("resolution_notes"),



  // Structured Response Data (GDPR Art. 15)

  responseData: jsonb("response_data").$type<{

    personalDataFound: boolean;

    dataCategories: string[];

    purposes: string[];

    recipients: string[];

    lawfulBasis: string[];

    retentionPeriod: string;

    sources: string;

    rightsInfo: string;

  }>(),



  // Audit Log

  auditLog: jsonb("audit_log").$type<{

    action: string;

    user: string;

    timestamp: string;

    details?: string;

  }[]>().default([]),



  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientDsarIdx: index("idx_dsar_client").on(table.clientId),

    statusIdx: index("idx_dsar_status").on(table.status),

    emailIdx: index("idx_dsar_email").on(table.subjectEmail),

  };

});



export type DsarRequest = typeof dsarRequests.$inferSelect;

export type InsertDsarRequest = typeof dsarRequests.$inferInsert;





// =================================================================================

// Vendor Assessment Automation

// =================================================================================



export const vendorAssessmentTemplates = pgTable("vendor_assessment_templates", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: varchar("name", { length: 255 }).notNull(),

  description: text("description"),

  content: json("content").$type<{

    sections: {

      title: string;

      description?: string;

      questions: {

        id: string;

        text: string;

        type: 'text' | 'yes_no' | 'multiple_choice' | 'file_upload';

        options?: string[];

        required?: boolean;

      }[];

    }[];

  }>(),

  createdBy: integer("created_by"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_vat_client").on(table.clientId),

  };

});



export type VendorAssessmentTemplate = typeof vendorAssessmentTemplates.$inferSelect;

export type InsertVendorAssessmentTemplate = typeof vendorAssessmentTemplates.$inferInsert;



export const vendorAssessmentRequests = pgTable("vendor_assessment_requests", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id").notNull(), // Link to vendors table

  templateId: integer("template_id").notNull(),



  // Access Control

  token: varchar("token", { length: 64 }).notNull().unique(), // Secure access token

  recipientEmail: varchar("recipient_email", { length: 255 }),



  // Status Tracking

  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, in_progress, submitted, under_review, completed



  // Assessment Data

  responses: json("responses").$type<Record<string, {

    value: any;

    comment?: string;

    evidenceUrl?: string;

  }>>(),



  score: integer("score"), // 0-100



  // Dates

  sentAt: timestamp("sent_at"),

  expiresAt: timestamp("expires_at"),

  viewedAt: timestamp("viewed_at"),

  submittedAt: timestamp("submitted_at"),

  completedAt: timestamp("completed_at"), // Review completed



  createdBy: integer("created_by"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientVendorIdx: index("idx_var_client_vendor").on(table.clientId, table.vendorId),

    tokenIdx: uniqueIndex("idx_var_token").on(table.token),

    statusIdx: index("idx_var_status").on(table.status),

  };

});



export type VendorAssessmentRequest = typeof vendorAssessmentRequests.$inferSelect;

export type InsertVendorAssessmentRequest = typeof vendorAssessmentRequests.$inferInsert;



export const vendorDataRequests = pgTable("vendor_data_requests", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  vendorId: integer("vendor_id").notNull(),



  token: varchar("token", { length: 64 }).notNull().unique(),

  recipientEmail: varchar("recipient_email", { length: 255 }),

  message: text("message"), // Optional custom message for the vendor



  status: varchar("status", { length: 50 }).default("sent"), // sent, in_progress, completed



  // Array of items: { type: 'questionnaire' | 'document', id?: number, name: string, status: 'pending' | 'completed', resultId?: number }

  items: json("items").$type<Array<{

    type: 'questionnaire' | 'document';

    id?: number; // Template ID for questionnaire

    name: string; // "SOC 2 Report", "Pentest", etc.

    status: 'pending' | 'completed';

    completedAt?: string;

    fileUrl?: string; // For documents

    assessmentRequestId?: number; // Linked ID if it's a questionnaire

  }>>(),



  expiresAt: timestamp("expires_at"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientVendorIdx: index("idx_vdr_client_vendor").on(table.clientId, table.vendorId),

    tokenIdx: uniqueIndex("idx_vdr_token").on(table.token),

  };

});



export type VendorDataRequest = typeof vendorDataRequests.$inferSelect;

export type InsertVendorDataRequest = typeof vendorDataRequests.$inferInsert;





// Policy Management & Attestation



export const policyAssignments = pgTable("policy_assignments", {

  id: serial("id").primaryKey(),

  policyId: integer("policy_id").notNull(), // FK to client_policies

  employeeId: integer("employee_id").notNull(), // FK to employees

  status: varchar("status", { length: 50 }).default("pending"), // pending, viewed, attested

  attestedAt: timestamp("attested_at"),

  assignedAt: timestamp("assigned_at").defaultNow(),

  viewedAt: timestamp("viewed_at"),

}, (table) => {

  return {

    policyIdx: index("idx_pa_policy").on(table.policyId),

    employeeIdx: index("idx_pa_employee").on(table.employeeId),

  };

});



export type PolicyAssignment = typeof policyAssignments.$inferSelect;

export type InsertPolicyAssignment = typeof policyAssignments.$inferInsert;



export const policyExceptions = pgTable("policy_exceptions", {

  id: serial("id").primaryKey(),

  policyId: integer("policy_id").notNull(), // FK to client_policies

  employeeId: integer("employee_id").notNull(), // FK to employees (requester)

  reason: text("reason").notNull(),

  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, rejected, expired

  expirationDate: timestamp("expiration_date"),

  approvedBy: integer("approved_by"), // FK to users (approver) - Nullable if not approved yet or auto-approved

  approvedAt: timestamp("approved_at"),

  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    policyIdx: index("idx_pe_policy").on(table.policyId),

    employeeIdx: index("idx_pe_employee").on(table.employeeId),

    statusIdx: index("idx_pe_status").on(table.status),

  };

});



export type PolicyException = typeof policyExceptions.$inferSelect;

export type InsertPolicyException = typeof policyExceptions.$inferInsert;



export const privacyAssessments = pgTable("privacy_assessments", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  type: varchar("type", { length: 50 }).notNull(), // 'gdpr', 'ccpa'

  responses: json("responses").$type<Record<string, { answer: string; notes?: string; owner?: string; dueDate?: string; lastReviewed?: string }>>(),

  status: varchar("status", { length: 20 }).default("not_started"), // 'not_started', 'in_progress', 'completed'

  score: integer("score").default(0),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientTypeIdx: index("idx_pa_client_type").on(table.clientId, table.type),

  };

});



export type PrivacyAssessment = typeof privacyAssessments.$inferSelect;

export type InsertPrivacyAssessment = typeof privacyAssessments.$inferInsert;





// ==========================================

// Employees / HR

// ==========================================













export const knowledgeBaseEntries = pgTable("knowledge_base_entries", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  question: text("question").notNull(),

  answer: text("answer").notNull(),

  tags: json("tags").$type<string[]>().default([]),

  access: varchar("access", { length: 50 }).default("internal"), // internal, public, restricted

  assigneeId: integer("assignee_id"), // FK to users

  health: varchar("health", { length: 50 }), // e.g., 'good', 'needs_review'

  comments: text("comments"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_kb_client").on(table.clientId),

    questionIdx: index("idx_kb_question").on(table.question),

  };

});



export type KnowledgeBaseEntry = typeof knowledgeBaseEntries.$inferSelect;

export type InsertKnowledgeBaseEntry = typeof knowledgeBaseEntries.$inferInsert;



export const questionnaires = pgTable("questionnaires", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  name: text("name").notNull(),

  senderName: text("sender_name"), // "Account" in screenshot, e.g. who sent it

  productName: text("product_name"),

  status: varchar("status", { length: 50 }).default("open"), // open, in_progress, completed, archived

  progress: integer("progress").default(0),

  dueDate: timestamp("due_date"),

  ownerId: integer("owner_id"), // FK to users

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_qn_client").on(table.clientId),

    statusIdx: index("idx_qn_status").on(table.status),

  };

});



export type Questionnaire = typeof questionnaires.$inferSelect;

export type InsertQuestionnaire = typeof questionnaires.$inferInsert;



export const questionnaireQuestions = pgTable("questionnaire_questions", {

  id: serial("id").primaryKey(),

  questionnaireId: integer("questionnaire_id").notNull().references(() => questionnaires.id, { onDelete: 'cascade' }),

  questionId: text("question_id"), // Unique ID from the questionnaire (e.g., "A&A-01.1", "1.1.1")

  question: text("question").notNull(),

  answer: text("answer"),

  comment: text("comment"), // Additional comments/notes

  tags: json("tags").$type<string[]>().default([]), // Tags for categorization

  access: varchar("access", { length: 50 }).default("internal"), // internal, external, confidential

  assigneeId: integer("assignee_id").references(() => users.id), // Assigned user

  confidence: integer("confidence"),

  sources: json("sources").$type<any[]>().default([]),

  status: varchar("status", { length: 50 }).default("pending"), // pending, approved, flagged

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),

}, (table) => {

  return {

    questionnaireIdx: index("idx_qq_questionnaire").on(table.questionnaireId),

  };

});



export type QuestionnaireQuestion = typeof questionnaireQuestions.$inferSelect;

export type InsertQuestionnaireQuestion = typeof questionnaireQuestions.$inferInsert;





// ==================== GDPR Article 30 - Records of Processing Activities (ROPA) ====================



export const processingActivities = pgTable("processing_activities", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull().references(() => clients.id, { onDelete: 'cascade' }),



  // Basic Info

  activityName: text("activity_name").notNull(),

  activityId: text("activity_id").notNull(),

  description: text("description"),



  // Controller/Processor Info

  role: varchar("role", { length: 50 }).notNull(), // 'controller' | 'processor' | 'joint_controller'

  controllerName: text("controller_name"),

  controllerContact: text("controller_contact"),

  dpoName: text("dpo_name"),

  dpoContact: text("dpo_contact"),

  representativeName: text("representative_name"),

  representativeContact: text("representative_contact"),



  // Processing Details

  purposes: json("purposes").$type<string[]>().notNull().default([]),

  legalBasis: varchar("legal_basis", { length: 100 }).notNull(), // 'consent', 'contract', 'legal_obligation', etc.



  // Data Categories

  dataCategories: json("data_categories").$type<string[]>().notNull().default([]),

  dataSubjectCategories: json("data_subject_categories").$type<string[]>().notNull().default([]),

  specialCategories: json("special_categories").$type<string[]>().default([]),



  // Recipients

  recipients: json("recipients").$type<any[]>().notNull().default([]),

  recipientCategories: json("recipient_categories").$type<string[]>().default([]),



  // International Transfers

  hasInternationalTransfers: boolean("has_international_transfers").default(false),

  transferCountries: json("transfer_countries").$type<string[]>().default([]),

  transferSafeguards: text("transfer_safeguards"), // 'SCCs', 'BCRs', 'Adequacy Decision'

  transferDetails: text("transfer_details"),



  // Retention

  retentionPeriod: text("retention_period"),

  retentionCriteria: text("retention_criteria"),

  deletionProcedure: text("deletion_procedure"),



  // Security Measures

  technicalMeasures: json("technical_measures").$type<string[]>().default([]),

  organizationalMeasures: json("organizational_measures").$type<string[]>().default([]),

  securityDescription: text("security_description"),



  // Metadata

  status: varchar("status", { length: 50 }).default("draft"), // 'draft', 'active', 'archived'

  lastReviewDate: timestamp("last_review_date"),

  nextReviewDate: timestamp("next_review_date"),

  createdBy: integer("created_by").references(() => users.id),

  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow()

}, (table) => {

  return {

    clientIdx: index("idx_pa_client").on(table.clientId),

    activityIdIdx: uniqueIndex("idx_pa_activity_id").on(table.activityId),

    statusIdx: index("idx_pa_status").on(table.status),

  };

});



export type ProcessingActivity = typeof processingActivities.$inferSelect;

export type InsertProcessingActivity = typeof processingActivities.$inferInsert;



// Link processing activities to vendors (subprocessors)

export const processingActivityVendors = pgTable("processing_activity_vendors", {

  id: serial("id").primaryKey(),

  processingActivityId: integer("processing_activity_id").notNull().references(() => processingActivities.id, { onDelete: 'cascade' }),

  vendorId: integer("vendor_id").notNull().references(() => vendors.id, { onDelete: 'cascade' }),

  role: varchar("role", { length: 50 }), // 'processor', 'sub-processor'

  createdAt: timestamp("created_at").defaultNow()

}, (table) => {

  return {

    paIdx: index("idx_pav_pa").on(table.processingActivityId),

    vendorIdx: index("idx_pav_vendor").on(table.vendorId),

  };

});



// Link processing activities to assets (systems)

export const processingActivityAssets = pgTable("processing_activity_assets", {

  id: serial("id").primaryKey(),

  processingActivityId: integer("processing_activity_id").notNull().references(() => processingActivities.id, { onDelete: 'cascade' }),

  assetId: integer("asset_id").notNull().references(() => assets.id, { onDelete: 'cascade' }),

  createdAt: timestamp("created_at").defaultNow()

}, (table) => {

  return {

    paIdx: index("idx_paa_pa").on(table.processingActivityId),

    assetIdx: index("idx_paa_asset").on(table.assetId),

  };

});







export const dataBreaches = pgTable("data_breaches", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  description: text("description").notNull(),

  effects: text("effects").notNull(),

  remedialActions: text("remedial_actions").notNull(),

  dateOccurred: timestamp("date_occurred"),

  dateDetected: timestamp("date_detected"),

  dateReportedToDpa: timestamp("date_reported_to_dpa"),

  dateReportedToDataSubjects: timestamp("date_reported_to_data_subjects"),

  status: dataBreachStatusEnum("status").default("open"),

  isNotifiableToDpa: boolean("is_notifiable_to_dpa").default(false),

  isNotifiableToSubjects: boolean("is_notifiable_to_subjects").default(false),

  createdBy: integer("created_by"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_db_client_status").on(table.clientId, table.status),

  };

});



export const dpiaStatusEnum = pgEnum("dpia_status", ["draft", "in_progress", "under_review", "completed"]);



export const dataProtImpactAssessments = pgTable("data_protection_impact_assessments", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  activityId: integer("activity_id"), // Optional link to ROPA

  title: text("title").notNull(),

  description: text("description").notNull(),

  scope: text("scope").notNull(),

  identifiedRisks: text("identified_risks").notNull(),

  mitigationMeasures: text("mitigation_measures").notNull(),

  status: dpiaStatusEnum("status").default("draft"),

  assignedTo: integer("assigned_to"),

  lastReviewDate: timestamp("last_review_date"),

  questionnaireData: json("questionnaire_data"), // Full structured assessment data

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_dpia_client_status").on(table.clientId, table.status),

  };

});



export const internationalTransferStatusEnum = pgEnum("international_transfer_status", ["pending", "active", "expired", "risk_flagged"]);

export const transferToolEnum = pgEnum("transfer_tool", ["scc_2021", "bcr", "adequacy", "derogation", "ad_hoc"]);

export const sccModuleEnum = pgEnum("scc_module", ["c2c", "c2p", "p2p", "p2c"]);



export const adequacyDecisions = pgTable("adequacy_decisions", {

  id: serial("id").primaryKey(),

  countryCode: varchar("country_code", { length: 2 }).notNull().unique(), // ISO 2-letter

  countryName: varchar("country_name", { length: 255 }).notNull(),

  status: varchar("status", { length: 50 }).default("adequate"), // adequate, partial, withdrawn

  scope: text("scope"), // e.g. "Commercial organizations only"

  decisionUrl: text("decision_url"),

  lastUpdatedAt: timestamp("last_updated_at").defaultNow(),

});



export const internationalTransfers = pgTable("international_transfers", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  activityId: integer("activity_id"), // Link to ROPA

  vendorId: integer("vendor_id"), // Link to Vendor

  title: varchar("title", { length: 255 }).notNull(),

  destinationCountry: varchar("destination_country_code", { length: 2 }).notNull(),

  transferTool: transferToolEnum("transfer_tool").notNull(),

  sccModule: sccModuleEnum("scc_module"),

  status: internationalTransferStatusEnum("status").default("pending"),

  nextReviewDate: timestamp("next_review_date"),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_transfer_client").on(table.clientId),

    statusIdx: index("idx_transfer_status").on(table.status),

  };

});



export const transferImpactAssessments = pgTable("transfer_impact_assessments", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  transferId: integer("transfer_id").notNull(),

  riskLevel: varchar("risk_level", { length: 50 }), // low, medium, high

  status: varchar("status", { length: 50 }).default("draft"), // draft, completed, reassessment_required

  questionnaireData: json("questionnaire_data"), // EDPB 6-step assessment data

  version: integer("version").default(1),

  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    transferIdx: index("idx_tia_transfer").on(table.transferId),

  };

});





export const incidentSeverityEnum = pgEnum("incident_severity", ["low", "medium", "high", "critical"]);

export const incidentStatusEnum = pgEnum("incident_status", ["open", "investigating", "mitigated", "resolved", "reported"]);



export const incidents = pgTable("incidents", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 255 }).notNull().default("Untitled Incident"),

  detectedAt: timestamp("detected_at"),

  severity: incidentSeverityEnum("severity").default("low"),

  cause: varchar("cause", { length: 100 }), // malware, phishing, etc.

  description: text("description"),

  affectedAssets: text("affected_assets"),

  crossBorderImpact: boolean("cross_border_impact").default(false),

  status: incidentStatusEnum("status").default("open"),

  reportedToAuthorities: boolean("reported_to_authorities").default(false),

  reporterName: varchar("reporter_name", { length: 255 }),



  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientIdx: index("idx_incidents_client").on(table.clientId),

    statusIdx: index("idx_incidents_status").on(table.status),

  };

});















export const controlBaselines = pgTable("control_baselines", {

  id: serial("id").primaryKey(),

  controlId: varchar("control_id", { length: 50 }).notNull(), // Links to controls.controlId

  framework: varchar("framework", { length: 100 }).notNull(), // e.g., "NIST SP 800-53 Rev 5"

  baseline: varchar("baseline", { length: 20 }).notNull(), // "low", "moderate", "high"

}, (table) => {

  return {

    baselineIdx: index("idx_cb_baseline").on(table.framework, table.baseline),

    controlIdx: index("idx_cb_control").on(table.controlId),

  };

});



export type ControlBaseline = typeof controlBaselines.$inferSelect;

export type InsertControlBaseline = typeof controlBaselines.$inferInsert;



// ==========================================

// Task Assignments (RACI)

// ==========================================



export const taskAssignments = pgTable("task_assignments", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),



  // Task Identification

  taskType: varchar("task_type", { length: 50 }).notNull(), // 'control', 'policy', 'evidence', 'remediation_task'

  taskId: integer("task_id").notNull(),



  // Assignment

  userId: integer("user_id").notNull(), // Link to users table

  raciRole: raciRoleEnum("raci_role").notNull(), // responsible, accountable, consulted, informed



  // Metadata

  assignedAt: timestamp("assigned_at").defaultNow(),

  assignedBy: integer("assigned_by"),

}, (table) => {

  return {

    clientIdx: index("idx_ta_client").on(table.clientId),

    taskIdx: index("idx_ta_task").on(table.taskType, table.taskId),

    userIdx: index("idx_ta_user").on(table.userId),

    uniqueAssignment: uniqueIndex("idx_ta_unique").on(table.taskType, table.taskId, table.userId, table.raciRole),

  };

});



export type TaskAssignment = typeof taskAssignments.$inferSelect;

export type InsertTaskAssignment = typeof taskAssignments.$inferInsert;





// ==========================================

// Management Sign-off & Approvals

// ==========================================



export const approvalStatusEnum = pgEnum("approval_status", ["pending", "approved", "rejected"]);



export const approvalRequests = pgTable("approval_requests", {

  id: serial("id").primaryKey(),

  clientId: integer("client_id").notNull(),



  title: varchar("title", { length: 255 }).notNull(),

  description: text("description"),



  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'risk_treatment', 'policy', 'soa', etc.

  entityId: integer("entity_id").notNull(),



  status: approvalStatusEnum("status").default("pending"),



  submitterId: integer("submitter_id"), // FK to users

  submittedAt: timestamp("submitted_at").defaultNow(),



  requiredRoles: json("required_roles").$type<string[]>(), // e.g. ["CISO", "CEO"]



  updatedAt: timestamp("updated_at").defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),

}, (table) => {

  return {

    clientStatusIdx: index("idx_ar_client_status").on(table.clientId, table.status),

    entityIdx: index("idx_ar_entity").on(table.entityType, table.entityId),

  };

});



export type ApprovalRequest = typeof approvalRequests.$inferSelect;

export type InsertApprovalRequest = typeof approvalRequests.$inferInsert;



export const approvalSignatures = pgTable("approval_signatures", {

  id: serial("id").primaryKey(),

  requestId: integer("request_id").notNull(), // FK to approval_requests



  signerId: integer("signer_id").notNull(), // FK to users

  signerRole: varchar("signer_role", { length: 100 }).notNull(), // e.g. "CISO"



  status: varchar("status", { length: 50 }).default("signed"), // signed, rejected



  comment: text("comment"),

  signatureData: text("signature_data"), // Cryptographic hash or graphical data



  signedAt: timestamp("signed_at").defaultNow(),

}, (table) => {

  return {

    requestIdx: index("idx_as_request").on(table.requestId),

    signerIdx: index("idx_as_signer").on(table.signerId),

  };

});



export type ApprovalSignature = typeof approvalSignatures.$inferSelect;

export type InsertApprovalSignature = typeof approvalSignatures.$inferInsert;

// ==========================================
// ROADMAP REPORTS
// ==========================================

export const roadmapReports = pgTable("roadmap_reports", {
  id: serial("id").primaryKey(),
  roadmapId: integer("roadmap_id"),
  clientId: integer("client_id").notNull(),

  title: varchar("title", { length: 500 }).notNull(),
  version: varchar("version", { length: 50 }).default("draft"),

  content: text("content"), // Rich text HTML content for editing

  includedSections: jsonb("included_sections"),
  dataSources: jsonb("data_sources"),
  branding: jsonb("branding"),

  filePath: text("file_path"),
  fileSize: integer("file_size"),

  generatedAt: timestamp("generated_at").defaultNow(),
  generatedBy: integer("generated_by"),

  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_rr_client").on(table.clientId),
    roadmapIdx: index("idx_rr_roadmap").on(table.roadmapId),
    generatedByIdx: index("idx_rr_generated_by").on(table.generatedBy),
  };
});

export type RoadmapReport = typeof roadmapReports.$inferSelect;
export type InsertRoadmapReport = typeof roadmapReports.$inferInsert;


// ==========================================
// IMPLEMENTATION TEMPLATES
// ==========================================

export const implementationTemplates = pgTable("implementation_templates", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id"), // Null for system templates
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  estimatedHours: integer("estimated_hours").default(0),
  priority: varchar("priority", { length: 50 }).default("medium"),
  category: varchar("category", { length: 100 }), // e.g. "Security", "Compliance"

  // JSON Structure: [{ title, description, phase, estimatedHours }]
  // Phase is implied or explicit 1-3
  tasks: jsonb("tasks").default([]),

  riskMitigationFocus: jsonb("risk_mitigation_focus").$type<string[]>().default([]),

  isSystem: boolean("is_system").default(false),
  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ImplementationTemplate = typeof implementationTemplates.$inferSelect;
export type InsertImplementationTemplate = typeof implementationTemplates.$inferInsert;


// ==========================================
// Strategic Roadmap Reports (Rich Text)
// ==========================================

export const strategicReports = pgTable("strategic_reports", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Rich text HTML content

  roadmapId: integer("roadmap_id"), // Optional: Link to a strategic roadmap
  implementationPlanId: integer("implementation_plan_id"), // Optional: Link to an implementation plan

  status: varchar("status", { length: 50 }).default("draft"), // draft, review, final, archived
  version: varchar("version", { length: 50 }).default("1.0"),

  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_strat_rep_client").on(table.clientId),
    roadmapIdx: index("idx_strat_rep_roadmap").on(table.roadmapId),
  };
});


// ==========================================
// HARMONIZATION & COMMON CONTROLS (Phase 3)
// ==========================================

export const commonControls = pgTable("common_controls", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  domain: varchar("domain", { length: 100 }), // e.g. "Access Control", "Encryption"

  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const frameworkMappings = pgTable("framework_mappings", {
  id: serial("id").primaryKey(),

  // Source (e.g. ISO 27001)
  sourceFrameworkId: integer("source_framework_id"),
  sourceRequirementId: integer("source_requirement_id"),

  // Target (e.g. SOC 2)
  targetFrameworkId: integer("target_framework_id"),
  targetRequirementId: integer("target_requirement_id"),

  // Mapping Details
  strength: varchar("strength", { length: 50 }).default("related"), // exact, subset, superset, partial, related
  justification: text("justification"),

  // Common Control Link (Optional central hub)
  commonControlId: integer("common_control_id").references(() => commonControls.id),

  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CommonControl = typeof commonControls.$inferSelect;
export type InsertCommonControl = typeof commonControls.$inferInsert;


export type FrameworkMapping = typeof frameworkMappings.$inferSelect;
export type InsertFrameworkMapping = typeof frameworkMappings.$inferInsert;


// ==========================================
// CERTIFICATION & AUDITS (Phase 3)
// ==========================================

export const certificationAudits = pgTable("certification_audits", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  frameworkId: integer("framework_id").references(() => complianceFrameworks.id),

  auditFirm: varchar("audit_firm", { length: 255 }),
  auditorName: varchar("auditor_name", { length: 255 }),

  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),

  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, preparation, in_progress, fieldwork, findings_review, completed
  stage: varchar("stage", { length: 50 }), // stage_1, stage_2, surveillance, recertification

  outcome: varchar("outcome", { length: 50 }), // pass, fail, major_nc, minor_nc

  notes: text("notes"),
  reportUrl: text("report_url"),

  createdById: integer("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_audit_client").on(table.clientId),
    frameworkIdx: index("idx_audit_framework").on(table.frameworkId),
  };
});

export const complianceCertificates = pgTable("compliance_certificates", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  frameworkId: integer("framework_id").references(() => complianceFrameworks.id),
  auditId: integer("audit_id").references(() => certificationAudits.id),

  certificateNumber: varchar("certificate_number", { length: 255 }),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date").notNull(),

  status: varchar("status", { length: 50 }).default("active"), // active, expired, suspended, revoked

  documentUrl: text("document_url"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CertificationAudit = typeof certificationAudits.$inferSelect;
export type InsertCertificationAudit = typeof certificationAudits.$inferInsert;

export type ComplianceCertificate = typeof complianceCertificates.$inferSelect;
export type InsertComplianceCertificate = typeof complianceCertificates.$inferInsert;



// Developer Risk Management & Threat Modeling
// ==========================================

export const devProjects = pgTable("dev_projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  repositoryUrl: varchar("repository_url", { length: 500 }),
  techStack: json("tech_stack").$type<string[]>(), // e.g. ["React", "Node", "Postgres"]
  owner: varchar("owner", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_dev_proj_client").on(table.clientId),
  };
});

export type DevProject = typeof devProjects.$inferSelect;
export type InsertDevProject = typeof devProjects.$inferInsert;

export const threatModels = pgTable("threat_models", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  devProjectId: integer("dev_project_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  methodology: varchar("methodology", { length: 50 }).default('STRIDE'),
  status: varchar("status", { length: 50 }).default('draft'), // draft, active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    projectIdx: index("idx_tm_project").on(table.devProjectId),
    clientIdx: index("idx_tm_client").on(table.clientId),
  };
});

export type ThreatModel = typeof threatModels.$inferSelect;
export type InsertThreatModel = typeof threatModels.$inferInsert;

export const threatModelComponents = pgTable("threat_model_components", {
  id: serial("id").primaryKey(),
  threatModelId: integer("threat_model_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'Web Client', 'API', 'Database', 'External Service', etc.
  description: text("description"),
  x: integer("x").default(0),
  y: integer("y").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    tmIdx: index("idx_tm_comp_tm").on(table.threatModelId),
  };
});

export type ThreatModelComponent = typeof threatModelComponents.$inferSelect;
export type InsertThreatModelComponent = typeof threatModelComponents.$inferInsert;

export const threatModelDataFlows = pgTable("threat_model_data_flows", {
  id: serial("id").primaryKey(),
  threatModelId: integer("threat_model_id").notNull(),
  sourceComponentId: integer("source_component_id").notNull(),
  targetComponentId: integer("target_component_id").notNull(),
  protocol: varchar("protocol", { length: 50 }).default('HTTPS'), // HTTPS, HTTP, TCP, JDBC, IPC
  isEncrypted: boolean("is_encrypted").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    dfTmIdx: index("idx_tm_df_tm").on(table.threatModelId),
  };
});

export type ThreatModelDataFlow = typeof threatModelDataFlows.$inferSelect;
export type InsertThreatModelDataFlow = typeof threatModelDataFlows.$inferInsert;

// ==========================================
// TRUST CENTER & NDA GATEKEEPING
// ==========================================

export const trustCenterVisitors = pgTable("trust_center_visitors", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }),
  company: varchar("company", { length: 255 }),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const ndaSignatures = pgTable("nda_signatures", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  visitorId: integer("visitor_id").notNull(),
  ndaVersion: varchar("nda_version", { length: 50 }).default("v1.0"),
  signedAt: timestamp("signed_at").defaultNow(),
  signatureText: varchar("signature_text", { length: 255 }),
  ipAddress: varchar("ip_address", { length: 50 }),
});

export const trustDocuments = pgTable("trust_documents", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  isLocked: boolean("is_locked").default(false), // true = NDA required
  category: varchar("category", { length: 100 }), // Compliance, Security, Privacy
  createdAt: timestamp("created_at").defaultNow(),
});

export type TrustCenterVisitor = typeof trustCenterVisitors.$inferSelect;
export type InsertTrustCenterVisitor = typeof trustCenterVisitors.$inferInsert;

export type NdaSignature = typeof ndaSignatures.$inferSelect;
export type InsertNdaSignature = typeof ndaSignatures.$inferInsert;

export type TrustDocument = typeof trustDocuments.$inferSelect;
export type InsertTrustDocument = typeof trustDocuments.$inferInsert;

export const aiSystemStatusEnum = pgEnum("ai_system_status", ["evaluation", "development", "production", "monitoring", "retired"]);
export const aiRiskLevelEnum = pgEnum("ai_risk_level", ["low", "medium", "high", "critical", "unacceptable"]);

export const aiSystems = pgTable("ai_systems", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  purpose: text("purpose"), // MAP 1.1
  intendedUsers: text("intended_users"), // MAP 1.2
  deploymentContext: text("deployment_context"), // MAP 1.2
  type: varchar("type", { length: 100 }), // internal, 3rd-party, LLM, etc.
  riskLevel: aiRiskLevelEnum("risk_level").default("medium"),
  status: aiSystemStatusEnum("status").default("evaluation"),
  owner: varchar("owner", { length: 255 }),
  vendorId: integer("vendor_id"), // Linked to vendors table
  dataSensitivity: varchar("data_sensitivity", { length: 100 }),
  technicalConstraints: text("technical_constraints"), // MAP 1.4
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    clientIdx: index("idx_ais_client").on(table.clientId),
  };
});

export const aiImpactAssessments = pgTable("ai_impact_assessments", {
  id: serial("id").primaryKey(),
  aiSystemId: integer("ai_system_id").notNull(),
  assessorId: integer("assessor_id"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, final, review
  safetyImpact: text("safety_impact"),
  biasImpact: text("bias_impact"),
  privacyImpact: text("privacy_impact"),
  securityImpact: text("security_impact"),
  overallRiskScore: integer("overall_risk_score"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  nextReviewDate: timestamp("next_review_date"),
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    aiSystemIdx: index("idx_aiia_system").on(table.aiSystemId),
  };
});

// Join table to link AI Systems to Controls/Policies
export const aiSystemControls = pgTable("ai_system_controls", {
  id: serial("id").primaryKey(),
  aiSystemId: integer("ai_system_id").notNull(),
  controlId: integer("control_id").notNull(),
  status: varchar("status", { length: 50 }).default("mapped"), // mapped, implemented, verified
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => {
  return {
    aiSystemIdx: index("idx_aisc_system").on(table.aiSystemId),
    controlIdx: index("idx_aisc_control").on(table.controlId),
  };
});

export type AiSystem = typeof aiSystems.$inferSelect;
export type InsertAiSystem = typeof aiSystems.$inferInsert;

export type AiImpactAssessment = typeof aiImpactAssessments.$inferSelect;
export type InsertAiImpactAssessment = typeof aiImpactAssessments.$inferInsert;

export type AiSystemControl = typeof aiSystemControls.$inferSelect;
export type InsertAiSystemControl = typeof aiSystemControls.$inferInsert;



export const evidenceComments = pgTable("evidence_comments", {
  id: serial("id").primaryKey(),
  evidenceId: integer("evidence_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => {
  return {
    evidenceIdx: index("idx_evidence_comments_evidence").on(table.evidenceId),
    userIdx: index("idx_evidence_comments_user").on(table.userId),
  };
});

export type EvidenceComment = typeof evidenceComments.$inferSelect;
export type InsertEvidenceComment = typeof evidenceComments.$inferInsert;

