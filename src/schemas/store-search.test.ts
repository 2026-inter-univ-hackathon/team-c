import { describe, expect, it } from "vitest";
import {
  defaultSearch,
  parseSearchParams,
  storeSearchSchema,
} from "./store-search";
describe("public store search input", () => {
  it("normalizes valid URL numbers and trims keywords", () => {
    expect(
      storeSearchSchema.parse({ q: " cafe ", page: "2", minRating: "4" }),
    ).toMatchObject({ q: "cafe", page: 2, minRating: 4 });
  });
  it.each([
    { page: -1 },
    { page: 1.2 },
    { page: 10001 },
    { minRating: 6 },
    { minRating: "NaN" },
    { sort: "sql" },
    { q: "a".repeat(101) },
    { ids: ["not-a-uuid"] },
    { ids: Array(101).fill("40000000-0000-4000-8000-000000000001") },
  ])("rejects unsafe input %j", (input) => {
    expect(storeSearchSchema.safeParse(input).success).toBe(false);
  });
  it("does not allow URLs to supply saved IDs", () => {
    expect(
      parseSearchParams({ ids: ["40000000-0000-4000-8000-000000000001"] }).ids,
    ).toBeUndefined();
  });
  it("falls back safely on invalid URL state", () => {
    expect(parseSearchParams({ page: "bad" })).toEqual(defaultSearch);
  });
});
