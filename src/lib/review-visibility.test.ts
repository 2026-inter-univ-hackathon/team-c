import { describe, expect, it } from "vitest";
import {
  MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES,
  coarseAttributesNotice,
  coarseAuthorAttributes,
  hasDetailedAttributes,
  publicAuthorAttributes,
  remainingForDetailedAttributes,
} from "./review-visibility";

const author = {
  employmentStatus: "LEFT_RECENTLY",
  occupation: "HIGH_SCHOOL",
  workDuration: "UNDER_3_MONTHS",
} as const;

describe("attribute detail threshold", () => {
  it("shows detailed attributes only once enough reviews exist", () => {
    expect(hasDetailedAttributes(0)).toBe(false);
    expect(hasDetailedAttributes(MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES - 1)).toBe(
      false,
    );
    expect(hasDetailedAttributes(MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES)).toBe(
      true,
    );
  });

  it("reports how many reviews are still needed", () => {
    expect(remainingForDetailedAttributes(3)).toBe(
      MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES - 3,
    );
    expect(
      remainingForDetailedAttributes(MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES + 2),
    ).toBe(0);
    expect(coarseAttributesNotice(3)).toContain("あと2件");
  });
});

describe("author attribute generalization", () => {
  it("collapses students and workers, current and former, and hides tenure", () => {
    expect(coarseAuthorAttributes(author)).toEqual({
      detail: "COARSE",
      employmentStatus: "LEFT",
      occupation: "STUDENT",
      workDuration: null,
    });
    expect(
      coarseAuthorAttributes({
        employmentStatus: "CURRENT",
        occupation: "HOMEMAKER",
        workDuration: "AT_LEAST_YEAR",
      }),
    ).toEqual({
      detail: "COARSE",
      employmentStatus: "CURRENT",
      occupation: "WORKER",
      workDuration: null,
    });
    expect(
      coarseAuthorAttributes({ ...author, occupation: "COLLEGE" }).occupation,
    ).toBe("STUDENT");
    expect(
      coarseAuthorAttributes({ ...author, occupation: "FREELANCER" })
        .occupation,
    ).toBe("WORKER");
  });

  it("keeps the original attributes once the store has enough reviews", () => {
    expect(
      publicAuthorAttributes(author, MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES),
    ).toEqual({ detail: "DETAILED", ...author });
    expect(
      publicAuthorAttributes(author, MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES - 1)
        .detail,
    ).toBe("COARSE");
  });
});
