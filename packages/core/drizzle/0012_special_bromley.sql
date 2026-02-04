CREATE TABLE IF NOT EXISTS "employee_acknowledgments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"acknowledgment_type" varchar(100) NOT NULL,
	"acknowledged_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_asset_receipts" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"asset_type" varchar(100) NOT NULL,
	"status" varchar(50) DEFAULT 'assigned' NOT NULL,
	"serial_number" varchar(100),
	"asset_id" integer,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"assigned_by" integer,
	"confirmed_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_security_setup" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"mfa_enrolled" boolean DEFAULT false,
	"mfa_enrolled_at" timestamp,
	"password_manager_setup" boolean DEFAULT false,
	"password_manager_setup_at" timestamp,
	"security_questions_set" boolean DEFAULT false,
	"security_questions_set_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "employee_security_setup_employee_id_unique" UNIQUE("employee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "employee_training_records" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"framework_id" varchar(100) NOT NULL,
	"section_id" varchar(100) NOT NULL,
	"completed_at" timestamp NOT NULL,
	"completed_by_user_id" integer NOT NULL,
	"ip_address" varchar(50),
	"user_agent" text,
	"time_spent_seconds" integer,
	"score" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "readiness_assessments" ADD COLUMN "questionnaire_data" jsonb;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_employee" ON "employee_training_records" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_client" ON "employee_training_records" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_framework" ON "employee_training_records" ("framework_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_training_unique" ON "employee_training_records" ("employee_id","framework_id","section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_assessment_client" ON "vendor_assessments" ("client_id");