DO $$ BEGIN
    CREATE TYPE "data_breach_status" AS ENUM ('open', 'investigating', 'closed', 'reported');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

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

CREATE INDEX IF NOT EXISTS "idx_db_client_status" ON "data_breaches" ("client_id", "status");
