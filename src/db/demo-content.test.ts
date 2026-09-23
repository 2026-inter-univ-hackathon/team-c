import { describe, expect, it } from "vitest";
import { containsForbiddenWord } from "../lib/forbidden-words";
import {
  GUIDELINE_VERSION,
  createReviewInputSchema,
} from "../schemas/review-flow";
import {
  demoReviewCountForStore,
  demoReviewProfiles,
  demoStoreAt,
} from "./demo-content";

const allProfiles = Object.values(demoReviewProfiles).flat();

describe("demo content", () => {
  it("creates 50 uniquely named stores across every supported category", () => {
    const stores = Array.from({ length: 50 }, (_, index) => demoStoreAt(index));

    expect(new Set(stores.map((store) => store.name)).size).toBe(50);
    expect(new Set(stores.map((store) => store.kind.code))).toEqual(
      new Set(["cafe", "convenience", "education"]),
    );
  });

  it("provides 214 reviews while retaining both privacy display states", () => {
    const counts = Array.from({ length: 50 }, (_, index) =>
      demoReviewCountForStore(index),
    );

    expect(counts.reduce((total, count) => total + count, 0)).toBe(214);
    expect(counts.filter((count) => count >= 5)).toHaveLength(24);
    expect(counts.filter((count) => count < 5)).toHaveLength(26);
    expect(Math.min(...counts)).toBe(3);
    expect(Math.max(...counts)).toBe(5);
  });

  it("keeps every review profile publishable and clearly fictional", () => {
    expect(allProfiles).toHaveLength(15);
    expect(new Set(allProfiles.map((profile) => profile.summary)).size).toBe(
      15,
    );

    for (const profile of allProfiles) {
      const summary = `【架空の口コミ】${profile.summary}`;
      expect(Array.from(summary).length).toBeGreaterThanOrEqual(30);
      expect(Array.from(summary).length).toBeLessThanOrEqual(300);
      expect(containsForbiddenWord(summary)).toBe(false);
      expect(() =>
        createReviewInputSchema.parse({
          storeId: "40000000-0000-4000-8000-000000000001",
          employmentStatus: "CURRENT",
          occupation: "COLLEGE",
          workDuration: "AT_LEAST_YEAR",
          atmosphereTags: profile.atmosphereTags,
          staffTags: profile.staffTags,
          managerPresence: profile.managerPresence,
          ratings: profile.ratings,
          recommendation: profile.recommendation,
          summary,
          agreed: true,
          guidelineVersion: GUIDELINE_VERSION,
        }),
      ).not.toThrow();
    }
  });

  it("rejects store indexes outside the deterministic seed range", () => {
    expect(() => demoStoreAt(-1)).toThrow(RangeError);
    expect(() => demoStoreAt(50)).toThrow(RangeError);
    expect(() => demoReviewCountForStore(-1)).toThrow(RangeError);
    expect(() => demoReviewCountForStore(50)).toThrow(RangeError);
  });
});
