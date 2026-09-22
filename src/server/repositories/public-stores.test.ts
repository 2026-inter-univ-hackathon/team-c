import { describe, expect, it } from "vitest";
import { MIN_PUBLIC_REVIEW_COUNT } from "../../lib/review-visibility";
import {
  applyReviewVisibility,
  normalizePublicListOptions,
} from "./public-stores";

describe("normalizePublicListOptions", () => {
  it("uses defaults when options are omitted", () => {
    expect(normalizePublicListOptions()).toEqual({ limit: 20, offset: 0 });
  });

  it("clamps limit and offset to safe values", () => {
    expect(normalizePublicListOptions({ limit: 1000, offset: -10 })).toEqual({
      limit: 50,
      offset: 0,
    });
  });

  it("normalizes decimal values", () => {
    expect(normalizePublicListOptions({ limit: 12.8, offset: 3.9 })).toEqual({
      limit: 12,
      offset: 3,
    });
  });
});

describe("applyReviewVisibility", () => {
  const metrics = {
    reviewCount: 0,
    averageRating: 4.2,
    reviewExcerpt: "楽しい職場でした",
  };

  it("hides rating and excerpt below the anonymity threshold", () => {
    expect(
      applyReviewVisibility({
        ...metrics,
        reviewCount: MIN_PUBLIC_REVIEW_COUNT - 1,
      }),
    ).toEqual({
      reviewCount: MIN_PUBLIC_REVIEW_COUNT - 1,
      reviewsPublic: false,
      averageRating: null,
      reviewExcerpt: null,
    });
  });

  it("keeps rating and excerpt once the threshold is reached", () => {
    expect(
      applyReviewVisibility({
        ...metrics,
        reviewCount: MIN_PUBLIC_REVIEW_COUNT,
      }),
    ).toEqual({
      reviewCount: MIN_PUBLIC_REVIEW_COUNT,
      reviewsPublic: true,
      averageRating: 4.2,
      reviewExcerpt: "楽しい職場でした",
    });
  });
});
