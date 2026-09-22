import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  decimal,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const id = uuid("id")
  .primaryKey()
  .default(sql`uuidv7()`);
const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const users = pgTable(
  "users",
  {
    id,
    email: varchar("email", { length: 320 }),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    avatarUrl: text("avatar_url"),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    check(
      "users_status_check",
      sql`${table.status} in ('ACTIVE', 'SUSPENDED', 'DELETED')`,
    ),
    uniqueIndex("users_active_email_unique")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.email} is not null and ${table.deletedAt} is null`),
  ],
);

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 50 }).notNull(),
    providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
    createdAt,
  },
  (table) => [
    unique("auth_accounts_provider_user_unique").on(
      table.provider,
      table.providerUserId,
    ),
    unique("auth_accounts_user_provider_unique").on(
      table.userId,
      table.provider,
    ),
    index("auth_accounts_user_id_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const platformRoles = pgTable("platform_roles", {
  id,
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
});

export const platformRoleAssignments = pgTable(
  "platform_role_assignments",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformRoleId: uuid("platform_role_id")
      .notNull()
      .references(() => platformRoles.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.platformRoleId],
      name: "platform_role_assignments_pk",
    }),
    index("platform_role_assignments_role_id_idx").on(table.platformRoleId),
  ],
);

export const organizations = pgTable(
  "organizations",
  {
    id,
    name: varchar("name", { length: 200 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    createdAt,
    updatedAt,
  },
  (table) => [
    check(
      "organizations_status_check",
      sql`${table.status} in ('ACTIVE', 'SUSPENDED', 'DELETED')`,
    ),
  ],
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("INVITED"),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.userId],
      name: "organization_memberships_pk",
    }),
    check(
      "organization_memberships_role_check",
      sql`${table.role} in ('OWNER', 'MANAGER', 'VIEWER')`,
    ),
    check(
      "organization_memberships_status_check",
      sql`${table.status} in ('INVITED', 'ACTIVE', 'SUSPENDED')`,
    ),
    index("organization_memberships_user_id_idx").on(table.userId),
  ],
);

export const stores = pgTable(
  "stores",
  {
    id,
    organizationId: uuid("organization_id").references(() => organizations.id),
    name: varchar("name", { length: 200 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 200 }).notNull(),
    postalCode: varchar("postal_code", { length: 20 }),
    prefecture: varchar("prefecture", { length: 50 }),
    city: varchar("city", { length: 100 }),
    address: varchar("address", { length: 500 }),
    latitude: decimal("latitude", { precision: 9, scale: 6 }),
    longitude: decimal("longitude", { precision: 9, scale: 6 }),
    externalSource: varchar("external_source", { length: 50 }),
    externalId: varchar("external_id", { length: 255 }),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    reviewCount: integer("review_count").notNull().default(0),
    avgAtmosphere: numeric("avg_atmosphere", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    avgTraining: numeric("avg_training", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    avgWorkloadComfort: numeric("avg_workload_comfort", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    avgFlexibility: numeric("avg_flexibility", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    overallScore: numeric("overall_score", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    bayesianScore: numeric("bayesian_score", {
      precision: 2,
      scale: 1,
      mode: "number",
    }),
    scoresUpdatedAt: timestamp("scores_updated_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    check(
      "stores_status_check",
      sql`${table.status} in ('DRAFT', 'ACTIVE', 'INACTIVE', 'MERGED', 'DELETED')`,
    ),
    check(
      "stores_latitude_check",
      sql`${table.latitude} is null or (${table.latitude} >= -90 and ${table.latitude} <= 90)`,
    ),
    check(
      "stores_longitude_check",
      sql`${table.longitude} is null or (${table.longitude} >= -180 and ${table.longitude} <= 180)`,
    ),
    uniqueIndex("stores_external_source_id_unique")
      .on(table.externalSource, table.externalId)
      .where(
        sql`${table.externalSource} is not null and ${table.externalId} is not null`,
      ),
    index("stores_organization_id_idx").on(table.organizationId),
    index("stores_bayesian_score_idx").on(table.bayesianScore),
    index("stores_duplicate_lookup_idx").on(
      table.organizationId,
      table.normalizedName,
      table.postalCode,
      table.address,
    ),
  ],
);

export const categories = pgTable("categories", {
  id,
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const storeCategories = pgTable(
  "store_categories",
  {
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.storeId, table.categoryId],
      name: "store_categories_pk",
    }),
    index("store_categories_category_id_idx").on(table.categoryId),
  ],
);

export const reviewForms = pgTable(
  "review_forms",
  {
    id,
    version: integer("version").notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt,
  },
  (table) => [
    check(
      "review_forms_status_check",
      sql`${table.status} in ('DRAFT', 'PUBLISHED', 'RETIRED')`,
    ),
    uniqueIndex("review_forms_one_published")
      .on(sql`(true)`)
      .where(sql`${table.status} = 'PUBLISHED'`),
  ],
);

export const reviewQuestions = pgTable(
  "review_questions",
  {
    id,
    reviewFormId: uuid("review_form_id")
      .notNull()
      .references(() => reviewForms.id),
    code: varchar("code", { length: 80 }).notNull(),
    label: varchar("label", { length: 300 }).notNull(),
    answerType: varchar("answer_type", { length: 50 }).notNull(),
    displayOrder: integer("display_order").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
    minLength: integer("min_length"),
    maxLength: integer("max_length"),
  },
  (table) => [
    unique("review_questions_form_code_unique").on(
      table.reviewFormId,
      table.code,
    ),
    unique("review_questions_id_form_id_unique").on(
      table.id,
      table.reviewFormId,
    ),
    check(
      "review_questions_label_length_check",
      sql`char_length(trim(${table.label})) between 1 and 300`,
    ),
    check(
      "review_questions_length_range_check",
      sql`(${table.minLength} is null and ${table.maxLength} is null) or (${table.minLength} is not null and ${table.maxLength} is not null and ${table.minLength} >= 0 and ${table.minLength} <= ${table.maxLength})`,
    ),
    index("review_questions_form_id_idx").on(table.reviewFormId),
  ],
);

export const ratingDimensions = pgTable("rating_dimensions", {
  id,
  code: varchar("code", { length: 80 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  displayOrder: integer("display_order").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const reviewFormRatingDimensions = pgTable(
  "review_form_rating_dimensions",
  {
    reviewFormId: uuid("review_form_id")
      .notNull()
      .references(() => reviewForms.id, { onDelete: "cascade" }),
    ratingDimensionId: uuid("rating_dimension_id")
      .notNull()
      .references(() => ratingDimensions.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").notNull(),
    isRequired: boolean("is_required").notNull().default(true),
  },
  (table) => [
    primaryKey({
      columns: [table.reviewFormId, table.ratingDimensionId],
      name: "review_form_rating_dimensions_pk",
    }),
    index("review_form_rating_dimensions_dimension_id_idx").on(
      table.ratingDimensionId,
    ),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id,
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    reviewFormId: uuid("review_form_id")
      .notNull()
      .references(() => reviewForms.id),
    employmentStartYear: smallint("employment_start_year"),
    employmentEndYear: smallint("employment_end_year"),
    employmentStatus: varchar("employment_status", { length: 20 }).notNull(),
    occupation: varchar("occupation", { length: 30 }),
    workDuration: varchar("work_duration", { length: 30 }),
    atmosphereTags: jsonb("atmosphere_tags").$type<string[]>(),
    staffTags: jsonb("staff_tags").$type<string[]>(),
    managerPresence: varchar("manager_presence", { length: 30 }),
    recommendation: varchar("recommendation", { length: 20 }),
    guidelineVersion: integer("guideline_version"),
    guidelineAgreedAt: timestamp("guideline_agreed_at", { withTimezone: true }),
    summary: varchar("summary", { length: 500 }).notNull(),
    publicAuthorLabel: varchar("public_author_label", { length: 100 }),
    status: varchar("status", { length: 20 }).notNull().default("DRAFT"),
    lockVersion: integer("lock_version").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    hiddenAt: timestamp("hidden_at", { withTimezone: true }),
    hiddenByUserId: uuid("hidden_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    hiddenReason: text("hidden_reason"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    unique("reviews_id_form_id_unique").on(table.id, table.reviewFormId),
    uniqueIndex("reviews_active_author_store_unique")
      .on(table.storeId, table.userId)
      .where(sql`${table.deletedAt} is null`),
    check(
      "reviews_status_check",
      sql`${table.status} in ('DRAFT', 'PUBLISHED', 'HIDDEN', 'DELETED')`,
    ),
    check(
      "reviews_employment_status_check",
      sql`${table.employmentStatus} in ('CURRENT', 'LEFT_RECENTLY', 'LEFT_LONG_AGO')`,
    ),
    check(
      "reviews_employment_year_range_check",
      sql`${table.employmentEndYear} is null or ${table.employmentStartYear} <= ${table.employmentEndYear}`,
    ),
    check(
      "reviews_current_end_year_check",
      sql`${table.employmentStatus} <> 'CURRENT' or ${table.employmentEndYear} is null`,
    ),
    check(
      "reviews_published_at_check",
      sql`${table.status} <> 'PUBLISHED' or ${table.publishedAt} is not null`,
    ),
    check(
      "reviews_hidden_fields_check",
      sql`${table.status} <> 'HIDDEN' or (${table.hiddenAt} is not null and ${table.hiddenReason} is not null and char_length(trim(${table.hiddenReason})) > 0)`,
    ),
    check(
      "reviews_deleted_at_check",
      sql`${table.status} <> 'DELETED' or ${table.deletedAt} is not null`,
    ),
    check(
      "reviews_summary_length_check",
      sql`char_length(trim(${table.summary})) between 30 and 300`,
    ),
    index("reviews_store_id_idx").on(table.storeId),
    index("reviews_user_id_idx").on(table.userId),
    index("reviews_form_id_idx").on(table.reviewFormId),
    index("reviews_store_status_published_at_idx").on(
      table.storeId,
      table.status,
      table.publishedAt,
    ),
  ],
);

export const reviewAnswers = pgTable(
  "review_answers",
  {
    reviewId: uuid("review_id").notNull(),
    reviewFormId: uuid("review_form_id").notNull(),
    reviewQuestionId: uuid("review_question_id").notNull(),
    answerText: text("answer_text").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.reviewId, table.reviewQuestionId],
      name: "review_answers_pk",
    }),
    foreignKey({
      columns: [table.reviewId, table.reviewFormId],
      foreignColumns: [reviews.id, reviews.reviewFormId],
      name: "review_answers_review_form_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.reviewQuestionId, table.reviewFormId],
      foreignColumns: [reviewQuestions.id, reviewQuestions.reviewFormId],
      name: "review_answers_question_form_fk",
    }),
    check(
      "review_answers_answer_text_not_blank_check",
      sql`char_length(trim(${table.answerText})) > 0`,
    ),
    index("review_answers_form_id_idx").on(table.reviewFormId),
  ],
);

export const reviewRatings = pgTable(
  "review_ratings",
  {
    reviewId: uuid("review_id").notNull(),
    reviewFormId: uuid("review_form_id").notNull(),
    ratingDimensionId: uuid("rating_dimension_id").notNull(),
    score: smallint("score").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.reviewId, table.ratingDimensionId],
      name: "review_ratings_pk",
    }),
    foreignKey({
      columns: [table.reviewId, table.reviewFormId],
      foreignColumns: [reviews.id, reviews.reviewFormId],
      name: "review_ratings_review_form_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.reviewFormId, table.ratingDimensionId],
      foreignColumns: [
        reviewFormRatingDimensions.reviewFormId,
        reviewFormRatingDimensions.ratingDimensionId,
      ],
      name: "review_ratings_form_dimension_fk",
    }),
    check("review_ratings_score_check", sql`${table.score} between 1 and 5`),
    index("review_ratings_form_id_idx").on(table.reviewFormId),
  ],
);
