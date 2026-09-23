import type { Db } from "../../../db/client";
import { storeSearchSchema } from "../../../schemas/store-search";
import {
  searchPublicStores,
  getStoreFilters,
} from "../../repositories/search-stores";
import {
  findSemanticMatches,
  hasSemanticIndex,
} from "../../repositories/review-embeddings";
import { embedSearchQuery } from "../../openai-embeddings";

export async function searchStoresUseCase(db: Db, input: unknown) {
  const parsed = storeSearchSchema.parse(input);
  if (!parsed.atmosphere) {
    const normalSearch =
      parsed.sort === "relevance"
        ? { ...parsed, sort: "name" as const }
        : parsed;
    return {
      ...(await searchPublicStores(db, normalSearch)),
      semanticMessage: null,
    };
  }
  const empty = { stores: [], total: 0, page: 1, pageCount: 1 };
  if (!process.env.OPENAI_API_KEY) {
    return {
      ...empty,
      semanticMessage:
        "雰囲気検索は現在準備中です。店舗名やエリアからお探しください。",
    };
  }
  try {
    if (!(await hasSemanticIndex(db))) {
      return {
        ...empty,
        semanticMessage:
          "検索対象の口コミを準備中です。店舗名やエリアからお探しください。",
      };
    }
    const queryEmbedding = await embedSearchQuery(parsed.atmosphere);
    const matches = await findSemanticMatches(db, parsed, queryEmbedding);
    return {
      ...(await searchPublicStores(db, parsed, matches)),
      semanticMessage: null,
    };
  } catch {
    console.error("semantic_search_failed");
    return {
      ...empty,
      semanticMessage:
        "雰囲気検索を利用できませんでした。時間をおいて再度お試しください。",
    };
  }
}
export async function storeFiltersUseCase(db: Db) {
  return getStoreFilters(db);
}
