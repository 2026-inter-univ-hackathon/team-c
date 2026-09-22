import { describe, expect, it, vi } from "vitest";
import { createDbFromClient } from "../../db/client";
import {
  listPublicReviewsByStoreId,
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
describe("listPublicReviewsByStoreId", () => {
  it("counts visible reviews in the same query that loads author attributes", async () => {
    const unsafe = vi
      .fn<
        (
          query: string,
          params: unknown[],
        ) => { values: () => Promise<unknown[][]> }
      >()
      .mockReturnValue({ values: async () => [] });
    const db = createDbFromClient({
      unsafe,
      options: { parsers: {}, serializers: {} },
    } as never);

    await listPublicReviewsByStoreId(
      db,
      "40000000-0000-4000-8000-000000000001",
    );

    expect(unsafe).toHaveBeenCalledTimes(1);
    const [query] = unsafe.mock.calls[0];
    expect(query).toMatch(/count\(\*\) over \(\).*as "visible_count"/);
  });
});
