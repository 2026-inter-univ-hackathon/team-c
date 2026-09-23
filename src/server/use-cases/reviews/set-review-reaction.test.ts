import { describe, expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import { DEV_REVIEW_USER_ID } from "../../dev-review-access";
import {
  setReviewReactionInputSchema,
  setReviewReactionUseCase,
  type SetReviewReactionDependencies,
} from "./set-review-reaction";

const db = {} as Db;
const reviewId = "70000000-0000-4000-8000-000000000001";
const env = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://localhost/example_dev",
  DEV_DATABASE_NAME: "example_dev",
  ENABLE_DEV_REVIEW_POSTING: "true",
};
const input = {
  reviewId,
  reactionType: "HELPFUL" as const,
  reacted: true,
};
const deps = (found = true): SetReviewReactionDependencies => ({
  setReviewReaction: vi.fn().mockResolvedValue(found),
});

describe("review reaction boundary", () => {
  it("does not call storage in public mode", async () => {
    const d = deps();
    await expect(
      setReviewReactionUseCase(db, input, d, {
        ...env,
        NODE_ENV: "production",
      }),
    ).rejects.toThrow("開発環境");
    expect(d.setReviewReaction).not.toHaveBeenCalled();
  });

  it("assigns the fixed user internally", async () => {
    const d = deps();
    await expect(setReviewReactionUseCase(db, input, d, env)).resolves.toEqual({
      ok: true,
      reacted: true,
    });
    expect(d.setReviewReaction).toHaveBeenCalledWith(db, {
      reviewId,
      userId: DEV_REVIEW_USER_ID,
      reactionType: "HELPFUL",
      reacted: true,
    });
  });

  it("rejects caller-controlled identity and unknown reaction types", () => {
    expect(
      setReviewReactionInputSchema.safeParse({ ...input, userId: "other" })
        .success,
    ).toBe(false);
    expect(
      setReviewReactionInputSchema.safeParse({
        ...input,
        reactionType: "LIKE",
      }).success,
    ).toBe(false);
  });

  it("returns a generic not-found result for hidden or missing reviews", async () => {
    const d = deps(false);
    await expect(setReviewReactionUseCase(db, input, d, env)).resolves.toEqual({
      ok: false,
      message: "口コミが見つかりませんでした",
    });
  });
});
