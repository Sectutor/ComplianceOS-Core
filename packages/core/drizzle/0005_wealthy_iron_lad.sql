CREATE TABLE IF NOT EXISTS "global_vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"website" varchar(512),
	"trust_center_url" varchar(512),
	"platform" varchar(100),
	"favicon_url" varchar(512),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "service_description" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "additional_notes" text;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "additional_documents" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "trust_center_url" varchar(512);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "trust_center_data" json;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "trust_score" integer;