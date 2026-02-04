CREATE TABLE IF NOT EXISTS "training_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"employee_id" integer NOT NULL,
	"module_id" integer NOT NULL,
	"completed_at" timestamp DEFAULT now(),
	"score" integer,
	"feedback" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(20) NOT NULL,
	"video_url" text,
	"content" text,
	"duration_minutes" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_completion_employee" ON "training_completions" ("employee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_completion_module" ON "training_completions" ("module_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_training_module_client" ON "training_modules" ("client_id");