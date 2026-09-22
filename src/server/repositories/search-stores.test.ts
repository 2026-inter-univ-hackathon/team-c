import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { createDbFromClient } from "../../db/client";
import { defaultSearch } from "../../schemas/store-search";
import { MIN_PUBLIC_REVIEW_COUNT } from "../../lib/review-visibility";
import {
  literalPattern,
  publicReviewCondition,
  publicStoreCondition,
  searchPublicStores,
} from "./search-stores";
describe("public search query boundaries", () => {
  it("treats SQL wildcard input as literal characters", () => {
    expect(literalPattern("100%_\\")).toBe("%100\\%\\_\\\\%");
  });
  it("excludes inactive and deleted stores", () => {
    const query = new PgDialect().sqlToQuery(publicStoreCondition()!);
    expect(query.sql).toContain('"stores"."deleted_at" is null');
    expect(query.params).toContain("ACTIVE");
  });
  it("excludes hidden, deleted, unpublished and undated reviews", () => {
    const query = new PgDialect().sqlToQuery(publicReviewCondition()!);
    for (const column of ["deleted_at", "hidden_at"])
      expect(query.sql).toContain(`"reviews"."${column}" is null`);
    expect(query.sql).toContain('"reviews"."published_at" is not null');
    expect(query.params).toContain("PUBLISHED");
  });
  it("parameterizes hostile keywords and never exposes all stores for empty saved IDs", async () => {
    const unsafe = vi
      .fn<
        (
          query: string,
          params: unknown[],
        ) => { values: () => Promise<unknown[][]> }
      >()
      .mockReturnValue({ values: async () => [] })
      .mockReturnValueOnce({ values: async () => [[0]] });
    // Exercise the actual Drizzle query compiler without connecting to a database.
    const db = createDbFromClient({
      unsafe,
      options: { parsers: {}, serializers: {} },
    } as never);
    await searchPublicStores(db, {
      ...defaultSearch,
      q: "' OR 1=1 --",
      ids: [],
    });
    const [query, params] = unsafe.mock.calls[0];
    expect(query).not.toContain("OR 1=1");
    expect(params).toContain("%' OR 1=1 --%");
    expect(query).toContain("false");
  });
});

it("clamps out-of-range pages and applies a bounded SQL limit after filtering", async () => {
  const unsafe = vi
    .fn<
      (
        query: string,
        params: unknown[],
      ) => { values: () => Promise<unknown[][]> }
    >()
    .mockReturnValue({ values: async () => [] })
    .mockReturnValueOnce({ values: async () => [[25]] });
  const db = createDbFromClient({
    unsafe,
    options: { parsers: {}, serializers: {} },
  } as never);
  const result = await searchPublicStores(db, {
    ...defaultSearch,
    page: 999,
    sort: "rating",
  });
  expect(result).toMatchObject({ page: 3, pageCount: 3, total: 25 });
  const [query, params] = unsafe.mock.calls[1];
  expect(query).toContain("desc nulls last");
  expect(query).toMatch(
    /case when "stores"\."review_count" >= \$\d+ then "stores"\."bayesian_score" end desc nulls last/,
  );
  expect(query).not.toContain("review_ratings");
  expect(query).toMatch(/limit \$\d+ offset \$\d+/);
  expect(params.slice(-2)).toEqual([12, 24]);
});

it("masks average ratings in SQL until a store reaches the review threshold", async () => {
  const unsafe = vi
    .fn<
      (
        query: string,
        params: unknown[],
      ) => { values: () => Promise<unknown[][]> }
    >()
    .mockReturnValue({ values: async () => [] })
    .mockReturnValueOnce({ values: async () => [[0]] });
  const db = createDbFromClient({
    unsafe,
    options: { parsers: {}, serializers: {} },
  } as never);
  await searchPublicStores(db, { ...defaultSearch, sort: "rating" });
  const [query, params] = unsafe.mock.calls[1];
  expect(query).toMatch(
    /case when "stores"\."review_count" >= \$\d+ then "overall_score" end/,
  );
  expect(query).toMatch(
    /case when "stores"\."review_count" >= \$\d+ then "stores"\."bayesian_score" end desc nulls last/,
  );
  expect(params).toContain(MIN_PUBLIC_REVIEW_COUNT);
});
