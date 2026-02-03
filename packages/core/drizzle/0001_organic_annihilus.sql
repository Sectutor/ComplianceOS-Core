DO $$ BEGIN
 CREATE TYPE "asset_status" AS ENUM('active', 'archived', 'disposed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "crm_engagement_stage" AS ENUM('planned', 'gap_analysis', 'remediation', 'audit_prep', 'audit_active', 'certified', 'maintenance');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "escalation_trigger" AS ENUM('overdue', 'risk_threshold_breach', 'approval_rejected', 'status_regression', 'missing_evidence', 'missing_raci');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "governance_entity_type" AS ENUM('policy', 'control', 'risk', 'bcp_plan', 'vendor', 'evidence', 'task');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "kanban_status" AS ENUM('todo', 'in_progress', 'review', 'done');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "risk_assessment_status" AS ENUM('draft', 'approved', 'reviewed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "threat_status" AS ENUM('active', 'dormant', 'monitored');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "vulnerability_status" AS ENUM('open', 'mitigated', 'accepted', 'remediated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "work_item_priority" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "work_item_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled', 'escalated');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "work_item_type" AS ENUM('review', 'approval', 'evidence_collection', 'raci_assignment', 'risk_treatment', 'vendor_assessment', 'bcp_approval', 'policy_review', 'control_implementation', 'risk_review', 'control_assessment');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"user_id" integer,
	"endpoint" varchar(255) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost_cents" integer DEFAULT 0 NOT NULL,
	"latency_ms" integer,
	"success" boolean DEFAULT true,
	"error_message" text,
	"request_metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "asset_cve_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"asset_id" integer NOT NULL,
	"cve_id" varchar(50) NOT NULL,
	"match_score" integer DEFAULT 100,
	"match_reason" text,
	"is_kev" boolean DEFAULT false,
	"status" varchar(50) DEFAULT 'suggested',
	"imported_vulnerability_id" integer,
	"discovered_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"owner" varchar(255),
	"vendor" varchar(255),
	"product_name" varchar(255),
	"version" varchar(100),
	"technologies" json,
	"valuation_c" integer DEFAULT 3,
	"valuation_i" integer DEFAULT 3,
	"valuation_a" integer DEFAULT 3,
	"description" text,
	"location" varchar(255),
	"department" varchar(255),
	"status" "asset_status" DEFAULT 'active',
	"acquisition_date" timestamp,
	"last_review_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_approvals" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"approver_id" integer NOT NULL,
	"status" varchar(50) DEFAULT 'pending',
	"requested_at" timestamp DEFAULT now(),
	"responded_at" timestamp,
	"comments" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_committee_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"program_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" varchar(100) NOT NULL,
	"name" varchar(255),
	"responsibilities" text,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_appendices" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"file_url" varchar(1024),
	"type" varchar(50),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_bias" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"bia_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_communication_channels" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"audience" varchar(100) NOT NULL,
	"channel" varchar(100),
	"responsible_role" varchar(255),
	"message_template" text,
	"frequency" varchar(100),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"user_id" integer,
	"vendor_contact_id" integer,
	"role" varchar(100),
	"is_primary" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_logistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"address" text,
	"capacity" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"scenario_id" integer NOT NULL,
	"coverage_notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"section_key" varchar(100) NOT NULL,
	"content" text,
	"order" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plan_strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"strategy_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"version" varchar(50) DEFAULT '1.0',
	"status" varchar(50) DEFAULT 'draft',
	"owner_id" integer,
	"last_tested_date" timestamp,
	"next_test_date" timestamp,
	"content" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_programs" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"program_name" varchar(255) DEFAULT 'Business Continuity Management Program' NOT NULL,
	"scope_description" text,
	"policy_statement" text,
	"budget_allocated" varchar(100),
	"program_manager_id" integer,
	"executive_sponsor_id" integer,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"resource_requirements" text,
	"estimated_cost" varchar(100),
	"benefits" text,
	"approval_status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bc_training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"training_type" varchar(100) NOT NULL,
	"completion_date" timestamp,
	"expiry_date" timestamp,
	"status" varchar(50) DEFAULT 'completed',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bcp_projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"scope" text,
	"manager_id" integer,
	"start_date" timestamp,
	"target_date" timestamp,
	"status" varchar(50) DEFAULT 'planning',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bcp_stakeholders" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer,
	"process_id" integer,
	"user_id" integer NOT NULL,
	"role" varchar(50) NOT NULL,
	"assigned_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bia_questionnaires" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"question" text NOT NULL,
	"category" varchar(100),
	"response" text,
	"impact_level" varchar(50),
	"notes" text,
	"order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bia_seasonal_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"start_date" varchar(50),
	"end_date" varchar(50),
	"impact_description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bia_vital_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"record_name" varchar(255) NOT NULL,
	"media_type" varchar(50),
	"location" varchar(255),
	"backup_method" varchar(255),
	"rto" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_impact_analyses" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"project_id" integer,
	"process_id" integer,
	"title" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"conductor_id" integer,
	"approved_by" integer,
	"approved_at" timestamp,
	"methodology" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_processes" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"owner_id" integer,
	"parent_id" integer,
	"department" varchar(255),
	"criticality_tier" varchar(50),
	"rto" varchar(50),
	"rpo" varchar(50),
	"mtpd" varchar(50),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "checklist_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"checklist_id" varchar(255) NOT NULL,
	"items" json DEFAULT '{}'::json,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cisa_kev_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cve_id" varchar(50) NOT NULL,
	"vendor_project" varchar(255),
	"product" varchar(255),
	"vulnerability_name" varchar(500),
	"short_description" text,
	"required_action" text,
	"due_date" timestamp,
	"known_ransomware_campaign_use" boolean DEFAULT false,
	"date_added" timestamp,
	"fetched_at" timestamp DEFAULT now(),
	CONSTRAINT "cisa_kev_cache_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_framework_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_id" integer NOT NULL,
	"control_code" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"grouping" varchar(255),
	"original_data" json,
	"status" varchar(50) DEFAULT 'not_implemented',
	"applicability" varchar(50) DEFAULT 'applicable',
	"owner" varchar(255),
	"custom_description" text,
	"implementation_notes" text,
	"evidence_location" text,
	"justification" text,
	"implementation_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_framework_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"framework_control_id" integer NOT NULL,
	"client_control_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_frameworks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" varchar(50),
	"source_file_name" varchar(255),
	"imported_at" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'active'
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "client_integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider" varchar(50) DEFAULT 'smtp' NOT NULL,
	"settings" json,
	"is_enabled" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "communication_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"subject_template" varchar(500) NOT NULL,
	"body_template" text NOT NULL,
	"category" varchar(50) DEFAULT 'general',
	"tags" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "communication_templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"snapshot_date" timestamp DEFAULT now() NOT NULL,
	"total_controls" integer DEFAULT 0,
	"implemented_controls" integer DEFAULT 0,
	"in_progress_controls" integer DEFAULT 0,
	"not_implemented_controls" integer DEFAULT 0,
	"not_applicable_controls" integer DEFAULT 0,
	"total_gaps" integer DEFAULT 0,
	"closed_gaps" integer DEFAULT 0,
	"critical_gaps" integer DEFAULT 0,
	"high_gaps" integer DEFAULT 0,
	"total_risks" integer DEFAULT 0,
	"mitigated_risks" integer DEFAULT 0,
	"compliance_score" integer DEFAULT 0,
	"risk_score" integer DEFAULT 0,
	"controls_closed_this_period" integer DEFAULT 0,
	"gaps_closed_this_period" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"subject" varchar(500),
	"content" text,
	"outcome" varchar(255),
	"occurred_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"job_title" varchar(255),
	"is_primary" boolean DEFAULT false,
	"category" varchar(50),
	"linkedin_url" varchar(1024),
	"notes" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "crm_engagements" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"stage" "crm_engagement_stage" DEFAULT 'planned',
	"framework" varchar(100),
	"priority" varchar(50) DEFAULT 'medium',
	"target_date" timestamp,
	"progress" integer DEFAULT 0,
	"owner" varchar(255),
	"controls_count" integer DEFAULT 0,
	"mitigated_risks_count" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disruptive_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"likelihood" varchar(50),
	"potential_impact" text,
	"mitigation_strategies" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"user_id" integer,
	"folder" varchar(20) DEFAULT 'inbox',
	"status" varchar(20) DEFAULT 'draft',
	"subject" varchar(500),
	"body" text,
	"snippet" varchar(255),
	"from" varchar(255),
	"to" json,
	"cc" json,
	"bcc" json,
	"is_read" boolean DEFAULT false,
	"is_starred" boolean DEFAULT false,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "escalation_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"trigger" "escalation_trigger" NOT NULL,
	"entity_type" "governance_entity_type",
	"trigger_conditions" json,
	"actions" json DEFAULT '{}'::json,
	"work_item_priority" "work_item_priority" DEFAULT 'high',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "evidence_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"control_pattern" varchar(255) NOT NULL,
	"framework" varchar(100),
	"category" varchar(100),
	"suggested_sources" json DEFAULT '[]'::json,
	"sample_description" text,
	"integration_type" varchar(50) DEFAULT 'manual',
	"priority" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_poams" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"source_ssp_id" integer,
	"status" varchar(50) DEFAULT 'active',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_sars" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"ssp_id" integer,
	"title" varchar(255) NOT NULL,
	"assessor_name" varchar(255),
	"assessment_date" timestamp,
	"summary_of_findings" text,
	"risk_executive_summary" text,
	"status" varchar(50) DEFAULT 'draft',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_ssps" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"framework" varchar(50) NOT NULL,
	"system_name" varchar(255),
	"system_type" varchar(255),
	"boundary_description" text,
	"responsible_role" varchar(255),
	"status" varchar(50) DEFAULT 'draft',
	"version" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "financial_impacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"loss_category" varchar(100) NOT NULL,
	"amount_per_unit" integer,
	"unit" varchar(50),
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fips_categorizations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"system_name" varchar(255),
	"information_types" json,
	"confidentiality_impact" varchar(20),
	"integrity_impact" varchar(20),
	"availability_impact" varchar(20),
	"high_water_mark" varchar(20),
	"status" varchar(50) DEFAULT 'draft',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "framework_mappings" (
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
CREATE TABLE IF NOT EXISTS "gap_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"framework" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"scope" text,
	"user_id" integer,
	"assignees" json,
	"executive_summary" text,
	"introduction" text,
	"key_recommendations" json,
	"methodology" text,
	"assumptions" text,
	"references" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gap_questionnaire_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"recipient_email" varchar(255) NOT NULL,
	"recipient_name" varchar(255),
	"control_ids" json DEFAULT '[]'::json,
	"message" text,
	"status" varchar(20) DEFAULT 'pending',
	"sent_at" timestamp,
	"expires_at" timestamp,
	"viewed_at" timestamp,
	"completed_at" timestamp,
	"applied_at" timestamp,
	"archived_at" timestamp,
	"respondent_name" varchar(255),
	"responses" json DEFAULT '[]'::json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "gap_questionnaire_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gap_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"assessment_id" integer NOT NULL,
	"control_id" varchar(100) NOT NULL,
	"current_status" varchar(50),
	"target_status" varchar(50),
	"notes" text,
	"evidence_links" json,
	"remediation_plan" text,
	"gap_severity" varchar(20),
	"priority_score" integer,
	"priority_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"entity_type" "governance_entity_type" NOT NULL,
	"entity_id" integer NOT NULL,
	"entity_name" varchar(500),
	"event_type" varchar(100) NOT NULL,
	"from_state" varchar(100),
	"to_state" varchar(100),
	"action" varchar(100),
	"actor_user_id" integer,
	"actor_name" varchar(255),
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "impact_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"time_interval" varchar(50) NOT NULL,
	"financial_rating" integer,
	"operational_rating" integer,
	"reputation_rating" integer,
	"legal_rating" integer,
	"financial_value" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "kris" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active',
	"threshold_green" text,
	"threshold_amber" text,
	"threshold_red" text,
	"current_value" text,
	"current_status" varchar(50) DEFAULT 'green',
	"owner" varchar(255),
	"last_updated" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "llm_router_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"feature" varchar(100) NOT NULL,
	"provider_id" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "llm_router_rules_feature_unique" UNIQUE("feature")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nvd_cve_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"cve_id" varchar(50) NOT NULL,
	"cvss_score" varchar(10),
	"cvss_vector" varchar(255),
	"cwe_ids" json,
	"description" text,
	"published_date" timestamp,
	"last_modified_date" timestamp,
	"affected_products" json,
	"references" json,
	"raw_data" json,
	"fetched_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	CONSTRAINT "nvd_cve_cache_cve_id_unique" UNIQUE("cve_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "org_roles" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"responsibilities" text,
	"department" varchar(255),
	"reporting_role_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_change_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"action" varchar(50) NOT NULL,
	"details" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"plan_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"conductor_id" integer,
	"status" varchar(50) DEFAULT 'planned',
	"outcome" varchar(50),
	"notes" text,
	"follow_up_tasks" json,
	"report_url" varchar(1024),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "plan_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"version" varchar(50) NOT NULL,
	"content_snapshot" json,
	"change_summary" text,
	"created_by" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "poam_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"poam_id" integer NOT NULL,
	"control_id" varchar(100),
	"weakness_name" varchar(500),
	"weakness_description" text,
	"point_of_contact" varchar(255),
	"resources_required" text,
	"scheduled_completion_date" timestamp,
	"milestones" json,
	"status" varchar(50) DEFAULT 'open',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "process_dependencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"process_id" integer NOT NULL,
	"dependency_type" varchar(50) NOT NULL,
	"dependency_name" varchar(255) NOT NULL,
	"dependency_id" integer,
	"criticality" varchar(50) DEFAULT 'medium',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"status" "kanban_status" DEFAULT 'todo',
	"priority" varchar(50) DEFAULT 'medium',
	"due_date" timestamp,
	"assignee_id" integer,
	"position" integer DEFAULT 0,
	"tags" json,
	"source_type" varchar(50),
	"source_id" integer,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "readiness_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'in_progress',
	"current_step" integer DEFAULT 1,
	"scope_details" json,
	"stakeholders" json,
	"existing_policies" json,
	"business_context" json,
	"maturity_expectations" json,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recovery_objectives" (
	"id" serial PRIMARY KEY NOT NULL,
	"bia_id" integer NOT NULL,
	"activity_name" varchar(255) NOT NULL,
	"criticality_level" varchar(50),
	"rto" varchar(50),
	"rpo" varchar(50),
	"mtpd" varchar(50),
	"dependencies" text,
	"resources" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "remediation_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"start_date" timestamp DEFAULT now(),
	"target_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "remediation_playbooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"gap_pattern" varchar(255) NOT NULL,
	"category" varchar(100),
	"framework" varchar(100),
	"severity" varchar(20) DEFAULT 'medium',
	"estimated_effort" varchar(50),
	"steps" json DEFAULT '[]'::json,
	"owner_template" text,
	"policy_language" text,
	"itsm_template" json,
	"priority" integer DEFAULT 50,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"assessment_id" varchar(50) NOT NULL,
	"title" varchar(255),
	"risk_id" integer,
	"assessment_date" timestamp,
	"assessor" varchar(255),
	"method" varchar(100),
	"threat_id" integer,
	"threat_description" text,
	"vulnerability_id" integer,
	"vulnerability_description" text,
	"affected_assets" json,
	"affected_process_ids" json,
	"gap_response_id" integer,
	"likelihood" varchar(50),
	"impact" varchar(50),
	"inherent_risk" varchar(50),
	"inherent_score" integer,
	"existing_controls" text,
	"control_ids" json,
	"control_effectiveness" varchar(50),
	"residual_risk" varchar(50),
	"residual_score" integer,
	"context_snapshot" json,
	"risk_owner" varchar(255),
	"treatment_option" varchar(50),
	"recommended_actions" text,
	"priority" varchar(50),
	"target_residual_risk" varchar(50),
	"review_due_date" timestamp,
	"status" "risk_assessment_status" DEFAULT 'draft',
	"notes" text,
	"next_review_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_policy_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"risk_assessment_id" integer NOT NULL,
	"client_policy_id" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) DEFAULT 'Risk Management Report',
	"executive_summary" text,
	"introduction" text,
	"scope" text,
	"methodology" text,
	"key_findings" text,
	"recommendations" text,
	"conclusion" text,
	"assumptions" text,
	"references" text,
	"status" varchar(50) DEFAULT 'draft',
	"version" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_scenarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"assessment_type" varchar(50) DEFAULT 'asset' NOT NULL,
	"asset_id" integer,
	"process_id" varchar(100),
	"vendor_id" integer,
	"threat_id" integer,
	"vulnerability_id" integer,
	"title" varchar(500) NOT NULL,
	"description" text,
	"threat_category" varchar(100),
	"vulnerability" varchar(255),
	"gap_response_id" integer,
	"likelihood" integer DEFAULT 1,
	"impact" integer DEFAULT 1,
	"inherent_risk_score" integer,
	"status" varchar(50) DEFAULT 'identified',
	"owner" varchar(255),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"scope" text,
	"context" text,
	"risk_appetite" text,
	"risk_tolerance" json,
	"methodology" varchar(255) DEFAULT 'ISO 27005',
	"impact_criteria" json,
	"likelihood_criteria" json,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "risk_treatments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"risk_scenario_id" integer,
	"risk_assessment_id" integer,
	"treatment_type" varchar(50) DEFAULT 'mitigate' NOT NULL,
	"strategy" text,
	"justification" text,
	"control_id" integer,
	"status" varchar(50) DEFAULT 'planned',
	"due_date" timestamp,
	"implementation_date" timestamp,
	"owner" varchar(255),
	"priority" varchar(50),
	"estimated_cost" varchar(100),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "roadmap_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"plan_id" integer NOT NULL,
	"control_id" varchar(100),
	"gap_response_id" integer,
	"title" varchar(500) NOT NULL,
	"description" text,
	"phase" integer DEFAULT 1,
	"order" integer DEFAULT 0,
	"status" varchar(50) DEFAULT 'pending',
	"owner_role" varchar(255),
	"assignee_id" integer,
	"estimated_duration" integer,
	"actual_start_date" timestamp,
	"actual_end_date" timestamp,
	"dependencies" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"assignee_id" integer,
	"due_date" timestamp,
	"status" varchar(50) DEFAULT 'pending',
	"priority" varchar(20) DEFAULT 'medium',
	"related_entity_type" varchar(50),
	"related_entity_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threat_intel_sync_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" varchar(50) NOT NULL,
	"sync_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'completed',
	"records_processed" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threats" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"threat_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100),
	"source" varchar(100),
	"intent" varchar(50),
	"likelihood" varchar(50),
	"potential_impact" text,
	"affected_assets" json,
	"related_vulnerabilities" json,
	"associated_risks" json,
	"scenario" text,
	"detection_method" text,
	"status" "threat_status" DEFAULT 'active',
	"owner" varchar(255),
	"last_review_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "treatment_controls" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer DEFAULT 0 NOT NULL,
	"treatment_id" integer NOT NULL,
	"control_id" integer NOT NULL,
	"effectiveness" varchar(50),
	"implementation_notes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"type" varchar(100),
	"status" varchar(50) DEFAULT 'Planned',
	"inherent_impact" varchar(50),
	"inherent_likelihood" varchar(50),
	"inherent_risk_level" varchar(50),
	"residual_impact" varchar(50),
	"residual_likelihood" varchar(50),
	"residual_risk_level" varchar(50),
	"score" integer,
	"findings" text,
	"document_url" varchar(1024),
	"due_date" timestamp,
	"completed_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_breaches" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"breach_date" timestamp,
	"severity" varchar(50),
	"source" varchar(255),
	"status" varchar(50) DEFAULT 'Active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_contacts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"role" varchar(100),
	"is_primary" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"auto_renew" boolean DEFAULT false,
	"value" varchar(50),
	"status" varchar(50) DEFAULT 'Active',
	"document_url" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_cve_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_id" integer NOT NULL,
	"cve_id" varchar(50) NOT NULL,
	"match_score" integer,
	"match_reason" text,
	"status" varchar(50) DEFAULT 'Active',
	"discovered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"scan_date" timestamp DEFAULT now(),
	"status" varchar(50) DEFAULT 'Completed',
	"risk_score" integer,
	"vulnerability_count" integer DEFAULT 0,
	"breach_count" integer DEFAULT 0,
	"raw_result" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"website" varchar(512),
	"criticality" varchar(50) DEFAULT 'Low',
	"data_access" varchar(50) DEFAULT 'Internal',
	"misc_data" json,
	"status" varchar(50) DEFAULT 'Active',
	"owner_id" integer,
	"security_owner_id" integer,
	"category" varchar(100) DEFAULT 'Unassigned',
	"source" varchar(100),
	"discovery_date" timestamp,
	"review_status" varchar(50) DEFAULT 'needs_review',
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vulnerabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vulnerability_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cve_id" varchar(50),
	"cvss_score" integer,
	"severity" varchar(50),
	"affected_assets" json,
	"discovery_date" timestamp,
	"source" varchar(100),
	"exploitability" varchar(255),
	"impact" varchar(255),
	"status" "vulnerability_status" DEFAULT 'open',
	"owner" varchar(255),
	"remediation_plan" text,
	"due_date" timestamp,
	"last_review_date" timestamp,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"type" "work_item_type" NOT NULL,
	"status" "work_item_status" DEFAULT 'pending',
	"priority" "work_item_priority" DEFAULT 'medium',
	"title" varchar(500) NOT NULL,
	"description" text,
	"entity_type" "governance_entity_type",
	"entity_id" integer,
	"assigned_to_user_id" integer,
	"assigned_to_employee_id" integer,
	"assigned_role" varchar(50),
	"due_date" timestamp,
	"completed_at" timestamp,
	"is_escalated" boolean DEFAULT false,
	"escalated_at" timestamp,
	"escalation_rule_id" integer,
	"metadata" json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "control_mappings" ALTER COLUMN "confidence" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "control_mappings" ALTER COLUMN "confidence" SET DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE "client_controls" ADD COLUMN "due_date" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "active_modules" json;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "client_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "mapping_type" varchar(50) DEFAULT 'equivalent' NOT NULL;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "control_mappings" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "client_id" integer;--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "embedding_vector" "vector(1536)";--> statement-breakpoint
ALTER TABLE "embeddings" ADD COLUMN "content" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "org_role_id" integer;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "manager_id" integer;--> statement-breakpoint
ALTER TABLE "llm_providers" ADD COLUMN "supports_embeddings" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "channel" varchar(20) DEFAULT 'email';--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "status" varchar(20) DEFAULT 'sent';--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "metadata" json;--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "related_entity_type" varchar(50);--> statement-breakpoint
ALTER TABLE "notification_log" ADD COLUMN "related_entity_id" integer;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "overdue_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "daily_digest_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "weekly_digest_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "upcoming_review_days" integer DEFAULT 7;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "notify_control_reviews" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "notify_policy_renewals" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "notify_evidence_expiration" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "notification_settings" ADD COLUMN "notify_risk_reviews" boolean DEFAULT true;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_usage_client" ON "ai_usage_metrics" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_usage_provider" ON "ai_usage_metrics" ("provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_usage_endpoint" ON "ai_usage_metrics" ("endpoint");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_usage_created" ON "ai_usage_metrics" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_acm_client_asset" ON "asset_cve_matches" ("client_id","asset_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_acm_cve" ON "asset_cve_matches" ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_acm_status" ON "asset_cve_matches" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bpb_plan_bia" ON "bc_plan_bias" ("plan_id","bia_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bpsc_plan_scen" ON "bc_plan_scenarios" ("plan_id","scenario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bps_plan_strat" ON "bc_plan_strategies" ("plan_id","strategy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kev_cve_id" ON "cisa_kev_cache" ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfc_framework" ON "client_framework_controls" ("framework_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfm_fw_ctrl" ON "client_framework_mappings" ("framework_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfm_cl_ctrl" ON "client_framework_mappings" ("client_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cfm_unique" ON "client_framework_mappings" ("framework_control_id","client_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_integration_client" ON "client_integrations" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_activity_client" ON "crm_activities" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_activity_date" ON "crm_activities" ("occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_contact_client" ON "crm_contacts" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_crm_contact_email" ON "crm_contacts" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_er_client_active" ON "escalation_rules" ("client_id","is_active");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_er_trigger" ON "escalation_rules" ("trigger");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_source" ON "framework_mappings" ("source_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_target" ON "framework_mappings" ("target_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fm_unique" ON "framework_mappings" ("source_control_id","target_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gr_assess_ctrl" ON "gap_responses" ("assessment_id","control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ge_client_entity" ON "governance_events" ("client_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ge_client_created" ON "governance_events" ("client_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ge_entity_type" ON "governance_events" ("entity_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_kri_client" ON "kris" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_nvd_cve_id" ON "nvd_cve_cache" ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pt_client_status" ON "project_tasks" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pt_assignee" ON "project_tasks" ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ra_client" ON "risk_assessments" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ra_risk" ON "risk_assessments" ("risk_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ra_status" ON "risk_assessments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ra_next_review" ON "risk_assessments" ("next_review_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rpm_policy" ON "risk_policy_mappings" ("client_policy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rpm_risk" ON "risk_policy_mappings" ("risk_assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rpm_unique" ON "risk_policy_mappings" ("risk_assessment_id","client_policy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rs_client" ON "risk_scenarios" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rs_client_status" ON "risk_scenarios" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rsettings_client" ON "risk_settings" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_treatment_scenario" ON "risk_treatments" ("risk_scenario_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_treatment_assessment" ON "risk_treatments" ("risk_assessment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ri_plan_phase" ON "roadmap_items" ("plan_id","phase");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threat_client" ON "threats" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_threat_client_status" ON "threats" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tc_treatment" ON "treatment_controls" ("treatment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tc_control" ON "treatment_controls" ("control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assessment_vendor" ON "vendor_assessments" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_breach_vendor" ON "vendor_breaches" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contact_vendor" ON "vendor_contacts" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contract_vendor" ON "vendor_contracts" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vendor_cve" ON "vendor_cve_matches" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vendor_cve_id" ON "vendor_cve_matches" ("cve_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_scan_vendor" ON "vendor_scans" ("vendor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vendor_client" ON "vendors" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vuln_client" ON "vulnerabilities" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vuln_client_status" ON "vulnerabilities" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wi_client_status" ON "work_items" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wi_assigned_user" ON "work_items" ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wi_due_date" ON "work_items" ("due_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_wi_entity" ON "work_items" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_emb_client" ON "embeddings" ("client_id");--> statement-breakpoint
ALTER TABLE "control_mappings" DROP COLUMN IF EXISTS "relationship";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "llm_router_rules" ADD CONSTRAINT "llm_router_rules_provider_id_llm_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "llm_providers"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
