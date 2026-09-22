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
  ratingDimensions,
  reviewRatings,
  reviews,
  storeCategories,
  stores,
} from "../../db/schema";
import {
  fuzzyPublishedAt,
  ratingCodes,
  type CreateReviewInput,
} from "../../schemas/review-flow";
import { isReviewContentPublic } from "../../lib/review-visibility";
import type {
  NormalizedPublicListOptions,
  PublicCategory,
  PublicListOptions,
  PublicRatingSummary,
  PublicReview,
  PublicReviewRating,
  PublicStoreDetail,
  PublicStoreSummary,
} from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const visibleReview = () =>
  and(
    eq(reviews.status, "PUBLISHED"),
    isNull(reviews.deletedAt),
    isNull(reviews.hiddenAt),
    isNotNull(reviews.publishedAt),
    isNotNull(reviews.occupation),
  );

export function normalizePublicListOptions(
  options: PublicListOptions = {},
): NormalizedPublicListOptions {
  const rawLimit = options.limit ?? DEFAULT_LIMIT;
  const rawOffset = options.offset ?? 0;
  return {
    limit: Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), MAX_LIMIT)
      : DEFAULT_LIMIT,
    offset: Number.isFinite(rawOffset) ? Math.max(Math.trunc(rawOffset), 0) : 0,
  };
}

async function categoriesFor(
  db: Db,
  ids: string[],
): Promise<Map<string, PublicCategory[]>> {
  const map = new Map<string, PublicCategory[]>();
  if (!ids.length) return map;
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
      and(inArray(storeCategories.storeId, ids), eq(categories.isActive, true)),
    )
    .orderBy(asc(categories.name));
  for (const row of rows)
    map.set(row.storeId, [
      ...(map.get(row.storeId) ?? []),
      { id: row.id, code: row.code, name: row.name },
    ]);
  return map;
}

export type StoreMetrics = {
  reviewCount: number;
  reviewsPublic: boolean;
  averageRating: number | null;
  reviewExcerpt: string | null;
};

/**
 * 口コミ件数が閾値未満の職場では、評価と本文の抜粋を伏せて件数だけを残す。
 */
export function applyReviewVisibility(
  metrics: Omit<StoreMetrics, "reviewsPublic">,
): StoreMetrics {
  const reviewsPublic = isReviewContentPublic(metrics.reviewCount);
  return {
    reviewCount: metrics.reviewCount,
    reviewsPublic,
    averageRating: reviewsPublic ? metrics.averageRating : null,
    reviewExcerpt: reviewsPublic ? metrics.reviewExcerpt : null,
  };
}

const emptyMetrics = (): StoreMetrics => ({
  reviewCount: 0,
  reviewsPublic: false,
  averageRating: null,
  reviewExcerpt: null,
});

async function metricsFor(db: Db, ids: string[]) {
  const map = new Map<string, StoreMetrics>();
  if (!ids.length) return map;
  const rows = await db
    .select({
      storeId: reviews.storeId,
      id: reviews.id,
      summary: reviews.summary,
      publishedAt: reviews.publishedAt,
    })
    .from(reviews)
    .where(and(inArray(reviews.storeId, ids), visibleReview()))
    .orderBy(desc(reviews.publishedAt), desc(reviews.id));
  const ratings = await ratingsFor(
    db,
    rows.map((row) => row.id),
  );
  const raw = new Map<string, Omit<StoreMetrics, "reviewsPublic">>();
  for (const row of rows) {
    const old = raw.get(row.storeId) ?? {
      reviewCount: 0,
      averageRating: null,
      reviewExcerpt: null,
    };
    const values = ratings.get(row.id) ?? [];
    const score =
      values.length === 4
        ? values.reduce((sum, value) => sum + value.score, 0) / 4
        : null;
    const scoreTotal =
      (old.averageRating ?? 0) * old.reviewCount + (score ?? 0);
    raw.set(row.storeId, {
      reviewCount: old.reviewCount + 1,
      averageRating:
        score === null ? old.averageRating : scoreTotal / (old.reviewCount + 1),
      reviewExcerpt:
        old.reviewExcerpt ??
        row.summary.trim().replace(/\s+/g, " ").slice(0, 96),
    });
  }
  for (const [storeId, metrics] of raw)
    map.set(storeId, applyReviewVisibility(metrics));
  return map;
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
    .where(and(eq(stores.status, "ACTIVE"), isNull(stores.deletedAt)))
    .orderBy(asc(stores.name))
    .limit(limit)
    .offset(offset);
  const ids = rows.map((row) => row.id);
  const [cats, metrics] = await Promise.all([
    categoriesFor(db, ids),
    metricsFor(db, ids),
  ]);
  return rows.map((row) => ({
    ...row,
    categories: cats.get(row.id) ?? [],
    ...(metrics.get(row.id) ?? emptyMetrics()),
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
    })
    .from(stores)
    .where(
      and(
        eq(stores.id, storeId),
        eq(stores.status, "ACTIVE"),
        isNull(stores.deletedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  const [cats, metrics, ratingSummary] = await Promise.all([
    categoriesFor(db, [storeId]),
    metricsFor(db, [storeId]),
    ratingSummaryFor(db, storeId),
  ]);
  const m = metrics.get(storeId) ?? emptyMetrics();
  return {
    ...row,
    categories: cats.get(storeId) ?? [],
    ...m,
    ratingSummary: m.reviewsPublic
      ? ratingSummary
      : ratingSummary.map((summary) => ({ ...summary, averageScore: null })),
  };
}

async function ratingsFor(
  db: Db,
  reviewIds: string[],
): Promise<Map<string, PublicReviewRating[]>> {
  const map = new Map<string, PublicReviewRating[]>();
  if (!reviewIds.length) return map;
  const rows = await db
    .select({
      reviewId: reviewRatings.reviewId,
      code: ratingDimensions.code,
      label: ratingDimensions.label,
      order: ratingDimensions.displayOrder,
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
        inArray(ratingDimensions.code, [...ratingCodes]),
      ),
    );
  for (const row of rows)
    map.set(row.reviewId, [
      ...(map.get(row.reviewId) ?? []),
      {
        dimensionCode: row.code,
        dimensionLabel: row.label,
        displayOrder: row.order,
        score: row.score,
      },
    ]);
  return map;
}

async function ratingSummaryFor(
  db: Db,
  storeId: string,
): Promise<PublicRatingSummary[]> {
  const dimensions = await db
    .select({
      id: ratingDimensions.id,
      code: ratingDimensions.code,
      label: ratingDimensions.label,
      order: ratingDimensions.displayOrder,
    })
    .from(ratingDimensions)
    .where(inArray(ratingDimensions.code, [...ratingCodes]))
    .orderBy(asc(ratingDimensions.displayOrder));
  const reviewRows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.storeId, storeId), visibleReview()));
  const ratings = await ratingsFor(
    db,
    reviewRows.map((row) => row.id),
  );
  return dimensions.map((dimension) => {
    const scores = [...ratings.values()]
      .flat()
      .filter((rating) => rating.dimensionCode === dimension.code);
    return {
      dimensionCode: dimension.code,
      dimensionLabel: dimension.label,
      displayOrder: dimension.order,
      averageScore: scores.length
        ? scores.reduce((sum, value) => sum + value.score, 0) / scores.length
        : null,
    };
  });
}

export async function listPublicReviewsByStoreId(
  db: Db,
  storeId: string,
  options?: PublicListOptions,
): Promise<PublicReview[]> {
  const { limit, offset } = normalizePublicListOptions(options);
  // Server-side guard: never return review bodies for a store below the
  // anonymity threshold, whatever the caller asked for.
  const [visible] = await db
    .select({ total: count() })
    .from(reviews)
    .where(and(eq(reviews.storeId, storeId), visibleReview()));
  if (!isReviewContentPublic(visible?.total ?? 0)) return [];
  const rows = await db
    .select({
      id: reviews.id,
      summary: reviews.summary,
      employmentStatus: reviews.employmentStatus,
      occupation: reviews.occupation,
      workDuration: reviews.workDuration,
      atmosphereTags: reviews.atmosphereTags,
      staffTags: reviews.staffTags,
      managerPresence: reviews.managerPresence,
      recommendation: reviews.recommendation,
      publishedAt: reviews.publishedAt,
    })
    .from(reviews)
    .innerJoin(stores, eq(stores.id, reviews.storeId))
    .where(
      and(
        eq(reviews.storeId, storeId),
        visibleReview(),
        eq(stores.status, "ACTIVE"),
        isNull(stores.deletedAt),
      ),
    )
    .orderBy(desc(reviews.publishedAt), desc(reviews.id))
    .limit(limit)
    .offset(offset);
  const ratings = await ratingsFor(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => {
    const values = ratings.get(row.id) ?? [];
    const byCode = Object.fromEntries(
      values.map((value) => [value.dimensionCode, value.score]),
    );
    const scoreInput = Object.fromEntries(
      ratingCodes.map((code) => [code, byCode[code] ?? 0]),
    ) as CreateReviewInput["ratings"];
    return {
      id: row.id,
      summary: row.summary,
      employmentStatus:
        row.employmentStatus as PublicReview["employmentStatus"],
      occupation: row.occupation as PublicReview["occupation"],
      workDuration: row.workDuration as PublicReview["workDuration"],
      atmosphereTags: row.atmosphereTags as PublicReview["atmosphereTags"],
      staffTags: row.staffTags as PublicReview["staffTags"],
      managerPresence: row.managerPresence as PublicReview["managerPresence"],
      recommendation: row.recommendation as PublicReview["recommendation"],
      publishedAt: fuzzyPublishedAt(row.publishedAt!),
      ratings: values.sort((a, b) => a.displayOrder - b.displayOrder),
      overallScore:
        values.length === 4
          ? Object.values(scoreInput).reduce((sum, value) => sum + value, 0) / 4
          : 0,
    };
  });
}
