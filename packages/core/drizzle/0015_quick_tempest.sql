DO $$ BEGIN
 CREATE TYPE "maturity_framework_status" AS ENUM('draft', 'active', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "evidence_status" ADD VALUE 'rejected';--> statement-breakpoint
ALTER TYPE "role" ADD VALUE 'auditor';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asvs_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"requirement_id" varchar(20) NOT NULL,
	"status" varchar(50) DEFAULT 'unanswered',
	"notes" text,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"assessed_by" integer,
	"assessment_date" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asvs_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "asvs_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asvs_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_code" varchar(10) NOT NULL,
	"chapter_id" varchar(20) NOT NULL,
	"chapter_name" varchar(255),
	"requirement_id" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"level_1" boolean DEFAULT false,
	"level_2" boolean DEFAULT false,
	"level_3" boolean DEFAULT false,
	"cwe" varchar(50),
	"nist" varchar(50),
	"version" varchar(20) DEFAULT '4.0.3',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "asvs_requirements_requirement_id_unique" UNIQUE("requirement_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject" text NOT NULL,
	"content" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_triggers" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_slug" varchar(255) NOT NULL,
	"template_id" integer,
	"description" text,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "email_triggers_event_slug_unique" UNIQUE("event_slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "essential_eight_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"control_id" varchar(80) NOT NULL,
	"maturity_level" integer DEFAULT 0 NOT NULL,
	"target_level" integer DEFAULT 1 NOT NULL,
	"assessment_answers" jsonb DEFAULT '{}'::jsonb,
	"quality_criteria" jsonb DEFAULT '{}'::jsonb,
	"level_notes" jsonb DEFAULT '{}'::jsonb,
	"outcome" varchar(30) DEFAULT 'not_assessed' NOT NULL,
	"evidence_quality" varchar(20) DEFAULT 'poor' NOT NULL,
	"evidence_quality_by_level" jsonb DEFAULT '{}'::jsonb,
	"sample_coverage" jsonb DEFAULT '{}'::jsonb,
	"compensating_controls" jsonb DEFAULT '[]'::jsonb,
	"evidence_links" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_disa_stig_checklists" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"category" varchar(100),
	"asset_identifier" varchar(255),
	"overall_status" varchar(50),
	"findings_count" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_fedramp_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"impact_level" varchar(20),
	"authorization_type" varchar(50),
	"agency_name" varchar(255),
	"provisioning_status" varchar(50),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_fips_140_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"module_name" varchar(255) NOT NULL,
	"vendor" varchar(255),
	"certificate_number" varchar(50),
	"validation_level" varchar(20),
	"validation_version" varchar(20),
	"status" varchar(50),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_fips_categorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"ssp_id" integer NOT NULL,
	"security_objective_confidentiality" varchar(20) DEFAULT 'low',
	"security_objective_integrity" varchar(20) DEFAULT 'low',
	"security_objective_availability" varchar(20) DEFAULT 'low',
	"rationale_confidentiality" text,
	"rationale_integrity" text,
	"rationale_availability" text,
	"information_types" json DEFAULT '[]'::json,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "federal_fips_categorizations_ssp_id_unique" UNIQUE("ssp_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_fisma_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"reporting_period" varchar(100),
	"system_impact" varchar(20),
	"overall_status" varchar(50),
	"metrics" json,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_nist_800_53_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"ssp_id" integer,
	"control_id" varchar(50) NOT NULL,
	"implementation_status" varchar(50),
	"implementation_description" text,
	"test_results" text,
	"compliance_status" varchar(50),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_rmf_workflows" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"system_name" varchar(255) NOT NULL,
	"current_step" integer DEFAULT 1,
	"step_status" json,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_sprs_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"score" integer DEFAULT 110,
	"assessment_date" timestamp DEFAULT now(),
	"scope_description" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magic_link_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"magic_link_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"redeemed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "magic_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(255) NOT NULL,
	"label" varchar(255),
	"email" varchar(255),
	"role" varchar(50) DEFAULT 'viewer',
	"plan_tier" varchar(50) DEFAULT 'free',
	"max_clients" integer DEFAULT 2,
	"access_duration_type" varchar(50),
	"access_duration_days" integer,
	"waitlist_id" integer,
	"status" varchar(50) DEFAULT 'active',
	"created_by_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"usage_limit" integer DEFAULT 1,
	"use_count" integer DEFAULT 0,
	"restricted_domains" json,
	CONSTRAINT "magic_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samm_maturity_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"practice_id" varchar(50) NOT NULL,
	"maturity_level" integer DEFAULT 0 NOT NULL,
	"target_level" integer DEFAULT 1 NOT NULL,
	"evidence_links" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samm_practices" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" varchar(10) NOT NULL,
	"practice_name" varchar(100) NOT NULL,
	"description" text,
	"business_function" varchar(50) NOT NULL,
	"stream_a_name" varchar(100),
	"stream_a_description" text,
	"stream_b_name" varchar(100),
	"stream_b_description" text,
	"official_link" varchar(500),
	"order" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "samm_practices_practice_id_unique" UNIQUE("practice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samm_stream_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"practice_id" varchar(10) NOT NULL,
	"stream_id" varchar(1) NOT NULL,
	"maturity_level" integer DEFAULT 0 NOT NULL,
	"target_level" integer DEFAULT 1 NOT NULL,
	"assessment_answers" jsonb DEFAULT '{}'::jsonb,
	"quality_criteria" jsonb DEFAULT '{}'::jsonb,
	"assessment_date" timestamp,
	"assessed_by" integer,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"improvement_notes" text,
	"level_notes" jsonb DEFAULT '{}'::jsonb,
	"criteria_notes" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "samm_stream_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"practice_id" varchar(10) NOT NULL,
	"practice_name" varchar(100) NOT NULL,
	"stream_id" varchar(1) NOT NULL,
	"stream_name" varchar(100) NOT NULL,
	"stream_description" text,
	"level" integer NOT NULL,
	"level_name" varchar(50),
	"question" text NOT NULL,
	"quality_criteria" jsonb DEFAULT '[]'::jsonb,
	"activities" jsonb DEFAULT '[]'::jsonb,
	"benefits" text,
	"maturity_indicators" jsonb DEFAULT '[]'::jsonb,
	"suggested_evidence" jsonb DEFAULT '[]'::jsonb,
	"business_function" varchar(50) NOT NULL,
	"official_link" varchar(500),
	"is_active" boolean DEFAULT true,
	"version" varchar(20) DEFAULT '2.0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"requirement_id" integer NOT NULL,
	"is_achieved" boolean DEFAULT false,
	"notes" text,
	"evidence" jsonb DEFAULT '[]'::jsonb,
	"is_target" boolean DEFAULT false,
	"assessed_by" integer,
	"assessment_date" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"parent_id" integer,
	"code" varchar(20) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_client_frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"overall_score" integer DEFAULT 0,
	"target_score" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'not_started',
	"last_assessed_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_frameworks" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"version" varchar(20),
	"logo" varchar(255),
	"levels" jsonb NOT NULL,
	"status" "maturity_framework_status" DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"category_id" integer NOT NULL,
	"code" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"level" integer NOT NULL,
	"order" integer DEFAULT 0,
	"benefits" text,
	"activities" jsonb DEFAULT '[]'::jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "maturity_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"framework_id" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"results" jsonb,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
ALTER TABLE "policy_exceptions" ALTER COLUMN "policy_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "scan_key" varchar(255);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "require_mfa" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "employee_asset_receipts" ADD COLUMN "expires_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "federal_ssp_controls" ADD COLUMN "evidence_links" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "policy_exceptions" ADD COLUMN "requirement_id" integer;--> statement-breakpoint
ALTER TABLE "policy_exceptions" ADD COLUMN "policy_type" varchar(50) DEFAULT 'policy';--> statement-breakpoint
ALTER TABLE "policy_templates" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "user_clients" ADD COLUMN "access_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "access_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "vendor_assessments" ADD COLUMN "review_status" varchar(50) DEFAULT 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_asvs_client_req" ON "asvs_assessments" ("client_id","requirement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asvs_client_status" ON "asvs_assessments" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asvs_req_category" ON "asvs_requirements" ("category_code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_asvs_req_id" ON "asvs_requirements" ("requirement_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_e8_client_control" ON "essential_eight_assessments" ("client_id","control_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_samm_client_practice" ON "samm_maturity_assessments" ("client_id","practice_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_samm_client_practice_stream" ON "samm_stream_assessments" ("client_id","practice_id","stream_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_samm_practice_stream_level" ON "samm_stream_questions" ("practice_id","stream_id","level");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_maturity_client_framework_req" ON "maturity_assessments" ("client_id","framework_id","requirement_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_maturity_client_framework" ON "maturity_client_frameworks" ("client_id","framework_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "email_triggers" ADD CONSTRAINT "email_triggers_template_id_email_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "email_templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
