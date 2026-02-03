DO $$ BEGIN
 CREATE TYPE "consent_status" AS ENUM('active', 'withdrawn', 'expired', 'revoked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "consent_type" AS ENUM('marketing', 'analytics', 'functional', 'third_party', 'cookie');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "implementation_status" AS ENUM('not_started', 'planning', 'in_progress', 'testing', 'completed', 'blocked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "roadmap_status" AS ENUM('draft', 'active', 'on_track', 'delayed', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "governance_entity_type" ADD VALUE 'roadmap';--> statement-breakpoint
ALTER TYPE "governance_entity_type" ADD VALUE 'implementation_plan';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"consent_type" "consent_type" NOT NULL,
	"template_content" text NOT NULL,
	"granular_options" json,
	"retention_period" integer DEFAULT 2555,
	"is_active" boolean DEFAULT true,
	"version" varchar(20) DEFAULT '1.0',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consents" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"data_subject_id" varchar(255) NOT NULL,
	"consent_type" "consent_type" NOT NULL,
	"purpose" text NOT NULL,
	"legal_basis" text NOT NULL,
	"granular_consents" json,
	"consent_timestamp" timestamp DEFAULT now(),
	"ip_address" varchar(45),
	"user_agent" text,
	"consent_form" text,
	"withdrawal_timestamp" timestamp,
	"withdrawal_reason" text,
	"expiration_date" timestamp,
	"status" "consent_status" DEFAULT 'active',
	"retention_period" integer,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_baselines" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" varchar(50) NOT NULL,
	"framework" varchar(100) NOT NULL,
	"baseline" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_flow_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"flow_id" integer NOT NULL,
	"source_node_id" integer NOT NULL,
	"target_node_id" integer NOT NULL,
	"connection_type" varchar(50) NOT NULL,
	"data_type" varchar(100) NOT NULL,
	"frequency" varchar(50),
	"security_controls" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_flow_nodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"flow_id" integer NOT NULL,
	"node_type" varchar(50) NOT NULL,
	"node_name" varchar(255) NOT NULL,
	"node_description" text,
	"node_category" varchar(100),
	"position_x" integer DEFAULT 0,
	"position_y" integer DEFAULT 0,
	"node_metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_flow_visualizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"source_system" varchar(255) NOT NULL,
	"target_system" varchar(255) NOT NULL,
	"data_type" varchar(100) NOT NULL,
	"flow_type" varchar(100) NOT NULL,
	"process_id" integer,
	"legal_basis" text,
	"frequency" varchar(50),
	"volume" varchar(100),
	"security_measures" text,
	"countries" json,
	"flow_metadata" json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dpia_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"template_content" json,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dsar_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"request_type" varchar(100) NOT NULL,
	"template_content" json,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"roadmap_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "implementation_status" DEFAULT 'not_started',
	"priority" varchar(50) DEFAULT 'medium',
	"planned_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"estimated_hours" integer,
	"actual_hours" integer,
	"budget_amount" integer,
	"actual_cost" integer,
	"project_manager_id" integer,
	"team_member_ids" json,
	"linked_framework" varchar(100),
	"linked_controls" json,
	"risk_mitigation_focus" json,
	"prerequisites" json,
	"blocked_by" json,
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"implementation_plan_id" integer NOT NULL,
	"completed_tasks_count" integer DEFAULT 0,
	"total_tasks_count" integer DEFAULT 0,
	"overall_progress_percentage" integer DEFAULT 0,
	"status_change_date" timestamp DEFAULT now(),
	"previous_status" varchar(50),
	"new_status" varchar(50),
	"affected_milestone_ids" json,
	"milestone_progress_updates" json,
	"workflows_completed_count" integer DEFAULT 0,
	"workflows_blocked_count" integer DEFAULT 0,
	"quality_score" integer,
	"adherence_score" integer,
	"reported_by_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"implementation_plan_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status" "kanban_status" DEFAULT 'todo',
	"progress_percentage" integer DEFAULT 0,
	"assignee_id" integer,
	"reviewer_id" integer,
	"estimated_hours" integer,
	"actual_hours" integer,
	"planned_start_date" timestamp,
	"planned_end_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"dependencies" json,
	"blocked_by" json,
	"acceptance_criteria" text,
	"deliverables" json,
	"evidence_required" json,
	"risk_mitigation" text,
	"control_id" varchar(100),
	"tags" json,
	"priority" varchar(50) DEFAULT 'medium',
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_milestones" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmap_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"target_date" timestamp NOT NULL,
	"actual_date" timestamp,
	"status" varchar(50) DEFAULT 'pending',
	"dependencies" json,
	"progress_percentage" integer DEFAULT 0,
	"completed_items_count" integer DEFAULT 0,
	"total_items_count" integer DEFAULT 0,
	"is_gate" boolean DEFAULT false,
	"priority" varchar(50) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmaps" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"vision" text,
	"objectives" json,
	"framework" varchar(100),
	"status" "roadmap_status" DEFAULT 'draft',
	"start_date" timestamp,
	"target_date" timestamp,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"kpi_targets" json,
	"created_by_id" integer NOT NULL,
	"approved_by_id" integer,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_dpas" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"template_id" integer,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"status" varchar(50) DEFAULT 'Draft',
	"version" integer DEFAULT 1,
	"signed_at" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "dsar_requests" ALTER COLUMN "response_data" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "ai_usage_metrics" ADD COLUMN "entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "ai_usage_metrics" ADD COLUMN "entity_id" integer;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "entity_id" integer;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "dsar_requests" ADD COLUMN "priority" varchar(20) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "dsar_requests" ADD COLUMN "verification_method" varchar(100);--> statement-breakpoint
ALTER TABLE "dsar_requests" ADD COLUMN "submission_method" varchar(50) DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "dsar_requests" ADD COLUMN "audit_log" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "entity_id" varchar(100);--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "embedding" "vector(1536)";--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consent_client" ON "consents" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consent_subject" ON "consents" ("data_subject_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_consent_status" ON "consents" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cb_baseline" ON "control_baselines" ("framework","baseline");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cb_control" ON "control_baselines" ("control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dataflow_client" ON "data_flow_visualizations" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dataflow_process" ON "data_flow_visualizations" ("process_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dataflow_source" ON "data_flow_visualizations" ("source_system");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dataflow_target" ON "data_flow_visualizations" ("target_system");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_plan_client_status" ON "implementation_plans" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_plan_roadmap" ON "implementation_plans" ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_plan_timeline" ON "implementation_plans" ("planned_start_date","planned_end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_progress_plan" ON "implementation_progress" ("implementation_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_progress_date" ON "implementation_progress" ("status_change_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_task_plan" ON "implementation_tasks" ("implementation_plan_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_task_assignee" ON "implementation_tasks" ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_impl_task_status" ON "implementation_tasks" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_milestone_roadmap" ON "roadmap_milestones" ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_milestone_target" ON "roadmap_milestones" ("target_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roadmap_client_status" ON "roadmaps" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_roadmap_framework" ON "roadmaps" ("framework");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vdpa_client_vendor" ON "vendor_dpas" ("client_id","vendor_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_flow_connections" ADD CONSTRAINT "data_flow_connections_flow_id_data_flow_visualizations_id_fk" FOREIGN KEY ("flow_id") REFERENCES "data_flow_visualizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_flow_connections" ADD CONSTRAINT "data_flow_connections_source_node_id_data_flow_nodes_id_fk" FOREIGN KEY ("source_node_id") REFERENCES "data_flow_nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_flow_connections" ADD CONSTRAINT "data_flow_connections_target_node_id_data_flow_nodes_id_fk" FOREIGN KEY ("target_node_id") REFERENCES "data_flow_nodes"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "data_flow_nodes" ADD CONSTRAINT "data_flow_nodes_flow_id_data_flow_visualizations_id_fk" FOREIGN KEY ("flow_id") REFERENCES "data_flow_visualizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
