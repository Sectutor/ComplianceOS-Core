CREATE TABLE IF NOT EXISTS "federal_disa_stig_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"checklist_id" integer NOT NULL,
	"rule_id" varchar(50) NOT NULL,
	"vuln_id" varchar(50),
	"title" text NOT NULL,
	"description" text,
	"check_text" text,
	"fix_text" text,
	"severity" varchar(20),
	"status" varchar(50),
	"comments" text,
	"updated_at" timestamp DEFAULT now()
);
