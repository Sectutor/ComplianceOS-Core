ALTER TABLE "federal_nist_800_53_assessments" ADD COLUMN "sprs_assessment_id" integer;--> statement-breakpoint
ALTER TABLE "federal_sprs_assessments" ADD COLUMN "status" varchar(50) DEFAULT 'Active';