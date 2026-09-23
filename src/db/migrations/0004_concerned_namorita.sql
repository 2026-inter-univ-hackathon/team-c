CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "review_embeddings" (
	"review_id" uuid PRIMARY KEY NOT NULL,
	"model" varchar(80) NOT NULL,
	"source_hash" varchar(64) NOT NULL,
	"embedding" vector(512) NOT NULL,
	"indexed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_attribute
		WHERE attrelid = 'review_embeddings'::regclass
			AND attname = 'embedding'
			AND format_type(atttypid, atttypmod) = 'jsonb'
	) THEN
		ALTER TABLE "review_embeddings"
			DROP CONSTRAINT IF EXISTS "review_embeddings_dimensions";
		ALTER TABLE "review_embeddings"
			ALTER COLUMN "embedding" TYPE vector(512)
			USING "embedding"::text::vector(512);
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'review_embeddings_review_id_reviews_id_fk'
			AND conrelid = 'review_embeddings'::regclass
	) THEN
		ALTER TABLE "review_embeddings"
			ADD CONSTRAINT "review_embeddings_review_id_reviews_id_fk"
			FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id")
			ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_embeddings_embedding_hnsw_idx"
	ON "review_embeddings" USING hnsw ("embedding" vector_cosine_ops);
