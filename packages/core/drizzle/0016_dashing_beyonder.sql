CREATE TABLE IF NOT EXISTS "federal_fisma_systems" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"fips_199_overall" varchar(20),
	"description" text,
	"status" varchar(50),
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federal_inheritances" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"partner_name" varchar(255) NOT NULL,
	"control_id" varchar(100) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "controls" ADD COLUMN "ai_guidance" text;--> statement-breakpoint
ALTER TABLE "federal_nist_800_53_assessments" ADD COLUMN "fisma_system_id" integer;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fed_inh_client_pkg" ON "federal_inheritances" ("client_id","package_id");