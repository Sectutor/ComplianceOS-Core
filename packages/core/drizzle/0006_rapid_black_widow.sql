CREATE TABLE IF NOT EXISTS "integrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"provider" varchar(50) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"external_account_id" varchar(255),
	"scopes" json,
	"metadata" json,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_data_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"vendor_id" integer NOT NULL,
	"token" varchar(64) NOT NULL,
	"recipient_email" varchar(255),
	"message" text,
	"status" varchar(50) DEFAULT 'sent',
	"items" json,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "vendor_data_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"requester_id" integer,
	"name" varchar(255) NOT NULL,
	"website" varchar(255),
	"category" varchar(100),
	"description" text,
	"status" varchar(50) DEFAULT 'pending',
	"business_owner" varchar(100),
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD COLUMN "notice_period" varchar(50);--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD COLUMN "payment_terms" varchar(50);--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD COLUMN "sla_details" text;--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD COLUMN "dpa_status" varchar(50) DEFAULT 'Not Signed';--> statement-breakpoint
ALTER TABLE "vendor_contracts" ADD COLUMN "owner" varchar(100);--> statement-breakpoint
ALTER TABLE "vendor_cve_matches" ADD COLUMN "scan_id" integer;--> statement-breakpoint
ALTER TABLE "vendor_cve_matches" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "vendor_cve_matches" ADD COLUMN "cvss_score" varchar(10);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_integrations_client_provider" ON "integrations" ("client_id","provider");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vdr_client_vendor" ON "vendor_data_requests" ("client_id","vendor_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_vdr_token" ON "vendor_data_requests" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vendor_request_client" ON "vendor_requests" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_vendor_request_status" ON "vendor_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cm_source" ON "control_mappings" ("source_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cm_target" ON "control_mappings" ("target_control_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_cm_unique" ON "control_mappings" ("source_control_id","target_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cpm_policy" ON "control_policy_mappings" ("client_policy_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cpm_control" ON "control_policy_mappings" ("client_control_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_cpm_unique" ON "control_policy_mappings" ("client_policy_id","client_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_er_client_status" ON "evidence_requests" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_er_assignee" ON "evidence_requests" ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_er_control" ON "evidence_requests" ("client_control_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rt_client_status" ON "remediation_tasks" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rt_assignee" ON "remediation_tasks" ("assignee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ra_client_status" ON "risk_assessments" ("client_id","status");