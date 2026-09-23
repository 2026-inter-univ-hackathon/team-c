CREATE TABLE "review_reactions" (
	"review_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reaction_type" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_reactions_pk" PRIMARY KEY("review_id","user_id","reaction_type"),
	CONSTRAINT "review_reactions_type_check" CHECK ("review_reactions"."reaction_type" in ('HELPFUL', 'THANKS', 'USEFUL'))
);
--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_reactions_review_id_idx" ON "review_reactions" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "review_reactions_user_id_idx" ON "review_reactions" USING btree ("user_id");