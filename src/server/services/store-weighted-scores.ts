import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../../db/client";
import {
  ratingDimensions,
  reviewRatings,
  reviews,
  stores,
} from "../../db/schema";
import {
  employmentStatuses,
  ratingCodes,
  workDurations,
} from "../../schemas/review-flow";
import { withDb } from "../db";

export const GLOBAL_MEAN = 3.2;
export const CONFIDENCE_WEIGHT = 3.0;
export const TENURE_WEIGHTS = {
  UNDER_3_MONTHS: 0.8,
  MONTHS_3_TO_12: 1.0,
  AT_LEAST_YEAR: 1.1,
} as const satisfies Record<(typeof workDurations)[number], number>;
export const FRESHNESS_WEIGHTS = {
  CURRENT: 1.2,
  LEFT_RECENTLY: 1.0,
  LEFT_LONG_AGO: 0.7,
} as const satisfies Record<(typeof employmentStatuses)[number], number>;

type WorkDuration = (typeof workDurations)[number];
type EmploymentStatus = (typeof employmentStatuses)[number];
export type WeightedStoreReview = {
  workDuration: WorkDuration;
  employmentStatus: EmploymentStatus;
  atmosphere: number;
  training: number;
  workloadComfort: number;
  flexibility: number;
};
export type WeightedStoreScores = {
  reviewCount: number;
  avgAtmosphere: number | null;
  avgTraining: number | null;
  avgWorkloadComfort: number | null;
  avgFlexibility: number | null;
  overallScore: number | null;
  bayesianScore: number | null;
};
const emptyScores: WeightedStoreScores = {
  reviewCount: 0,
  avgAtmosphere: null,
  avgTraining: null,
  avgWorkloadComfort: null,
  avgFlexibility: null,
  overallScore: null,
  bayesianScore: null,
};
const roundToOneDecimal = (value: number) =>
  Math.round((value + Number.EPSILON) * 10) / 10;

export function calculateReviewWeight(
  review: Pick<WeightedStoreReview, "workDuration" | "employmentStatus">,
): number {
  return (
    TENURE_WEIGHTS[review.workDuration] *
    FRESHNESS_WEIGHTS[review.employmentStatus]
  );
}

export function calculateWeightedStoreScores(
  storeReviews: readonly WeightedStoreReview[],
): WeightedStoreScores {
  if (storeReviews.length === 0) return { ...emptyScores };
  let totalWeight = 0;
  let atmosphereTotal = 0;
  let trainingTotal = 0;
  let workloadComfortTotal = 0;
  let flexibilityTotal = 0;
  let overallTotal = 0;
  for (const review of storeReviews) {
    const weight = calculateReviewWeight(review);
    const overall =
      (review.atmosphere +
        review.training +
        review.workloadComfort +
        review.flexibility) /
      4;
    totalWeight += weight;
    atmosphereTotal += weight * review.atmosphere;
    trainingTotal += weight * review.training;
    workloadComfortTotal += weight * review.workloadComfort;
    flexibilityTotal += weight * review.flexibility;
    overallTotal += weight * overall;
  }
  if (totalWeight <= 0) return { ...emptyScores };
  return {
    reviewCount: storeReviews.length,
    avgAtmosphere: roundToOneDecimal(atmosphereTotal / totalWeight),
    avgTraining: roundToOneDecimal(trainingTotal / totalWeight),
    avgWorkloadComfort: roundToOneDecimal(workloadComfortTotal / totalWeight),
    avgFlexibility: roundToOneDecimal(flexibilityTotal / totalWeight),
    overallScore: roundToOneDecimal(overallTotal / totalWeight),
    bayesianScore: roundToOneDecimal(
      (CONFIDENCE_WEIGHT * GLOBAL_MEAN + overallTotal) /
        (CONFIDENCE_WEIGHT + totalWeight),
    ),
  };
}

function isEmploymentStatus(value: string): value is EmploymentStatus {
  return (employmentStatuses as readonly string[]).includes(value);
}
export function scoreableReviewCondition(storeId: string) {
  return and(
    eq(reviews.storeId, storeId),
    eq(reviews.status, "PUBLISHED"),
    isNull(reviews.deletedAt),
    isNull(reviews.hiddenAt),
    isNotNull(reviews.publishedAt),
    isNotNull(reviews.workDuration),
  );
}
function isWorkDuration(value: string | null): value is WorkDuration {
  return value !== null && (workDurations as readonly string[]).includes(value);
}

type StoreScoreDb = Pick<Db, "select" | "update">;

export async function syncStoreWeightedScoresWithDb(
  db: StoreScoreDb,
  storeId: string,
): Promise<WeightedStoreScores> {
  const rows = await db
    .select({
      reviewId: reviews.id,
      employmentStatus: reviews.employmentStatus,
      workDuration: reviews.workDuration,
      dimensionCode: ratingDimensions.code,
      score: reviewRatings.score,
    })
    .from(reviews)
    .innerJoin(reviewRatings, eq(reviewRatings.reviewId, reviews.id))
    .innerJoin(
      ratingDimensions,
      eq(ratingDimensions.id, reviewRatings.ratingDimensionId),
    )
    .where(
      and(
        scoreableReviewCondition(storeId),
        inArray(ratingDimensions.code, [...ratingCodes]),
      ),
    );
  const grouped = new Map<
    string,
    {
      employmentStatus: string;
      workDuration: string | null;
      ratings: Partial<Record<(typeof ratingCodes)[number], number>>;
    }
  >();
  for (const row of rows) {
    const current = grouped.get(row.reviewId) ?? {
      employmentStatus: row.employmentStatus,
      workDuration: row.workDuration,
      ratings: {},
    };
    if ((ratingCodes as readonly string[]).includes(row.dimensionCode)) {
      current.ratings[row.dimensionCode as (typeof ratingCodes)[number]] =
        row.score;
    }
    grouped.set(row.reviewId, current);
  }
  const validReviews: WeightedStoreReview[] = [];
  for (const review of grouped.values()) {
    const { ratings } = review;
    if (
      !isEmploymentStatus(review.employmentStatus) ||
      !isWorkDuration(review.workDuration) ||
      ratingCodes.some(
        (code) =>
          ratings[code] === undefined ||
          ratings[code]! < 1 ||
          ratings[code]! > 5,
      )
    )
      continue;
    validReviews.push({
      employmentStatus: review.employmentStatus,
      workDuration: review.workDuration,
      atmosphere: ratings.atmosphere!,
      training: ratings.training!,
      workloadComfort: ratings.workload!,
      flexibility: ratings.flexibility!,
    });
  }
  const scores = calculateWeightedStoreScores(validReviews);
  const [updated] = await db
    .update(stores)
    .set({ ...scores, scoresUpdatedAt: new Date() })
    .where(eq(stores.id, storeId))
    .returning({ id: stores.id });
  if (!updated) throw new Error("Store not found");
  return scores;
}

export async function syncStoreWeightedScores(
  storeId: string,
): Promise<WeightedStoreScores> {
  const validStoreId = z.uuid().parse(storeId);
  return withDb((db) => syncStoreWeightedScoresWithDb(db, validStoreId));
}
