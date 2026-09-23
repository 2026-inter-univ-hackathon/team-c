import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { storeSearchSchema } from "../schemas/store-search";
import { withDb } from "./db";
import {
  DEV_REVIEW_USER_ID,
  isDevReviewPostingEnabled,
} from "./dev-review-access";
import {
  searchStoresUseCase,
  storeFiltersUseCase,
} from "./use-cases/stores/search-stores";
import {
  getPublicStoreDetailUseCase,
  listPublicStoreReviewsUseCase,
  setReviewReactionUseCase,
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
export const searchStores = createServerFn({ method: "POST" })
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
        const pageCount = Math.max(
          1,
          Math.ceil((store?.reviewCount ?? 0) / 10),
        );
        const page = Math.min(data.page, pageCount);
        const reviews = store
          ? await listPublicStoreReviewsUseCase(db, {
              storeId: data.storeId,
              limit: 10,
              offset: (page - 1) * 10,
              viewerUserId: isDevReviewPostingEnabled(process.env)
                ? DEV_REVIEW_USER_ID
                : null,
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

const reactionSchema = z.strictObject({
  reviewId: z.uuid(),
  reactionType: z.enum(["HELPFUL", "THANKS", "USEFUL"]),
  reacted: z.boolean(),
});

export const reactToReview = createServerFn({ method: "POST" })
  .validator((input: unknown) => reactionSchema.parse(input))
  .handler(async ({ data }) => {
    if (!isDevReviewPostingEnabled(process.env)) {
      return {
        ok: false as const,
        message: "リアクションは開発環境でのみ利用できます",
      };
    }
    try {
      return await withDb((db) => setReviewReactionUseCase(db, data));
    } catch {
      console.error("review_reaction_failed");
      return {
        ok: false as const,
        message: "リアクションを保存できませんでした",
      };
    }
  });
