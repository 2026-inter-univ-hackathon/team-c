import { describe, expect, it } from "vitest";
import {
  MIN_PUBLIC_REVIEW_COUNT,
  isReviewContentPublic,
  remainingReviewsForPublic,
} from "./review-visibility";

describe("review visibility threshold", () => {
  it("hides content until the minimum count is reached", () => {
    expect(isReviewContentPublic(0)).toBe(false);
    expect(isReviewContentPublic(MIN_PUBLIC_REVIEW_COUNT - 1)).toBe(false);
    expect(isReviewContentPublic(MIN_PUBLIC_REVIEW_COUNT)).toBe(true);
    expect(isReviewContentPublic(MIN_PUBLIC_REVIEW_COUNT + 10)).toBe(true);
  });

  it("reports how many reviews are still needed", () => {
    expect(remainingReviewsForPublic(0)).toBe(MIN_PUBLIC_REVIEW_COUNT);
    expect(remainingReviewsForPublic(3)).toBe(MIN_PUBLIC_REVIEW_COUNT - 3);
    expect(remainingReviewsForPublic(MIN_PUBLIC_REVIEW_COUNT)).toBe(0);
    expect(remainingReviewsForPublic(MIN_PUBLIC_REVIEW_COUNT + 2)).toBe(0);
  });
});
