ALTER TABLE "reviews" DROP CONSTRAINT "reviews_employment_status_check";--> statement-breakpoint
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_summary_length_check";--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "employment_start_year" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "public_author_label" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "occupation" varchar(30);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "work_duration" varchar(30);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "atmosphere_tags" jsonb;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "staff_tags" jsonb;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "manager_presence" varchar(30);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "recommendation" varchar(20);--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "guideline_version" integer;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "guideline_agreed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_employment_status_check" CHECK ("reviews"."employment_status" in ('CURRENT', 'LEFT_RECENTLY', 'LEFT_LONG_AGO'));--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_summary_length_check" CHECK (char_length(trim("reviews"."summary")) between 30 and 300);