import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
} from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  categories,
  reviewAnswers,
  reviewQuestions,
  reviewRatings,
  reviews,
  ratingDimensions,
  storeCategories,
  stores,
} from "../../db/schema";
import type {
  EmploymentStatus,
  NormalizedPublicListOptions,
  PublicCategory,
  PublicListOptions,
  PublicReview,
  PublicReviewAnswer,
  PublicReviewRating,
  PublicStoreDetail,
  PublicStoreSummary,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export function normalizePublicListOptions(
  options: PublicListOptions = {},
): NormalizedPublicListOptions {
  const rawLimit = options.limit ?? DEFAULT_LIMIT;
  const rawOffset = options.offset ?? 0;

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;
  const offset = Number.isFinite(rawOffset)
    ? Math.max(Math.trunc(rawOffset), 0)
    : 0;

  return { limit, offset };
}

export async function listPublicStores(
  db: Db,
  options?: PublicListOptions,
): Promise<PublicStoreSummary[]> {
  const { limit, offset } = normalizePublicListOptions(options);
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      prefecture: stores.prefecture,
      city: stores.city,
    })
    .from(stores)
    .where(activeStoreWhere())
    .orderBy(asc(stores.name), asc(stores.id))
    .limit(limit)
    .offset(offset);

  const storeIds = rows.map((row) => row.id);
  const [categoriesByStoreId, reviewCountsByStoreId] = await Promise.all([
    listCategoriesByStoreId(db, storeIds),
    countPublishedReviewsByStoreId(db, storeIds),
  ]);

  return rows.map((row) => ({
    ...row,
    categories: categoriesByStoreId.get(row.id) ?? [],
    reviewCount: reviewCountsByStoreId.get(row.id) ?? 0,
  }));
}

export async function getPublicStoreById(
  db: Db,
  storeId: string,
): Promise<PublicStoreDetail | null> {
  const [row] = await db
    .select({
      id: stores.id,
      name: stores.name,
      postalCode: stores.postalCode,
      prefecture: stores.prefecture,
      city: stores.city,
      address: stores.address,
      latitude: stores.latitude,
      longitude: stores.longitude,
    })
    .from(stores)
    .where(and(eq(stores.id, storeId), activeStoreWhere()))
    .limit(1);

  if (!row) {
    return null;
  }

  const [categoriesByStoreId, reviewCountsByStoreId] = await Promise.all([
    listCategoriesByStoreId(db, [row.id]),
    countPublishedReviewsByStoreId(db, [row.id]),
  ]);

  return {
    ...row,
    categories: categoriesByStoreId.get(row.id) ?? [],
    reviewCount: reviewCountsByStoreId.get(row.id) ?? 0,
  };
}

export async function listPublicReviewsByStoreId(
  db: Db,
  storeId: string,
  options?: PublicListOptions,
): Promise<PublicReview[]> {
  const { limit, offset } = normalizePublicListOptions(options);
  const rows = await db
    .select({
      id: reviews.id,
      summary: reviews.summary,
      publicAuthorLabel: reviews.publicAuthorLabel,
      employmentStartYear: reviews.employmentStartYear,
      employmentEndYear: reviews.employmentEndYear,
      employmentStatus: reviews.employmentStatus,
      publishedAt: reviews.publishedAt,
    })
    .from(reviews)
    .innerJoin(stores, and(eq(reviews.storeId, stores.id), activeStoreWhere()))
    .where(and(eq(reviews.storeId, storeId), publishedReviewWhere()))
    .orderBy(desc(reviews.publishedAt), desc(reviews.id))
    .limit(limit)
    .offset(offset);

  const reviewIds = rows.map((row) => row.id);
  const [answersByReviewId, ratingsByReviewId] = await Promise.all([
    listAnswersByReviewId(db, reviewIds),
    listRatingsByReviewId(db, reviewIds),
  ]);

  return rows.map((row) => {
    if (!row.publishedAt) {
      throw new Error("Published review row has no publishedAt");
    }

    return {
      id: row.id,
      summary: row.summary,
      publicAuthorLabel: row.publicAuthorLabel,
      employmentStartYear: row.employmentStartYear,
      employmentEndYear: row.employmentEndYear,
      employmentStatus: row.employmentStatus as EmploymentStatus,
      publishedAt: row.publishedAt,
      answers: answersByReviewId.get(row.id) ?? [],
      ratings: ratingsByReviewId.get(row.id) ?? [],
    };
  });
}

function activeStoreWhere() {
  return and(eq(stores.status, "ACTIVE"), isNull(stores.deletedAt));
}

function publishedReviewWhere() {
  return and(
    eq(reviews.status, "PUBLISHED"),
    isNull(reviews.deletedAt),
    isNull(reviews.hiddenAt),
    isNotNull(reviews.publishedAt),
  );
}

async function listCategoriesByStoreId(
  db: Db,
  storeIds: string[],
): Promise<Map<string, PublicCategory[]>> {
  if (storeIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      storeId: storeCategories.storeId,
      id: categories.id,
      code: categories.code,
      name: categories.name,
    })
    .from(storeCategories)
    .innerJoin(categories, eq(storeCategories.categoryId, categories.id))
    .where(
      and(
        inArray(storeCategories.storeId, storeIds),
        eq(categories.isActive, true),
      ),
    )
    .orderBy(asc(categories.name), asc(categories.id));

  const map = new Map<string, PublicCategory[]>();

  for (const row of rows) {
    const list = map.get(row.storeId) ?? [];
    list.push({ id: row.id, code: row.code, name: row.name });
    map.set(row.storeId, list);
  }

  return map;
}

async function countPublishedReviewsByStoreId(
  db: Db,
  storeIds: string[],
): Promise<Map<string, number>> {
  if (storeIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      storeId: reviews.storeId,
      reviewCount: count(reviews.id),
    })
    .from(reviews)
    .where(and(inArray(reviews.storeId, storeIds), publishedReviewWhere()))
    .groupBy(reviews.storeId);

  return new Map(rows.map((row) => [row.storeId, row.reviewCount]));
}

async function listAnswersByReviewId(
  db: Db,
  reviewIds: string[],
): Promise<Map<string, PublicReviewAnswer[]>> {
  if (reviewIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      reviewId: reviewAnswers.reviewId,
      questionCode: reviewQuestions.code,
      questionLabel: reviewQuestions.label,
      displayOrder: reviewQuestions.displayOrder,
      answerText: reviewAnswers.answerText,
    })
    .from(reviewAnswers)
    .innerJoin(
      reviewQuestions,
      and(
        eq(reviewAnswers.reviewQuestionId, reviewQuestions.id),
        eq(reviewAnswers.reviewFormId, reviewQuestions.reviewFormId),
      ),
    )
    .where(inArray(reviewAnswers.reviewId, reviewIds))
    .orderBy(asc(reviewAnswers.reviewId), asc(reviewQuestions.displayOrder));

  return groupRowsByReviewId(rows, (row) => ({
    questionCode: row.questionCode,
    questionLabel: row.questionLabel,
    displayOrder: row.displayOrder,
    answerText: row.answerText,
  }));
}

async function listRatingsByReviewId(
  db: Db,
  reviewIds: string[],
): Promise<Map<string, PublicReviewRating[]>> {
  if (reviewIds.length === 0) {
    return new Map();
  }

  const rows = await db
    .select({
      reviewId: reviewRatings.reviewId,
      dimensionCode: ratingDimensions.code,
      dimensionLabel: ratingDimensions.label,
      displayOrder: ratingDimensions.displayOrder,
      score: reviewRatings.score,
    })
    .from(reviewRatings)
    .innerJoin(
      ratingDimensions,
      eq(reviewRatings.ratingDimensionId, ratingDimensions.id),
    )
    .where(
      and(
        inArray(reviewRatings.reviewId, reviewIds),
        eq(ratingDimensions.isActive, true),
      ),
    )
    .orderBy(asc(reviewRatings.reviewId), asc(ratingDimensions.displayOrder));

  return groupRowsByReviewId(rows, (row) => ({
    dimensionCode: row.dimensionCode,
    dimensionLabel: row.dimensionLabel,
    displayOrder: row.displayOrder,
    score: row.score,
  }));
}

function groupRowsByReviewId<T, R>(
  rows: Array<T & { reviewId: string }>,
  mapRow: (row: T & { reviewId: string }) => R,
): Map<string, R[]> {
  const map = new Map<string, R[]>();

  for (const row of rows) {
    const list = map.get(row.reviewId) ?? [];
    list.push(mapRow(row));
    map.set(row.reviewId, list);
  }

  return map;
}
