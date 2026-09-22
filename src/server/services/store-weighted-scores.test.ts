import { describe, expect, it } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import {
  calculateReviewWeight,
  calculateWeightedStoreScores,
  syncStoreWeightedScores,
  scoreableReviewCondition,
  type WeightedStoreReview,
} from "./store-weighted-scores";

const baseReview: WeightedStoreReview = {
  workDuration: "MONTHS_3_TO_12",
  employmentStatus: "LEFT_RECENTLY",
  atmosphere: 3,
  training: 3,
  workloadComfort: 3,
  flexibility: 3,
};

describe("calculateReviewWeight", () => {
  it.each([
    ["UNDER_3_MONTHS", "CURRENT", 0.96],
    ["MONTHS_3_TO_12", "LEFT_RECENTLY", 1],
    ["AT_LEAST_YEAR", "LEFT_LONG_AGO", 0.77],
  ] as const)(
    "combines %s and %s weights",
    (workDuration, employmentStatus, expected) => {
      expect(
        calculateReviewWeight({ workDuration, employmentStatus }),
      ).toBeCloseTo(expected);
    },
  );
});

describe("scoreableReviewCondition", () => {
  it("only includes published, visible, dated reviews with a tenure", () => {
    const query = new PgDialect().sqlToQuery(
      scoreableReviewCondition("40000000-0000-4000-8000-000000000001")!,
    );
    expect(query.params).toContain("PUBLISHED");
    for (const column of ["deleted_at", "hidden_at"]) {
      expect(query.sql).toContain(`"reviews"."${column}" is null`);
    }
    expect(query.sql).toContain('"reviews"."published_at" is not null');
    expect(query.sql).toContain('"reviews"."work_duration" is not null');
  });
});
describe("calculateWeightedStoreScores", () => {
  it("returns safe empty values when there are no valid reviews", () => {
    expect(calculateWeightedStoreScores([])).toEqual({
      reviewCount: 0,
      avgAtmosphere: null,
      avgTraining: null,
      avgWorkloadComfort: null,
      avgFlexibility: null,
      overallScore: null,
      bayesianScore: null,
    });
  });

  it("calculates and rounds weighted dimension and overall scores", () => {
    const result = calculateWeightedStoreScores([
      {
        ...baseReview,
        workDuration: "AT_LEAST_YEAR",
        employmentStatus: "CURRENT",
        atmosphere: 5,
        training: 4,
        workloadComfort: 3,
        flexibility: 2,
      },
      {
        ...baseReview,
        workDuration: "UNDER_3_MONTHS",
        employmentStatus: "LEFT_LONG_AGO",
        atmosphere: 1,
        training: 2,
        workloadComfort: 3,
        flexibility: 4,
      },
    ]);
    expect(result).toEqual({
      reviewCount: 2,
      avgAtmosphere: 3.8,
      avgTraining: 3.4,
      avgWorkloadComfort: 3,
      avgFlexibility: 2.6,
      overallScore: 3.2,
      bayesianScore: 3.2,
    });
  });

  it("pulls a single perfect review toward the platform mean", () => {
    const result = calculateWeightedStoreScores([
      {
        ...baseReview,
        workDuration: "AT_LEAST_YEAR",
        employmentStatus: "CURRENT",
        atmosphere: 5,
        training: 5,
        workloadComfort: 5,
        flexibility: 5,
      },
    ]);
    expect(result.overallScore).toBe(5);
    expect(result.bayesianScore).toBe(3.8);
  });

  it("validates store ids before opening a database connection", async () => {
    await expect(syncStoreWeightedScores("not-a-uuid")).rejects.toThrow();
  });
});
