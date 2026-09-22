ALTER TABLE "stores" ADD COLUMN "review_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "avg_atmosphere" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "avg_training" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "avg_workload_comfort" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "avg_flexibility" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "overall_score" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "bayesian_score" numeric(2, 1);--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "scores_updated_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "stores_bayesian_score_idx" ON "stores" USING btree ("bayesian_score");