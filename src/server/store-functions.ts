import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { storeSearchSchema } from "../schemas/store-search";
import { withDb } from "./db";
import {
  searchStoresUseCase,
  storeFiltersUseCase,
} from "./use-cases/stores/search-stores";
import {
  getPublicStoreDetailUseCase,
  listPublicStoreReviewsUseCase,
} from "./use-cases";

async function publicRead<T>(operation: string, callback: () => Promise<T>) {
  try {
    return await callback();
  } catch {
    // Do not log queries, user input, connection strings or internal errors.
    console.error("public_store_read_failed", { operation });
    throw new Error(
      "データを読み込めませんでした。時間をおいて再度お試しください。",
    );
  }
}
export const searchStores = createServerFn({ method: "GET" })
  .validator((input: unknown) => storeSearchSchema.parse(input))
  .handler(({ data }) =>
    publicRead("search", () => withDb((db) => searchStoresUseCase(db, data))),
  );
export const getFilters = createServerFn({ method: "GET" }).handler(() =>
  publicRead("filters", () => withDb((db) => storeFiltersUseCase(db))),
);
const detailSchema = z.object({
  storeId: z.uuid(),
  page: z.number().int().min(1).max(10000).default(1),
});
export const getStoreDetail = createServerFn({ method: "GET" })
  .validator((input: unknown) => detailSchema.parse(input))
  .handler(({ data }) =>
    publicRead("detail", () =>
      withDb(async (db) => {
        const store = await getPublicStoreDetailUseCase(db, data);
        // Below the anonymity threshold only the count is public, so there
        // is nothing to paginate and no review bodies to load.
        const pageCount = store?.reviewsPublic
          ? Math.max(1, Math.ceil(store.reviewCount / 10))
          : 1;
        const page = Math.min(data.page, pageCount);
        const reviews = store?.reviewsPublic
          ? await listPublicStoreReviewsUseCase(db, {
              storeId: data.storeId,
              limit: 10,
              offset: (page - 1) * 10,
            })
          : [];
        return {
          store,
          page,
          pageCount,
          reviews,
        };
      }),
    ),
  );
