import type { Db } from "../../../db/client";
import { storeSearchSchema } from "../../../schemas/store-search";
import {
  searchPublicStores,
  getStoreFilters,
} from "../../repositories/search-stores";

export async function searchStoresUseCase(db: Db, input: unknown) {
  return searchPublicStores(db, storeSearchSchema.parse(input));
}
export async function storeFiltersUseCase(db: Db) {
  return getStoreFilters(db);
}
