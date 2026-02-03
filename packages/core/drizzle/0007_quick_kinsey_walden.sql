CREATE TABLE IF NOT EXISTS "integration_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"client_id" text NOT NULL,
	"client_secret" text NOT NULL,
	"scopes" text,
	"redirect_uri" text,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "integration_definitions_provider_unique" UNIQUE("provider")
);
