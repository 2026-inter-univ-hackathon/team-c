import { describe, expect, it } from "vitest";
import { analyze } from "./analytics";
import { demoStores } from "./demo-data";
describe("company report scope", () => {
  it("filters months and recomputes scores from the same reviews", () => {
    expect(analyze("all", "6").selected).toHaveLength(4);
    expect(analyze("all", "3").selected).toHaveLength(2);
    expect(analyze(demoStores[0].id, "3").average).toBe(4.5);
    expect(analyze(demoStores[0].id, "6").average).toBe(4.25);
  });
  it("does not show a rating for a store without reviews in the period", () => {
    const result = analyze(demoStores[2].id, "3");
    expect(result.selected).toHaveLength(0);
    expect(result.average).toBeNull();
    expect(result.averages).toEqual([null, null, null, null]);
  });
});
