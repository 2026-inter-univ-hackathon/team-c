CREATE TABLE "auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_user_id" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_accounts_provider_user_unique" UNIQUE("provider","provider_user_id"),
	CONSTRAINT "auth_accounts_user_provider_unique" UNIQUE("user_id","provider")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "organization_memberships" (
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'INVITED' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_memberships_pk" PRIMARY KEY("organization_id","user_id"),
	CONSTRAINT "organization_memberships_role_check" CHECK ("organization_memberships"."role" in ('OWNER', 'MANAGER', 'VIEWER')),
	CONSTRAINT "organization_memberships_status_check" CHECK ("organization_memberships"."status" in ('INVITED', 'ACTIVE', 'SUSPENDED'))
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_status_check" CHECK ("organizations"."status" in ('ACTIVE', 'SUSPENDED', 'DELETED'))
);
--> statement-breakpoint
CREATE TABLE "platform_role_assignments" (
	"user_id" uuid NOT NULL,
	"platform_role_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_role_assignments_pk" PRIMARY KEY("user_id","platform_role_id")
);
--> statement-breakpoint
CREATE TABLE "platform_roles" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(100) NOT NULL,
	CONSTRAINT "platform_roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "rating_dimensions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" varchar(80) NOT NULL,
	"label" varchar(100) NOT NULL,
	"display_order" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "rating_dimensions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "review_answers" (
	"review_id" uuid NOT NULL,
	"review_form_id" uuid NOT NULL,
	"review_question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	CONSTRAINT "review_answers_pk" PRIMARY KEY("review_id","review_question_id"),
	CONSTRAINT "review_answers_answer_text_not_blank_check" CHECK (char_length(trim("review_answers"."answer_text")) > 0)
);
--> statement-breakpoint
CREATE TABLE "review_form_rating_dimensions" (
	"review_form_id" uuid NOT NULL,
	"rating_dimension_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	CONSTRAINT "review_form_rating_dimensions_pk" PRIMARY KEY("review_form_id","rating_dimension_id")
);
--> statement-breakpoint
CREATE TABLE "review_forms" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"version" integer NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "review_forms_version_unique" UNIQUE("version"),
	CONSTRAINT "review_forms_status_check" CHECK ("review_forms"."status" in ('DRAFT', 'PUBLISHED', 'RETIRED'))
);
--> statement-breakpoint
CREATE TABLE "review_questions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"review_form_id" uuid NOT NULL,
	"code" varchar(80) NOT NULL,
	"label" varchar(300) NOT NULL,
	"answer_type" varchar(50) NOT NULL,
	"display_order" integer NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"min_length" integer,
	"max_length" integer,
	CONSTRAINT "review_questions_form_code_unique" UNIQUE("review_form_id","code"),
	CONSTRAINT "review_questions_id_form_id_unique" UNIQUE("id","review_form_id"),
	CONSTRAINT "review_questions_label_length_check" CHECK (char_length(trim("review_questions"."label")) between 1 and 300),
	CONSTRAINT "review_questions_length_range_check" CHECK (("review_questions"."min_length" is null and "review_questions"."max_length" is null) or ("review_questions"."min_length" is not null and "review_questions"."max_length" is not null and "review_questions"."min_length" >= 0 and "review_questions"."min_length" <= "review_questions"."max_length"))
);
--> statement-breakpoint
CREATE TABLE "review_ratings" (
	"review_id" uuid NOT NULL,
	"review_form_id" uuid NOT NULL,
	"rating_dimension_id" uuid NOT NULL,
	"score" smallint NOT NULL,
	CONSTRAINT "review_ratings_pk" PRIMARY KEY("review_id","rating_dimension_id"),
	CONSTRAINT "review_ratings_score_check" CHECK ("review_ratings"."score" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"review_form_id" uuid NOT NULL,
	"employment_start_year" smallint NOT NULL,
	"employment_end_year" smallint,
	"employment_status" varchar(20) NOT NULL,
	"summary" varchar(500) NOT NULL,
	"public_author_label" varchar(100) NOT NULL,
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"lock_version" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp with time zone,
	"hidden_at" timestamp with time zone,
	"hidden_by_user_id" uuid,
	"hidden_reason" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_id_form_id_unique" UNIQUE("id","review_form_id"),
	CONSTRAINT "reviews_status_check" CHECK ("reviews"."status" in ('DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED')),
	CONSTRAINT "reviews_employment_status_check" CHECK ("reviews"."employment_status" in ('CURRENT', 'FORMER')),
	CONSTRAINT "reviews_employment_year_range_check" CHECK ("reviews"."employment_end_year" is null or "reviews"."employment_start_year" <= "reviews"."employment_end_year"),
	CONSTRAINT "reviews_current_end_year_check" CHECK ("reviews"."employment_status" <> 'CURRENT' or "reviews"."employment_end_year" is null),
	CONSTRAINT "reviews_published_at_check" CHECK ("reviews"."status" <> 'PUBLISHED' or "reviews"."published_at" is not null),
	CONSTRAINT "reviews_hidden_fields_check" CHECK ("reviews"."status" <> 'HIDDEN' or ("reviews"."hidden_at" is not null and "reviews"."hidden_reason" is not null and char_length(trim("reviews"."hidden_reason")) > 0)),
	CONSTRAINT "reviews_deleted_at_check" CHECK ("reviews"."status" <> 'DELETED' or "reviews"."deleted_at" is not null),
	CONSTRAINT "reviews_summary_length_check" CHECK (char_length(trim("reviews"."summary")) between 1 and 500)
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "store_categories" (
	"store_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "store_categories_pk" PRIMARY KEY("store_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"organization_id" uuid,
	"name" varchar(200) NOT NULL,
	"normalized_name" varchar(200) NOT NULL,
	"postal_code" varchar(20),
	"prefecture" varchar(50),
	"city" varchar(100),
	"address" varchar(500),
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"external_source" varchar(50),
	"external_id" varchar(255),
	"status" varchar(20) DEFAULT 'DRAFT' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_status_check" CHECK ("stores"."status" in ('DRAFT', 'ACTIVE', 'INACTIVE', 'MERGED', 'DELETED')),
	CONSTRAINT "stores_latitude_check" CHECK ("stores"."latitude" is null or ("stores"."latitude" >= -90 and "stores"."latitude" <= 90)),
	CONSTRAINT "stores_longitude_check" CHECK ("stores"."longitude" is null or ("stores"."longitude" >= -180 and "stores"."longitude" <= 180))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"email" varchar(320),
	"display_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"email_verified_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_status_check" CHECK ("users"."status" in ('ACTIVE', 'SUSPENDED', 'DELETED'))
);
--> statement-breakpoint
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_memberships" ADD CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_platform_role_id_platform_roles_id_fk" FOREIGN KEY ("platform_role_id") REFERENCES "public"."platform_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_answers" ADD CONSTRAINT "review_answers_review_form_fk" FOREIGN KEY ("review_id","review_form_id") REFERENCES "public"."reviews"("id","review_form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_answers" ADD CONSTRAINT "review_answers_question_form_fk" FOREIGN KEY ("review_question_id","review_form_id") REFERENCES "public"."review_questions"("id","review_form_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_form_rating_dimensions" ADD CONSTRAINT "review_form_rating_dimensions_review_form_id_review_forms_id_fk" FOREIGN KEY ("review_form_id") REFERENCES "public"."review_forms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_form_rating_dimensions" ADD CONSTRAINT "review_form_rating_dimensions_rating_dimension_id_rating_dimensions_id_fk" FOREIGN KEY ("rating_dimension_id") REFERENCES "public"."rating_dimensions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_questions" ADD CONSTRAINT "review_questions_review_form_id_review_forms_id_fk" FOREIGN KEY ("review_form_id") REFERENCES "public"."review_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_review_form_fk" FOREIGN KEY ("review_id","review_form_id") REFERENCES "public"."reviews"("id","review_form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_ratings" ADD CONSTRAINT "review_ratings_form_dimension_fk" FOREIGN KEY ("review_form_id","rating_dimension_id") REFERENCES "public"."review_form_rating_dimensions"("review_form_id","rating_dimension_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_review_form_id_review_forms_id_fk" FOREIGN KEY ("review_form_id") REFERENCES "public"."review_forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hidden_by_user_id_users_id_fk" FOREIGN KEY ("hidden_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "store_categories" ADD CONSTRAINT "store_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_memberships_user_id_idx" ON "organization_memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_role_assignments_role_id_idx" ON "platform_role_assignments" USING btree ("platform_role_id");--> statement-breakpoint
CREATE INDEX "review_answers_form_id_idx" ON "review_answers" USING btree ("review_form_id");--> statement-breakpoint
CREATE INDEX "review_form_rating_dimensions_dimension_id_idx" ON "review_form_rating_dimensions" USING btree ("rating_dimension_id");--> statement-breakpoint
CREATE UNIQUE INDEX "review_forms_one_published" ON "review_forms" USING btree ((true)) WHERE "review_forms"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "review_questions_form_id_idx" ON "review_questions" USING btree ("review_form_id");--> statement-breakpoint
CREATE INDEX "review_ratings_form_id_idx" ON "review_ratings" USING btree ("review_form_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_active_author_store_unique" ON "reviews" USING btree ("store_id","user_id") WHERE "reviews"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "reviews_store_id_idx" ON "reviews" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "reviews_user_id_idx" ON "reviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reviews_form_id_idx" ON "reviews" USING btree ("review_form_id");--> statement-breakpoint
CREATE INDEX "reviews_store_status_published_at_idx" ON "reviews" USING btree ("store_id","status","published_at");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_categories_category_id_idx" ON "store_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stores_external_source_id_unique" ON "stores" USING btree ("external_source","external_id") WHERE "stores"."external_source" is not null and "stores"."external_id" is not null;--> statement-breakpoint
CREATE INDEX "stores_organization_id_idx" ON "stores" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "stores_duplicate_lookup_idx" ON "stores" USING btree ("organization_id","normalized_name","postal_code","address");--> statement-breakpoint
CREATE UNIQUE INDEX "users_active_email_unique" ON "users" USING btree (lower("email")) WHERE "users"."email" is not null and "users"."deleted_at" is null;