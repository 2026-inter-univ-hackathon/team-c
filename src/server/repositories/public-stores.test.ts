import { describe, expect, it } from "vitest";
import { normalizePublicListOptions } from "./public-stores";

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
