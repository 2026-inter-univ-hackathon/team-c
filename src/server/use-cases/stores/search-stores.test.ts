import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import { defaultSearch } from "../../../schemas/store-search";
import { embedSearchQuery } from "../../openai-embeddings";
import {
  findSemanticMatches,
  hasSemanticIndex,
} from "../../repositories/review-embeddings";
import { searchPublicStores } from "../../repositories/search-stores";
import { searchStoresUseCase } from "./search-stores";
vi.mock("../../repositories/search-stores", () => ({
  searchPublicStores: vi.fn(),
  getStoreFilters: vi.fn(),
}));
vi.mock("../../repositories/review-embeddings", () => ({
  findSemanticMatches: vi.fn(),
  hasSemanticIndex: vi.fn(),
}));
vi.mock("../../openai-embeddings", () => ({ embedSearchQuery: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OPENAI_API_KEY", "test-placeholder");
});
afterEach(() => vi.unstubAllEnvs());

it("rejects invalid input before any database search", async () => {
  await expect(
    searchStoresUseCase({} as Db, { ids: ["invalid"], page: Infinity }),
  ).rejects.toThrow();
  expect(searchPublicStores).not.toHaveBeenCalled();
});

it("keeps ordinary search independent of embedding configuration", async () => {
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.mocked(searchPublicStores).mockResolvedValue({
    stores: [],
    total: 0,
    page: 1,
    pageCount: 1,
  });
  const result = await searchStoresUseCase({} as Db, defaultSearch);
  expect(result.semanticMessage).toBeNull();
  expect(hasSemanticIndex).not.toHaveBeenCalled();
  expect(embedSearchQuery).not.toHaveBeenCalled();
});

it("does not call OpenAI while the index is absent", async () => {
  vi.mocked(hasSemanticIndex).mockResolvedValue(false);
  const result = await searchStoresUseCase({} as Db, {
    ...defaultSearch,
    atmosphere: "店長が優しい",
    sort: "relevance",
  });
  expect(result.semanticMessage).toContain("準備中");
  expect(embedSearchQuery).not.toHaveBeenCalled();
});

it("passes the query vector to DB ranking and keeps failures generic", async () => {
  vi.mocked(hasSemanticIndex).mockResolvedValue(true);
  vi.mocked(embedSearchQuery).mockResolvedValue([1]);
  vi.mocked(findSemanticMatches).mockRejectedValue(
    new Error("private provider details"),
  );
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  const result = await searchStoresUseCase({} as Db, {
    ...defaultSearch,
    atmosphere: "店長が優しい",
    sort: "relevance",
  });
  expect(result.semanticMessage).toContain("利用できませんでした");
  expect(JSON.stringify(result)).not.toContain("private");
  expect(log).toHaveBeenCalledWith("semantic_search_failed");
  log.mockRestore();
});
