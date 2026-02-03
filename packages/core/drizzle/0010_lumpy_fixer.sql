DO $$ BEGIN
 CREATE TYPE "approval_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" integer NOT NULL,
	"status" "approval_status" DEFAULT 'pending',
	"submitter_id" integer,
	"submitted_at" timestamp DEFAULT now(),
	"required_roles" json,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_signatures" (
	"id" serial PRIMARY KEY NOT NULL,
	"request_id" integer NOT NULL,
	"signer_id" integer NOT NULL,
	"signer_role" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'signed',
	"comment" text,
	"signature_data" text,
	"signed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "task_assignments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"task_type" varchar(50) NOT NULL,
	"task_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"raci_role" "raci_role" NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"assigned_by" integer
);
--> statement-breakpoint
ALTER TABLE "federal_ssps" ADD COLUMN "content" text DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "weakness_detector_source" varchar(255);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "source_identifier" varchar(255);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "asset_identifier" varchar(255);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "overall_remediation_plan" text;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "original_detection_date" timestamp;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "milestone_changes" json;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "status_date" timestamp;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "vendor_dependency" varchar(255);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "last_vendor_checkin_date" timestamp;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "product_name" varchar(255);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "original_risk_rating" varchar(50);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "adjusted_risk_rating" varchar(50);--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "risk_adjustment" text;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "false_positive" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "operational_requirement" text;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "deviation_rationale" text;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "supporting_documents" json;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "comments" text;--> statement-breakpoint
ALTER TABLE "poam_items" ADD COLUMN "auto_approve" boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ar_client_status" ON "approval_requests" ("client_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ar_entity" ON "approval_requests" ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_as_request" ON "approval_signatures" ("request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_as_signer" ON "approval_signatures" ("signer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ta_client" ON "task_assignments" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ta_task" ON "task_assignments" ("task_type","task_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ta_user" ON "task_assignments" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_ta_unique" ON "task_assignments" ("task_type","task_id","user_id","raci_role");