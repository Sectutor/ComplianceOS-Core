DO $$ BEGIN
 CREATE TYPE "ai_risk_level" AS ENUM('low', 'medium', 'high', 'critical', 'unacceptable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ai_system_status" AS ENUM('evaluation', 'development', 'production', 'monitoring', 'retired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "finding_severity" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "finding_status" AS ENUM('open', 'remediated', 'accepted', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "report_version" AS ENUM('draft', 'v1.0', 'v1.1', 'v2.0', 'final');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "kanban_status" ADD VALUE 'backlog';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_impact_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"ai_system_id" integer NOT NULL,
	"assessor_id" integer,
	"status" varchar(50) DEFAULT 'draft',
	"safety_impact" text,
	"bias_impact" text,
	"privacy_impact" text,
	"security_impact" text,
	"overall_risk_score" integer,
	"assessment_date" timestamp DEFAULT now(),
	"next_review_date" timestamp,
	"recommendations" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_system_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"ai_system_id" integer NOT NULL,
	"control_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'mapped',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"purpose" text,
	"intended_users" text,
	"deployment_context" text,
	"type" varchar(100),
	"risk_level" "ai_risk_level" DEFAULT 'medium',
	"status" "ai_system_status" DEFAULT 'evaluation',
	"owner" varchar(255),
	"vendor_id" integer,
	"data_sensitivity" varchar(100),
	"technical_constraints" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"severity" "finding_severity" DEFAULT 'medium',
	"status" "finding_status" DEFAULT 'open',
	"evidence_id" integer,
	"author_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certification_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"framework_id" integer,
	"audit_firm" varchar(255),
	"auditor_name" varchar(255),
	"start_date" timestamp,
	"end_date" timestamp,
	"status" varchar(50) DEFAULT 'scheduled',
	"stage" varchar(50),
	"outcome" varchar(50),
	"notes" text,
	"report_url" text,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "common_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"domain" varchar(100),
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"framework_id" integer,
	"audit_id" integer,
	"certificate_number" varchar(255),
	"issue_date" timestamp NOT NULL,
	"expiry_date" timestamp NOT NULL,
	"status" varchar(50) DEFAULT 'active',
	"document_url" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"short_code" varchar(50) NOT NULL,
	"version" varchar(50),
	"description" text,
	"type" varchar(50) DEFAULT 'framework',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dev_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"repository_url" varchar(500),
	"tech_stack" json,
	"owner" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"evidence_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "framework_mappings_deprecated" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_control_id" integer NOT NULL,
	"target_control_id" integer NOT NULL,
	"mapping_type" varchar(50) DEFAULT 'equivalent',
	"notes" text,
	"confidence" integer,
	"status" varchar(50) DEFAULT 'approved',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "framework_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" integer NOT NULL,
	"phase_id" integer,
	"identifier" varchar(100) NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"guidance" text,
	"mapping_tags" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_phases" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"order" integer NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "implementation_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"estimated_hours" integer DEFAULT 0,
	"priority" varchar(50) DEFAULT 'medium',
	"category" varchar(100),
	"tasks" jsonb DEFAULT '[]'::jsonb,
	"risk_mitigation_focus" jsonb DEFAULT '[]'::jsonb,
	"is_system" boolean DEFAULT false,
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nda_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"visitor_id" integer NOT NULL,
	"nda_version" varchar(50) DEFAULT 'v1.0',
	"signed_at" timestamp DEFAULT now(),
	"signature_text" varchar(255),
	"ip_address" varchar(50)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"roadmap_id" integer,
	"client_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"version" varchar(50) DEFAULT 'draft',
	"content" text,
	"included_sections" jsonb,
	"data_sources" jsonb,
	"branding" jsonb,
	"file_path" text,
	"file_size" integer,
	"generated_at" timestamp DEFAULT now(),
	"generated_by" integer,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "strategic_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"roadmap_id" integer,
	"implementation_plan_id" integer,
	"status" varchar(50) DEFAULT 'draft',
	"version" varchar(50) DEFAULT '1.0',
	"created_by_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_model_components" (
	"id" serial PRIMARY KEY NOT NULL,
	"threat_model_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"description" text,
	"x" integer DEFAULT 0,
	"y" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_model_data_flows" (
	"id" serial PRIMARY KEY NOT NULL,
	"threat_model_id" integer NOT NULL,
	"source_component_id" integer NOT NULL,
	"target_component_id" integer NOT NULL,
	"protocol" varchar(50) DEFAULT 'HTTPS',
	"is_encrypted" boolean DEFAULT true,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"dev_project_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"methodology" varchar(50) DEFAULT 'STRIDE',
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_center_visitors" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"company" varchar(255),
	"last_seen_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trust_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"file_url" text NOT NULL,
	"is_locked" boolean DEFAULT false,
	"category" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_fm_source";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_fm_target";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_fm_unique";--> statement-breakpoint
ALTER TABLE "client_policies" ADD COLUMN "is_ai_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "brand_primary_color" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "brand_secondary_color" varchar(20);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "portal_title" varchar(255);--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "is_ai_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "control_policy_mappings" ADD COLUMN "evidence_reference" text;--> statement-breakpoint
ALTER TABLE "control_policy_mappings" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "control_policy_mappings" ADD COLUMN "is_ai_generated" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "framework" varchar(50) DEFAULT 'ISO 27001';--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "evidence" ADD COLUMN "file_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "system_acronym" varchar(50);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "system_identification" varchar(255);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "system_type" varchar(50);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "version" varchar(50);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "agency" varchar(100);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "assessment_completion_date" timestamp;--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "system_owner_id" integer;--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "confidentiality" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "integrity" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "availability" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "impact" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "package_type" varchar(100);--> statement-breakpoint
ALTER TABLE "federal_sars" ADD COLUMN "executive_summary" text;--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "overlay" varchar(100);--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "na_justification" text;--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "vulnerability_summary" text;--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "vulnerability_severity" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "residual_risk_level" varchar(20);--> statement-breakpoint
ALTER TABLE "federal_sar_findings" ADD COLUMN "recommendations" text;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "source_framework_id" integer;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "source_requirement_id" integer;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "target_framework_id" integer;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "target_requirement_id" integer;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "strength" varchar(50) DEFAULT 'related';--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "justification" text;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "common_control_id" integer;--> statement-breakpoint
ALTER TABLE "framework_mappings" ADD COLUMN "created_by_id" integer;--> statement-breakpoint
ALTER TABLE "implementation_plans" ADD COLUMN "framework_id" integer;--> statement-breakpoint
ALTER TABLE "implementation_plans" ADD COLUMN "custom_framework_name" varchar(255);--> statement-breakpoint
ALTER TABLE "implementation_plans" ADD COLUMN "harmonization_source_ids" json;--> statement-breakpoint
ALTER TABLE "implementation_tasks" ADD COLUMN "pdca" varchar(100);--> statement-breakpoint
ALTER TABLE "implementation_tasks" ADD COLUMN "nist" varchar(50);--> statement-breakpoint
ALTER TABLE "implementation_tasks" ADD COLUMN "subtasks" json;--> statement-breakpoint
ALTER TABLE "intake_items" ADD COLUMN "file_key" varchar(500);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "related_risk_id" integer;--> statement-breakpoint
ALTER TABLE "policy_templates" ADD COLUMN "owner_id" integer;--> statement-breakpoint
ALTER TABLE "policy_templates" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "readiness_assessments" ADD COLUMN "standard_id" varchar(50) DEFAULT 'ISO27001' NOT NULL;--> statement-breakpoint
ALTER TABLE "readiness_assessments" ADD COLUMN "scoping_report" text;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "dev_project_id" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "threat_model_id" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "inherent_score" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "inherent_risk" varchar(50);--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "residual_likelihood" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "residual_impact" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "residual_score" integer;--> statement-breakpoint
ALTER TABLE "risk_scenarios" ADD COLUMN "residual_risk" varchar(50);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "uses_ai" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "is_ai_service" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "ai_data_usage" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aiia_system" ON "ai_impact_assessments" ("ai_system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aisc_system" ON "ai_system_controls" ("ai_system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_aisc_control" ON "ai_system_controls" ("control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ais_client" ON "ai_systems" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_client" ON "audit_findings" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_findings_status" ON "audit_findings" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_client" ON "certification_audits" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_framework" ON "certification_audits" ("framework_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dev_proj_client" ON "dev_projects" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evidence_comments_evidence" ON "evidence_comments" ("evidence_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_evidence_comments_user" ON "evidence_comments" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_source" ON "framework_mappings_deprecated" ("source_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_target" ON "framework_mappings_deprecated" ("target_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_unique" ON "framework_mappings_deprecated" ("source_control_id","target_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_req_framework" ON "framework_requirements" ("framework_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_req_phase" ON "framework_requirements" ("phase_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_phase_framework" ON "implementation_phases" ("framework_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rr_client" ON "roadmap_reports" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rr_roadmap" ON "roadmap_reports" ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rr_generated_by" ON "roadmap_reports" ("generated_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strat_rep_client" ON "strategic_reports" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_strat_rep_roadmap" ON "strategic_reports" ("roadmap_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tm_comp_tm" ON "threat_model_components" ("threat_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tm_df_tm" ON "threat_model_data_flows" ("threat_model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tm_project" ON "threat_models" ("dev_project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tm_client" ON "threat_models" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_entity" ON "comments" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_client" ON "comments" ("client_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "framework_mappings" ADD CONSTRAINT "framework_mappings_common_control_id_common_controls_id_fk" FOREIGN KEY ("common_control_id") REFERENCES "common_controls"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "source_control_id";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "target_control_id";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "mapping_type";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "notes";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "confidence";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "status";--> statement-breakpoint
ALTER TABLE "framework_mappings" DROP COLUMN IF EXISTS "updated_at";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certification_audits" ADD CONSTRAINT "certification_audits_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "compliance_frameworks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_certificates" ADD CONSTRAINT "compliance_certificates_framework_id_compliance_frameworks_id_fk" FOREIGN KEY ("framework_id") REFERENCES "compliance_frameworks"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "compliance_certificates" ADD CONSTRAINT "compliance_certificates_audit_id_certification_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "certification_audits"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
