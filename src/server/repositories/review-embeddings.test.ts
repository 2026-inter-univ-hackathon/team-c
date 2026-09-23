import { expect, it, vi } from "vitest";
import { createDbFromClient } from "../../db/client";
import { defaultSearch } from "../../schemas/store-search";
import { EMBEDDING_DIMENSIONS } from "../semantic-vectors";
import {
  findSemanticMatches,
  loadSemanticDocuments,
} from "./review-embeddings";

function mockDb(rows: unknown[][] = []) {
  const unsafe = vi.fn().mockReturnValue({ values: async () => rows });
  return {
    db: createDbFromClient({
      unsafe,
      options: { parsers: {}, serializers: {} },
    } as never),
    unsafe,
  };
}

it("applies public review and store conditions before building index text", async () => {
  const { db, unsafe } = mockDb();
  await loadSemanticDocuments(db);
  const [query, params] = unsafe.mock.calls[0];
  for (const field of [
    '"reviews"."deleted_at" is null',
    '"reviews"."hidden_at" is null',
    '"reviews"."published_at" is not null',
    '"stores"."deleted_at" is null',
  ]) {
    expect(query).toContain(field);
  }
  expect(params).toContain("PUBLISHED");
  expect(params).toContain("ACTIVE");
  expect(params).toContain(5001);
  expect(query).not.toContain('"users"');
  expect(query).not.toContain("public_author_label");
});

it("uses a parameterized pgvector cosine query with public filters", async () => {
  const { db, unsafe } = mockDb();
  const vector = [1, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)];
  await findSemanticMatches(
    db,
    { ...defaultSearch, atmosphere: "' OR 1=1 --", area: "東京" },
    vector,
  );
  const [query, params] = unsafe.mock.calls[0];
  expect(query).toContain("<=>");
  expect(query).toContain('"review_embeddings"."embedding"');
  expect(query).not.toContain("OR 1=1");
  expect(params).toContain("%東京%");
  expect(params).toContain(1000);
});

it("keeps only the nearest review for each store", async () => {
  const { db } = mockDb([
    ["store-a", "review-1", "nearest", 0.9],
    ["store-a", "review-2", "farther", 0.8],
    ["store-b", "review-3", "other", 0.7],
  ]);
  const vector = [1, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)];
  const matches = await findSemanticMatches(db, defaultSearch, vector);
  expect(matches.map(({ storeId, reviewId }) => [storeId, reviewId])).toEqual([
    ["store-a", "review-1"],
    ["store-b", "review-3"],
  ]);
});
