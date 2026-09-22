import { describe, expect, it } from "vitest";
import { fuzzyPublishedAt } from "../schemas/review-flow";
import { formatFuzzyDate } from "./fuzzy-date";

describe("public review dates", () => {
  it.each([
    ["2026-04-10T14:59:59.999Z", "2026年4月上旬"],
    ["2026-04-10T15:00:00.000Z", "2026年4月中旬"],
    ["2026-04-20T14:59:59.999Z", "2026年4月中旬"],
    ["2026-04-20T15:00:00.000Z", "2026年4月下旬"],
    ["2026-04-30T15:00:00.000Z", "2026年5月上旬"],
    ["2026-12-31T15:00:00.000Z", "2027年1月上旬"],
    ["2024-02-29T00:00:00.000Z", "2024年2月下旬"],
  ])("rounds %s at the Tokyo boundary", (input, expected) => {
    expect(formatFuzzyDate(input)).toBe(expected);
    expect(fuzzyPublishedAt(new Date(input))).toBe(expected);
  });
});
