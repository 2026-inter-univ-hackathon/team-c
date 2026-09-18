import { and, asc, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  categories,
  ratingDimensions,
  reviewAnswers,
  reviewQuestions,
  reviewRatings,
  reviews,
  storeCategories,
  stores,
} from "../../db/schema";
import type {
  EmploymentStatus,
  NormalizedPublicListOptions,
  PublicCategory,
  PublicListOptions,
  PublicRatingSummary,
  PublicReview,
  PublicReviewAnswer,
  PublicReviewRating,
  PublicStoreDetail,
  PublicStoreSummary,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const REVIEW_EXCERPT_LENGTH = 96;

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
  const [categoriesByStoreId, metricsByStoreId] = await Promise.all([
    listCategoriesByStoreId(db, storeIds),
    getStoreMetricsByStoreId(db, storeIds),
  ]);

  return rows.map((row) => {
    const metrics = metricsByStoreId.get(row.id);

    return {
      ...row,
      categories: categoriesByStoreId.get(row.id) ?? [],
      reviewCount: metrics?.reviewCount ?? 0,
      averageRating: metrics?.averageRating ?? null,
      reviewExcerpt: metrics?.reviewExcerpt ?? null,
    };
  });
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
    })
    .from(stores)
    .where(and(eq(stores.id, storeId), activeStoreWhere()))
    .limit(1);

  if (!row) {
    return null;
  }

  const [categoriesByStoreId, metricsByStoreId, ratingSummary] =
    await Promise.all([
      listCategoriesByStoreId(db, [row.id]),
      getStoreMetricsByStoreId(db, [row.id]),
      getRatingSummaryByStoreId(db, row.id),
    ]);
  const metrics = metricsByStoreId.get(row.id);

  return {
    ...row,
    categories: categoriesByStoreId.get(row.id) ?? [],
    reviewCount: metrics?.reviewCount ?? 0,
    averageRating: metrics?.averageRating ?? null,
    reviewExcerpt: metrics?.reviewExcerpt ?? null,
    ratingSummary,
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

type StoreMetrics = {
  reviewCount: number;
  averageRating: number | null;
  reviewExcerpt: string | null;
};

async function getStoreMetricsByStoreId(
  db: Db,
  storeIds: string[],
): Promise<Map<string, StoreMetrics>> {
  if (storeIds.length === 0) {
    return new Map();
  }

  const reviewRows = await db
    .select({
      storeId: reviews.storeId,
      reviewId: reviews.id,
      summary: reviews.summary,
      publishedAt: reviews.publishedAt,
    })
    .from(reviews)
    .where(and(inArray(reviews.storeId, storeIds), publishedReviewWhere()))
    .orderBy(desc(reviews.publishedAt), desc(reviews.id));

  const reviewIds = reviewRows.map((row) => row.reviewId);
  const ratingRows =
    reviewIds.length > 0
      ? await db
          .select({
            reviewId: reviewRatings.reviewId,
            score: reviewRatings.score,
          })
          .from(reviewRatings)
          .where(inArray(reviewRatings.reviewId, reviewIds))
      : [];
  const storeIdByReviewId = new Map(
    reviewRows.map((row) => [row.reviewId, row.storeId]),
  );
  const metricDrafts = new Map<
    string,
    StoreMetrics & { ratingScoreTotal: number; ratingScoreCount: number }
  >();

  for (const row of reviewRows) {
    const draft = metricDrafts.get(row.storeId) ?? {
      reviewCount: 0,
      averageRating: null,
      reviewExcerpt: null,
      ratingScoreTotal: 0,
      ratingScoreCount: 0,
    };

    draft.reviewCount += 1;
    draft.reviewExcerpt ??= createReviewExcerpt(row.summary);
    metricDrafts.set(row.storeId, draft);
  }

  for (const row of ratingRows) {
    const storeId = storeIdByReviewId.get(row.reviewId);

    if (!storeId) {
      continue;
    }

    const draft = metricDrafts.get(storeId);

    if (!draft) {
      continue;
    }

    draft.ratingScoreTotal += row.score;
    draft.ratingScoreCount += 1;
  }

  return new Map(
    [...metricDrafts.entries()].map(([storeId, draft]) => [
      storeId,
      {
        reviewCount: draft.reviewCount,
        averageRating:
          draft.ratingScoreCount > 0
            ? roundToOneDecimal(draft.ratingScoreTotal / draft.ratingScoreCount)
            : null,
        reviewExcerpt: draft.reviewExcerpt,
      },
    ]),
  );
}

async function getRatingSummaryByStoreId(
  db: Db,
  storeId: string,
): Promise<PublicRatingSummary[]> {
  const dimensions = await db
    .select({
      id: ratingDimensions.id,
      code: ratingDimensions.code,
      label: ratingDimensions.label,
      displayOrder: ratingDimensions.displayOrder,
    })
    .from(ratingDimensions)
    .where(eq(ratingDimensions.isActive, true))
    .orderBy(asc(ratingDimensions.displayOrder), asc(ratingDimensions.id));

  const ratingRows = await db
    .select({
      dimensionId: reviewRatings.ratingDimensionId,
      score: reviewRatings.score,
    })
    .from(reviewRatings)
    .innerJoin(reviews, eq(reviewRatings.reviewId, reviews.id))
    .where(and(eq(reviews.storeId, storeId), publishedReviewWhere()));
  const scoresByDimensionId = new Map<
    string,
    { total: number; count: number }
  >();

  for (const row of ratingRows) {
    const draft = scoresByDimensionId.get(row.dimensionId) ?? {
      total: 0,
      count: 0,
    };

    draft.total += row.score;
    draft.count += 1;
    scoresByDimensionId.set(row.dimensionId, draft);
  }

  return dimensions.map((dimension) => {
    const scores = scoresByDimensionId.get(dimension.id);

    return {
      dimensionCode: dimension.code,
      dimensionLabel: dimension.label,
      displayOrder: dimension.displayOrder,
      averageScore: scores
        ? roundToOneDecimal(scores.total / scores.count)
        : null,
    };
  });
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

function createReviewExcerpt(summary: string): string {
  const normalized = summary.trim().replace(/\s+/g, " ");

  if (normalized.length <= REVIEW_EXCERPT_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, REVIEW_EXCERPT_LENGTH)}...`;
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}
