CREATE TABLE IF NOT EXISTS "compliance_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"key" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_mandatory" boolean DEFAULT true,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "framework_knowledge_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_requirement_id" integer NOT NULL,
	"target_type" varchar(50) NOT NULL,
	"target_value" varchar(255) NOT NULL,
	"mapping_weight" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_compliance_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"dev_project_id" integer,
	"framework" varchar(100) NOT NULL,
	"requirement_id" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"evidence_id" integer,
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'planning',
	"start_date" timestamp,
	"end_date" timestamp,
	"owner" varchar(255),
	"project_type" varchar(50) DEFAULT 'it',
	"security_criticality" varchar(50) DEFAULT 'medium',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"score" integer,
	"feedback" text,
	"assigned_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP TABLE "training_completions";--> statement-breakpoint
ALTER TABLE "threat_models" ALTER COLUMN "dev_project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "category" varchar(100) DEFAULT 'General';--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "owasp_category" varchar(100);--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "privacy_impact" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "csf_function" varchar(50);--> statement-breakpoint
ALTER TABLE "risk_assessments" ADD COLUMN "ai_rmf_category" varchar(50);--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "category" varchar(100) DEFAULT 'General';--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "owasp_category" varchar(100);--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "privacy_impact" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "csf_function" varchar(50);--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "custom_mitigation_plan" text;--> statement-breakpoint
ALTER TABLE "threat_models" ADD COLUMN "project_id" integer;--> statement-breakpoint
ALTER TABLE "training_modules" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comp_req_client" ON "compliance_requirements" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fkm_source" ON "framework_knowledge_mappings" ("source_requirement_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fkm_target" ON "framework_knowledge_mappings" ("target_type","target_value");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pcm_project" ON "project_compliance_mappings" ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pcm_dev_project" ON "project_compliance_mappings" ("dev_project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_client" ON "projects" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_assignment_client" ON "training_assignments" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_assignment_employee" ON "training_assignments" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_assignment_module" ON "training_assignments" ("module_id");