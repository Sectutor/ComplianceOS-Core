DO $$ BEGIN
 CREATE TYPE "data_breach_status" AS ENUM('open', 'investigating', 'closed', 'reported');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "dpia_status" AS ENUM('draft', 'in_progress', 'under_review', 'completed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "incident_severity" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "incident_status" AS ENUM('open', 'investigating', 'mitigated', 'resolved', 'reported');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "international_transfer_status" AS ENUM('pending', 'active', 'expired', 'risk_flagged');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "policy_module" AS ENUM('general', 'privacy');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "scc_module" AS ENUM('c2c', 'c2p', 'p2p', 'p2c');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transfer_tool" AS ENUM('scc_2021', 'bcr', 'adequacy', 'derogation', 'ad_hoc');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "adequacy_decisions" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"country_name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'adequate',
	"scope" text,
	"decision_url" text,
	"last_updated_at" timestamp DEFAULT now(),
	CONSTRAINT "adequacy_decisions_country_code_unique" UNIQUE("country_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_breaches" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"description" text NOT NULL,
	"effects" text NOT NULL,
	"remedial_actions" text NOT NULL,
	"date_occurred" timestamp,
	"date_detected" timestamp,
	"date_reported_to_dpa" timestamp,
	"date_reported_to_data_subjects" timestamp,
	"status" "data_breach_status" DEFAULT 'open',
	"is_notifiable_to_dpa" boolean DEFAULT false,
	"is_notifiable_to_subjects" boolean DEFAULT false,
	"created_by" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "data_protection_impact_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"activity_id" integer,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"scope" text NOT NULL,
	"identified_risks" text NOT NULL,
	"mitigation_measures" text NOT NULL,
	"status" "dpia_status" DEFAULT 'draft',
	"assigned_to" integer,
	"last_review_date" timestamp,
	"questionnaire_data" json,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dpa_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"version" integer DEFAULT 1,
	"is_default" boolean DEFAULT false,
	"jurisdiction" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) DEFAULT 'Untitled Incident' NOT NULL,
	"detected_at" timestamp,
	"severity" "incident_severity" DEFAULT 'low',
	"cause" varchar(100),
	"description" text,
	"affected_assets" text,
	"cross_border_impact" boolean DEFAULT false,
	"status" "incident_status" DEFAULT 'open',
	"reported_to_authorities" boolean DEFAULT false,
	"reporter_name" varchar(255),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "international_transfers" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"activity_id" integer,
	"vendor_id" integer,
	"title" varchar(255) NOT NULL,
	"destination_country_code" varchar(2) NOT NULL,
	"transfer_tool" "transfer_tool" NOT NULL,
	"scc_module" "scc_module",
	"status" "international_transfer_status" DEFAULT 'pending',
	"next_review_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "knowledge_base_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"question" text NOT NULL,
	"answer" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"access" varchar(50) DEFAULT 'internal',
	"assignee_id" integer,
	"health" varchar(50),
	"comments" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processing_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"activity_name" text NOT NULL,
	"activity_id" text NOT NULL,
	"description" text,
	"role" varchar(50) NOT NULL,
	"controller_name" text,
	"controller_contact" text,
	"dpo_name" text,
	"dpo_contact" text,
	"representative_name" text,
	"representative_contact" text,
	"purposes" json DEFAULT '[]'::json NOT NULL,
	"legal_basis" varchar(100) NOT NULL,
	"data_categories" json DEFAULT '[]'::json NOT NULL,
	"data_subject_categories" json DEFAULT '[]'::json NOT NULL,
	"special_categories" json DEFAULT '[]'::json,
	"recipients" json DEFAULT '[]'::json NOT NULL,
	"recipient_categories" json DEFAULT '[]'::json,
	"has_international_transfers" boolean DEFAULT false,
	"transfer_countries" json DEFAULT '[]'::json,
	"transfer_safeguards" text,
	"transfer_details" text,
	"retention_period" text,
	"retention_criteria" text,
	"deletion_procedure" text,
	"technical_measures" json DEFAULT '[]'::json,
	"organizational_measures" json DEFAULT '[]'::json,
	"security_description" text,
	"status" varchar(50) DEFAULT 'draft',
	"last_review_date" timestamp,
	"next_review_date" timestamp,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processing_activity_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"processing_activity_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processing_activity_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"processing_activity_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"role" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questionnaire_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"questionnaire_id" integer NOT NULL,
	"question_id" text,
	"question" text NOT NULL,
	"answer" text,
	"comment" text,
	"tags" json DEFAULT '[]'::json,
	"access" varchar(50) DEFAULT 'internal',
	"assignee_id" integer,
	"confidence" integer,
	"sources" json DEFAULT '[]'::json,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" text NOT NULL,
	"sender_name" text,
	"product_name" text,
	"status" varchar(50) DEFAULT 'open',
	"progress" integer DEFAULT 0,
	"due_date" timestamp,
	"owner_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transfer_impact_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"transfer_id" integer NOT NULL,
	"risk_level" varchar(50),
	"status" varchar(50) DEFAULT 'draft',
	"questionnaire_data" json,
	"version" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_authorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"initiated_by" integer,
	"status" varchar(50) DEFAULT 'Pending',
	"notification_date" timestamp,
	"objection_deadline" timestamp,
	"approval_date" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_change_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"change_type" varchar(50) NOT NULL,
	"description" text,
	"old_value" json,
	"new_value" json,
	"detected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "category" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "criticality" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "ip_address" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "mac_address" varchar(50);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "os" varchar(100);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "custom_fields" json;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "tags" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "client_policies" ADD COLUMN "module" varchar(50) DEFAULT 'general';--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "is_subprocessor" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "data_location" varchar(255);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "transfer_mechanism" varchar(255);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "recursive_subprocessors" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "dpa_analysis" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "last_trust_center_change" timestamp;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_db_client_status" ON "data_breaches" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dpia_client_status" ON "data_protection_impact_assessments" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidents_client" ON "incidents" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_incidents_status" ON "incidents" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfer_client" ON "international_transfers" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_transfer_status" ON "international_transfers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kb_client" ON "knowledge_base_entries" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kb_question" ON "knowledge_base_entries" ("question");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pa_client" ON "processing_activities" ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pa_activity_id" ON "processing_activities" ("activity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pa_status" ON "processing_activities" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_paa_pa" ON "processing_activity_assets" ("processing_activity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_paa_asset" ON "processing_activity_assets" ("asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pav_pa" ON "processing_activity_vendors" ("processing_activity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pav_vendor" ON "processing_activity_vendors" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_qq_questionnaire" ON "questionnaire_questions" ("questionnaire_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_qn_client" ON "questionnaires" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_qn_status" ON "questionnaires" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tia_transfer" ON "transfer_impact_assessments" ("transfer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_va_client_vendor" ON "vendor_authorizations" ("client_id","vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vcl_client_vendor" ON "vendor_change_logs" ("client_id","vendor_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activities" ADD CONSTRAINT "processing_activities_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activities" ADD CONSTRAINT "processing_activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activity_assets" ADD CONSTRAINT "processing_activity_assets_processing_activity_id_processing_activities_id_fk" FOREIGN KEY ("processing_activity_id") REFERENCES "processing_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activity_assets" ADD CONSTRAINT "processing_activity_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activity_vendors" ADD CONSTRAINT "processing_activity_vendors_processing_activity_id_processing_activities_id_fk" FOREIGN KEY ("processing_activity_id") REFERENCES "processing_activities"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processing_activity_vendors" ADD CONSTRAINT "processing_activity_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_questionnaire_id_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "questionnaires"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questionnaire_questions" ADD CONSTRAINT "questionnaire_questions_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
