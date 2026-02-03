DO $$ BEGIN
 CREATE TYPE "report_type" AS ENUM('executive_summary', 'controls', 'policies', 'evidence', 'mappings', 'soa', 'compliance_readiness', 'audit_bundle');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255),
	"department" varchar(255),
	"role" varchar(100),
	"phone" varchar(50),
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_deal_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"order" integer DEFAULT 0,
	"win_probability" integer,
	"color" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"value" integer,
	"currency" varchar(10) DEFAULT 'USD',
	"stage_id" integer NOT NULL,
	"lead_id" integer,
	"client_id" integer,
	"owner_id" integer,
	"expected_close_date" timestamp,
	"probability" integer,
	"notes" text,
	"status" varchar(50) DEFAULT 'open',
	"lost_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"company_name" varchar(255),
	"job_title" varchar(255),
	"status" varchar(50) DEFAULT 'new',
	"source" varchar(100),
	"notes" text,
	"owner_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_sar_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"sar_id" integer NOT NULL,
	"control_id" varchar(50) NOT NULL,
	"result" varchar(50) DEFAULT 'other_than_satisfied',
	"observation" text,
	"risk_level" varchar(20),
	"remediation_plan" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_ssp_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"ssp_id" integer NOT NULL,
	"control_id" varchar(50) NOT NULL,
	"implementation_status" varchar(50) DEFAULT 'not_implemented',
	"implementation_description" text,
	"responsible_role" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_ssp_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"ssp_id" integer NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"content" json,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"role" varchar(255),
	"phone" varchar(50),
	"source" varchar(50) DEFAULT 'manual',
	"status" varchar(50) DEFAULT 'lead',
	"notes" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "global_contacts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_crm_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(255),
	"description" text,
	"outcome" varchar(100),
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"duration" integer,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_crm_contact_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"tag_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_crm_deals" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"value" integer NOT NULL,
	"probability" integer DEFAULT 0,
	"stage" varchar(50) NOT NULL,
	"expected_close_date" timestamp,
	"description" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_crm_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"contact_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_pinned" boolean DEFAULT false,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "global_crm_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(20),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "global_crm_tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"file_url" varchar(1024) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"classification" varchar(255),
	"confidence" integer,
	"details" json,
	"uploaded_by" integer,
	"processed_by" integer,
	"mapped_evidence_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "report_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" integer,
	"report_type" "report_type" NOT NULL,
	"format" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_scenario_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"risk_id" integer NOT NULL,
	"scenario_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "waiting_list" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"first_name" varchar(255),
	"last_name" varchar(255),
	"company" varchar(255),
	"role" varchar(255),
	"certification" varchar(255),
	"org_size" varchar(100),
	"industry" varchar(255),
	"status" varchar(50) DEFAULT 'pending',
	"source" varchar(50) DEFAULT 'landing_page',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "waiting_list_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "controls" DROP CONSTRAINT "controls_control_id_unique";--> statement-breakpoint
ALTER TABLE "notification_settings" DROP CONSTRAINT "notification_settings_user_id_unique";--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "is_personal_data" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "data_sensitivity" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "data_format" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "data_owner" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "service_model" varchar(50) DEFAULT 'subscription';--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "weekly_focus" text;--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "client_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "assignee_id" integer;--> statement-breakpoint
ALTER TABLE "recovery_objectives" ADD COLUMN "activity" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "recovery_objectives" ADD COLUMN "criticality" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "max_clients" integer DEFAULT 2;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_seen_tour" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan_tier" varchar(50) DEFAULT 'free';--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_clc_client" ON "client_contacts" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gc_email" ON "global_contacts" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gc_status" ON "global_contacts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gcrm_act_contact" ON "global_crm_activities" ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gcrm_act_type" ON "global_crm_activities" ("type");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_gcrm_contact_tag" ON "global_crm_contact_tags" ("contact_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gcrm_deals_contact" ON "global_crm_deals" ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gcrm_deals_stage" ON "global_crm_deals" ("stage");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gcrm_notes_contact" ON "global_crm_notes" ("contact_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intake_client" ON "intake_items" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_intake_status" ON "intake_items" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rl_client" ON "report_logs" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rl_type" ON "report_logs" ("report_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rsl_risk" ON "risk_scenario_links" ("risk_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rsl_scenario" ON "risk_scenario_links" ("scenario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rsl_unique" ON "risk_scenario_links" ("risk_id","scenario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_controls_framework" ON "controls" ("framework");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_controls_client" ON "controls" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ns_client" ON "notification_settings" ("client_id");--> statement-breakpoint
ALTER TABLE "notification_settings" DROP COLUMN IF EXISTS "user_id";--> statement-breakpoint
ALTER TABLE "notification_settings" DROP COLUMN IF EXISTS "push_enabled";--> statement-breakpoint
ALTER TABLE "notification_settings" DROP COLUMN IF EXISTS "frequency";--> statement-breakpoint
ALTER TABLE "recovery_objectives" DROP COLUMN IF EXISTS "activity_name";--> statement-breakpoint
ALTER TABLE "recovery_objectives" DROP COLUMN IF EXISTS "criticality_level";