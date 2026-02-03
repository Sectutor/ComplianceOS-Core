CREATE TABLE IF NOT EXISTS "dsar_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"request_id" varchar(50) NOT NULL,
	"request_type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'New',
	"subject_email" varchar(255),
	"subject_name" varchar(255),
	"verification_status" varchar(50) DEFAULT 'Pending',
	"request_date" timestamp DEFAULT now(),
	"due_date" timestamp,
	"completed_date" timestamp,
	"assignee_id" integer,
	"resolution_notes" text,
	"response_data" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "process_data_flows" (
	"id" serial PRIMARY KEY NOT NULL,
	"process_id" integer NOT NULL,
	"asset_id" integer,
	"data_elements" text,
	"interaction_type" varchar(50),
	"legal_basis" varchar(100),
	"purpose" text,
	"data_subject_type" varchar(100),
	"recipients" text,
	"is_cross_border" boolean DEFAULT false,
	"transfer_mechanism" varchar(100),
	"retention_period" varchar(100),
	"disposal_method" varchar(100),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dsar_client" ON "dsar_requests" ("client_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dsar_status" ON "dsar_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dsar_email" ON "dsar_requests" ("subject_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pdf_process" ON "process_data_flows" ("process_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pdf_asset" ON "process_data_flows" ("asset_id");