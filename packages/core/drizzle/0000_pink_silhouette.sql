DO $$ BEGIN
 CREATE TYPE "client_control_status" AS ENUM('not_implemented', 'in_progress', 'implemented', 'not_applicable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "cloud_provider" AS ENUM('aws', 'azure', 'gcp');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "control_status" AS ENUM('active', 'inactive', 'draft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "evidence_status" AS ENUM('pending', 'collected', 'verified', 'expired', 'not_applicable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "policy_review_status" AS ENUM('analyzing', 'completed', 'applying_changes', 'applied', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "policy_status" AS ENUM('draft', 'review', 'approved', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "raci_role" AS ENUM('responsible', 'accountable', 'consulted', 'informed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "role" AS ENUM('owner', 'admin', 'editor', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "task_type" AS ENUM('control', 'policy', 'evidence', 'mapping');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advisor_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"client_id" integer,
	"conversation_id" varchar(100) NOT NULL,
	"title" varchar(500),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "advisor_conversations_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "advisor_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"sources" json,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"user_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer,
	"details" json,
	"severity" varchar(20) DEFAULT 'info',
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"control_id" integer NOT NULL,
	"user_id" integer,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"control_id" integer NOT NULL,
	"client_control_id" varchar(50),
	"custom_description" text,
	"owner" varchar(255),
	"applicability" varchar(50) DEFAULT 'applicable',
	"justification" text,
	"implementation_date" timestamp,
	"implementation_notes" text,
	"evidence_location" text,
	"status" "client_control_status" DEFAULT 'not_implemented',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"template_id" integer,
	"client_policy_id" varchar(50),
	"name" varchar(255) NOT NULL,
	"content" text,
	"status" "policy_status" DEFAULT 'draft',
	"version" integer DEFAULT 1,
	"owner" varchar(255),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_readiness_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"regulation_id" varchar(50) NOT NULL,
	"question_id" varchar(50) NOT NULL,
	"response" varchar(50),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"industry" varchar(255),
	"size" varchar(50),
	"status" varchar(50) DEFAULT 'active',
	"notes" text,
	"logo_url" varchar(1024),
	"primary_contact_name" varchar(255),
	"primary_contact_email" varchar(255),
	"primary_contact_phone" varchar(50),
	"deployment_type" varchar(50),
	"region" varchar(100),
	"client_tier" varchar(50),
	"target_compliance_score" integer DEFAULT 80,
	"ciso_name" varchar(255),
	"dpo_name" varchar(255),
	"headquarters" varchar(255),
	"main_service_region" varchar(255),
	"policy_language" varchar(50) DEFAULT 'en',
	"legal_entity_name" varchar(500),
	"regulatory_jurisdictions" json,
	"default_document_classification" varchar(50) DEFAULT 'internal',
	"stripe_customer_id" varchar(255),
	"subscription_status" varchar(50),
	"plan_tier" varchar(50) DEFAULT 'free',
	"subscription_end_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cloud_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"connection_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"asset_type" varchar(100) NOT NULL,
	"asset_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"region" varchar(100),
	"metadata" json,
	"compliance_status" varchar(50) DEFAULT 'unknown',
	"last_scanned_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cloud_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"credentials" text NOT NULL,
	"region" varchar(100),
	"status" varchar(50) DEFAULT 'pending',
	"last_sync_at" timestamp,
	"error_message" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" integer NOT NULL,
	"version" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"framework" varchar(255),
	"owner" varchar(255),
	"frequency" varchar(50),
	"evidence_type" varchar(100),
	"changed_by" integer,
	"change_note" text,
	"changed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_control_id" integer NOT NULL,
	"target_control_id" integer NOT NULL,
	"relationship" varchar(50) DEFAULT 'equivalent',
	"confidence" integer DEFAULT 100,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_policy_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"client_control_id" integer NOT NULL,
	"client_policy_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "control_tech_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_code" varchar(50) NOT NULL,
	"framework" varchar(100) NOT NULL,
	"tech_id" varchar(100) NOT NULL,
	"vendor" varchar(100),
	"service_name" varchar(200),
	"description" text,
	"pros" json,
	"cons" json,
	"implementation_effort" varchar(50),
	"maturity_level" varchar(50),
	"references" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"control_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"framework" varchar(255) NOT NULL,
	"owner" varchar(255),
	"frequency" varchar(50),
	"evidence_type" varchar(100),
	"status" "control_status" DEFAULT 'draft',
	"version" integer DEFAULT 1 NOT NULL,
	"category" varchar(255),
	"grouping" varchar(255),
	"implementation_guidance" text,
	"suggested_policies" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "controls_control_id_unique" UNIQUE("control_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "embeddings" (
	"id" serial PRIMARY KEY NOT NULL,
	"doc_id" varchar(100) NOT NULL,
	"doc_type" varchar(50) NOT NULL,
	"embedding_data" text,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_task_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"task_type" "task_type" NOT NULL,
	"task_id" integer NOT NULL,
	"raci_role" "raci_role" NOT NULL,
	"notes" text,
	"due_date" timestamp,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employees" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"job_title" varchar(255),
	"department" varchar(255),
	"role" varchar(255),
	"employment_status" varchar(50),
	"start_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"client_control_id" integer NOT NULL,
	"evidence_id" varchar(50) NOT NULL,
	"description" text,
	"type" varchar(100),
	"status" "evidence_status" DEFAULT 'pending',
	"owner" varchar(255),
	"location" varchar(1024),
	"last_verified" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_files" (
	"id" serial PRIMARY KEY NOT NULL,
	"evidence_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"file_key" varchar(1024) NOT NULL,
	"content_type" varchar(100),
	"file_size" integer,
	"uploaded_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"client_control_id" integer NOT NULL,
	"requester_id" integer NOT NULL,
	"assignee_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'open',
	"due_date" timestamp,
	"description" text,
	"evidence_id" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "issue_tracker_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"base_url" varchar(1024),
	"credentials" text NOT NULL,
	"project_key" varchar(100),
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_articles" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"body" text NOT NULL,
	"tags" json,
	"source" varchar(255),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_providers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"api_key" text NOT NULL,
	"base_url" varchar(512),
	"priority" integer DEFAULT 0,
	"is_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50),
	"title" varchar(255),
	"message" text,
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"email_enabled" boolean DEFAULT true,
	"push_enabled" boolean DEFAULT false,
	"frequency" varchar(50) DEFAULT 'daily',
	CONSTRAINT "notification_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_review_results" (
	"id" serial PRIMARY KEY NOT NULL,
	"policy_review_id" integer NOT NULL,
	"overall_score" integer,
	"gaps" json,
	"compliance" json,
	"recommendations" json,
	"improved_policy_content" text,
	"ai_provider" varchar(100),
	"ai_model" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"policy_review_id" varchar(50) NOT NULL,
	"policy_name" varchar(500) NOT NULL,
	"policy_content" text NOT NULL,
	"selected_requirements" json,
	"status" "policy_review_status" DEFAULT 'analyzing',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "policy_reviews_policy_review_id_unique" UNIQUE("policy_review_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"template_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text,
	"sections" json,
	"frameworks" json,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "policy_templates_template_id_unique" UNIQUE("template_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "policy_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_policy_id" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"content" text,
	"status" varchar(50),
	"description" text,
	"published_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "regulation_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"regulation_id" varchar(50) NOT NULL,
	"article_id" varchar(50) NOT NULL,
	"mapped_type" varchar(50) NOT NULL,
	"mapped_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "remediation_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"client_control_id" integer,
	"title" varchar(500) NOT NULL,
	"description" text,
	"priority" varchar(50) DEFAULT 'medium',
	"status" varchar(50) DEFAULT 'open',
	"due_date" timestamp,
	"assignee_id" integer,
	"issue_tracker_connection_id" integer,
	"external_issue_id" varchar(255),
	"external_issue_url" varchar(1024),
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tech_suggestions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"control_id" integer NOT NULL,
	"suggestion_text" text NOT NULL,
	"tech_id" varchar(100),
	"vendor" varchar(100),
	"sources" json,
	"created_by" varchar(50) DEFAULT 'ai',
	"created_at" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'proposed',
	"feedback" text,
	"applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"client_id" integer NOT NULL,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_invitations" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'viewer' NOT NULL,
	"client_id" integer,
	"invited_by" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(255) NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"login_method" varchar(255),
	"last_signed_in" timestamp DEFAULT now(),
	"role" varchar(50) DEFAULT 'user',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_am_conversation" ON "advisor_messages" ("conversation_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_al_client_time" ON "audit_logs" ("client_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cc_client" ON "client_controls" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cc_client_status" ON "client_controls" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cp_client" ON "client_policies" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cp_client_status" ON "client_policies" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ctm_control_framework" ON "control_tech_mappings" ("control_code","framework");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ctm_tech" ON "control_tech_mappings" ("tech_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emb_doctype" ON "embeddings" ("doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emb_docid" ON "embeddings" ("doc_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ev_client" ON "evidence" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ev_client_status" ON "evidence" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rm_client_reg_art" ON "regulation_mappings" ("client_id","regulation_id","article_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ts_client" ON "tech_suggestions" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ts_control" ON "tech_suggestions" ("control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_uc_user" ON "user_clients" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_uc_client" ON "user_clients" ("client_id");