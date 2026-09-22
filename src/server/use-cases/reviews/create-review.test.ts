import { describe, expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import {
  createReviewInputSchema,
  reviewScore,
  GUIDELINE_VERSION,
} from "../../../schemas/review-flow";
import { DEV_REVIEW_USER_ID } from "../../dev-review-access";
import type { PublishedReviewForm } from "../../repositories";
import {
  createReviewUseCase,
  type CreateReviewDependencies,
} from "./create-review";

const db = {} as Db;
const storeId = "40000000-0000-4000-8000-000000000001";
const form: PublishedReviewForm = {
  id: "60000000-0000-4000-8000-000000000002",
  version: 2,
  dimensions: ["atmosphere", "training", "workload", "flexibility"].map(
    (code, index) => ({
      id: `80000000-0000-4000-8000-${String(index + 2).padStart(12, "0")}`,
      code,
      label: code,
      displayOrder: index,
      isRequired: true,
    }),
  ),
};
const env = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://localhost/example_dev",
  DEV_DATABASE_NAME: "example_dev",
  ENABLE_DEV_REVIEW_POSTING: "true",
};
const validInput = () => ({
  storeId,
  employmentStatus: "CURRENT",
  occupation: "COLLEGE",
  workDuration: "AT_LEAST_YEAR",
  atmosphereTags: ["FRIENDLY"],
  staffTags: ["STUDENTS"],
  managerPresence: "USUALLY_PRESENT",
  recommendation: "YES",
  ratings: { atmosphere: 4, training: 4, workload: 3, flexibility: 4 },
  summary:
    "忙しい時間帯はありますが、先輩がすぐに助けてくれました。予定の相談もしやすかったです。",
  agreed: true,
  guidelineVersion: GUIDELINE_VERSION,
});
const deps = (): CreateReviewDependencies => ({
  getPublishedReviewForm: vi.fn().mockResolvedValue(form),
  createPublishedReview: vi.fn().mockResolvedValue("review-id"),
});

describe("review submission boundary", () => {
  it("does not call storage in public mode even for valid input", async () => {
    const d = deps();
    await expect(
      createReviewUseCase(db, validInput(), d, {
        ...env,
        NODE_ENV: "production",
      }),
    ).rejects.toThrow("開発環境");
    expect(d.createPublishedReview).not.toHaveBeenCalled();
  });
  it("accepts a complete review and assigns the fixed user internally", async () => {
    const d = deps();
    const result = await createReviewUseCase(db, validInput(), d, env);
    expect(result).toEqual({ ok: true, reviewId: "review-id" });
    expect(d.createPublishedReview).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        userId: DEV_REVIEW_USER_ID,
        guidelineVersion: GUIDELINE_VERSION,
        ratings: expect.arrayContaining([
          { ratingDimensionId: form.dimensions[0]!.id, score: 4 },
        ]),
      }),
    );
  });
  it("rejects missing consent on direct submission", async () => {
    const d = deps();
    const result = await createReviewUseCase(
      db,
      { ...validInput(), agreed: false },
      d,
      env,
    );
    expect(result.ok).toBe(false);
    expect(d.createPublishedReview).not.toHaveBeenCalled();
  });
  it("rejects caller-controlled identity and score", () => {
    expect(
      createReviewInputSchema.safeParse({ ...validInput(), userId: "other" })
        .success,
    ).toBe(false);
    expect(
      createReviewInputSchema.safeParse({ ...validInput(), overallScore: 5 })
        .success,
    ).toBe(false);
  });
  it("enforces tag cardinality, duplicates and score bounds", () => {
    for (const input of [
      { ...validInput(), atmosphereTags: [] },
      { ...validInput(), staffTags: ["STUDENTS", "STUDENTS"] },
      { ...validInput(), atmosphereTags: ["FRIENDLY", "QUIET", "FOCUSED"] },
      { ...validInput(), ratings: { ...validInput().ratings, workload: 0 } },
      { ...validInput(), ratings: { ...validInput().ratings, training: 6 } },
      { ...validInput(), ratings: { ...validInput().ratings, training: 2.5 } },
      { ...validInput(), guidelineVersion: 0 },
    ])
      expect(createReviewInputSchema.safeParse(input).success).toBe(false);
  });
  it("enforces the 30–300 codepoint boundary", () => {
    for (const length of [29, 301]) {
      expect(
        createReviewInputSchema.safeParse({
          ...validInput(),
          summary: "あ".repeat(length),
        }).success,
      ).toBe(false);
    }
    for (const length of [30, 300]) {
      expect(
        createReviewInputSchema.safeParse({
          ...validInput(),
          summary: "あ".repeat(length),
        }).success,
      ).toBe(true);
    }
  });
  it("keeps calculation unrounded and recommendation separate", () => {
    expect(reviewScore(validInput().ratings)).toBe(3.75);
  });
  it("rejects a summary containing a forbidden word", async () => {
    const d = deps();
    const result = await createReviewUseCase(
      db,
      {
        ...validInput(),
        summary:
          "先輩は本当にバカで無能だと思う。もっと詳しく説明してほしかった。",
      },
      d,
      env,
    );
    expect(result.ok).toBe(false);
    expect(d.createPublishedReview).not.toHaveBeenCalled();
  });
});
