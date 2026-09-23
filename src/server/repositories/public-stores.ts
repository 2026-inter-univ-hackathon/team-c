import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  categories,
  ratingDimensions,
  reviewRatings,
  reviewReactions,
  reviews,
  storeCategories,
  stores,
} from "../../db/schema";
import {
  fuzzyPublishedAt,
  ratingCodes,
  type CreateReviewInput,
} from "../../schemas/review-flow";
import {
  reviewReactionLabels,
  reviewReactionTypes,
  type ReviewReactionType,
} from "../../schemas/review-reactions";
import { formatFuzzyMonth } from "../../lib/fuzzy-date";
import {
  hasDetailedAttributes,
  publicAuthorAttributes,
} from "../../lib/review-visibility";
import type {
  NormalizedPublicListOptions,
  PublicCategory,
  PublicListOptions,
  PublicReview,
  PublicReviewRating,
  PublicReviewReaction,
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

async function excerptsFor(db: Db, ids: string[]) {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const rows = await db
    .selectDistinctOn([reviews.storeId], {
      storeId: reviews.storeId,
      summary: reviews.summary,
    })
    .from(reviews)
    .where(and(inArray(reviews.storeId, ids), visibleReview()))
    .orderBy(asc(reviews.storeId), desc(reviews.publishedAt), desc(reviews.id));
  for (const row of rows)
    map.set(row.storeId, row.summary.trim().replace(/\s+/g, " ").slice(0, 96));
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
      reviewCount: stores.reviewCount,
      averageRating: stores.overallScore,
    })
    .from(stores)
    .where(and(eq(stores.status, "ACTIVE"), isNull(stores.deletedAt)))
    .orderBy(asc(stores.name))
    .limit(limit)
    .offset(offset);
  const ids = rows.map((row) => row.id);
  const [cats, excerpts] = await Promise.all([
    categoriesFor(db, ids),
    excerptsFor(db, ids),
  ]);
  return rows.map((row) => ({
    ...row,
    detailedAttributes: hasDetailedAttributes(row.reviewCount),
    categories: cats.get(row.id) ?? [],
    reviewExcerpt: excerpts.get(row.id) ?? null,
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
      reviewCount: stores.reviewCount,
      averageRating: stores.overallScore,
      avgAtmosphere: stores.avgAtmosphere,
      avgTraining: stores.avgTraining,
      avgWorkloadComfort: stores.avgWorkloadComfort,
      avgFlexibility: stores.avgFlexibility,
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
  const [cats, excerpts] = await Promise.all([
    categoriesFor(db, [storeId]),
    excerptsFor(db, [storeId]),
  ]);
  const ratingSummary = [
    {
      dimensionCode: "atmosphere",
      dimensionLabel: "職場の雰囲気",
      displayOrder: 10,
      averageScore: row.avgAtmosphere,
    },
    {
      dimensionCode: "training",
      dimensionLabel: "教育・フォロー体制",
      displayOrder: 20,
      averageScore: row.avgTraining,
    },
    {
      dimensionCode: "workload",
      dimensionLabel: "業務のゆとり",
      displayOrder: 30,
      averageScore: row.avgWorkloadComfort,
    },
    {
      dimensionCode: "flexibility",
      dimensionLabel: "シフトの融通度",
      displayOrder: 40,
      averageScore: row.avgFlexibility,
    },
  ];
  return {
    id: row.id,
    name: row.name,
    postalCode: row.postalCode,
    prefecture: row.prefecture,
    city: row.city,
    address: row.address,
    reviewCount: row.reviewCount,
    detailedAttributes: hasDetailedAttributes(row.reviewCount),
    averageRating: row.averageRating,
    categories: cats.get(storeId) ?? [],
    reviewExcerpt: excerpts.get(storeId) ?? null,
    ratingSummary,
  };
}

function defaultReactionSummary(): PublicReviewReaction[] {
  return reviewReactionTypes.map((type) => ({
    type,
    label: reviewReactionLabels[type],
    count: 0,
    reacted: false,
  }));
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

async function reactionsFor(
  db: Db,
  reviewIds: string[],
  viewerUserId: string | null,
): Promise<Map<string, PublicReviewReaction[]>> {
  const map = new Map(
    reviewIds.map((reviewId) => [reviewId, defaultReactionSummary()]),
  );
  if (!reviewIds.length) return map;
  const rows = await db
    .select({
      reviewId: reviewReactions.reviewId,
      reactionType: reviewReactions.reactionType,
      count: sql<number>`count(*)::int`.mapWith(Number),
      reacted: viewerUserId
        ? sql<boolean>`bool_or(${reviewReactions.userId} = ${viewerUserId})`.mapWith(
            Boolean,
          )
        : sql<boolean>`false`.mapWith(Boolean),
    })
    .from(reviewReactions)
    .where(inArray(reviewReactions.reviewId, reviewIds))
    .groupBy(reviewReactions.reviewId, reviewReactions.reactionType);
  for (const row of rows) {
    const reactions = map.get(row.reviewId);
    const reaction = reactions?.find(
      (item) => item.type === (row.reactionType as ReviewReactionType),
    );
    if (reaction) {
      reaction.count = row.count;
      reaction.reacted = row.reacted;
    }
  }
  return map;
}

export async function listPublicReviewsByStoreId(
  db: Db,
  storeId: string,
  options?: PublicListOptions,
): Promise<PublicReview[]> {
  const { limit, offset, viewerUserId } = normalizePublicListOptions(options);
  // Count and rows must share one database snapshot. Otherwise a review could
  // be hidden between separate queries and expose detailed attributes below
  // the anonymity threshold.
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
      visibleCount: sql<number>`count(*) over ()`
        .mapWith(Number)
        .as("visible_count"),
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
  const reviewIds = rows.map((row) => row.id);
  const [ratings, reactions] = await Promise.all([
    ratingsFor(db, reviewIds),
    reactionsFor(db, reviewIds, viewerUserId),
  ]);
  return rows.map((row) => {
    const detailed = hasDetailedAttributes(row.visibleCount);
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
      author: publicAuthorAttributes(
        {
          employmentStatus:
            row.employmentStatus as CreateReviewInput["employmentStatus"],
          occupation: row.occupation as CreateReviewInput["occupation"],
          workDuration: row.workDuration as CreateReviewInput["workDuration"],
        },
        row.visibleCount,
      ),
      atmosphereTags: row.atmosphereTags as PublicReview["atmosphereTags"],
      staffTags: row.staffTags as PublicReview["staffTags"],
      managerPresence: row.managerPresence as PublicReview["managerPresence"],
      recommendation: row.recommendation as PublicReview["recommendation"],
      publishedAt: detailed
        ? fuzzyPublishedAt(row.publishedAt!)
        : formatFuzzyMonth(row.publishedAt!),
      ratings: values.sort((a, b) => a.displayOrder - b.displayOrder),
      reactions: reactions.get(row.id) ?? defaultReactionSummary(),
      overallScore:
        values.length === 4
          ? Object.values(scoreInput).reduce((sum, value) => sum + value, 0) / 4
          : 0,
    };
  });
}
