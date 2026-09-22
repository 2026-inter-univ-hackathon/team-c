import {
  and,
  asc,
  avg,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  categories,
  reviews,
  ratingDimensions,
  reviewRatings,
  storeCategories,
  stores,
} from "../../db/schema";
import { PAGE_SIZE, type StoreSearch } from "../../schemas/store-search";

export const publicStoreCondition = () =>
  and(eq(stores.status, "ACTIVE"), isNull(stores.deletedAt));
export const publicReviewCondition = () =>
  and(
    eq(reviews.status, "PUBLISHED"),
    isNull(reviews.deletedAt),
    isNull(reviews.hiddenAt),
    isNotNull(reviews.publishedAt),
  );
export function literalPattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function searchPublicStores(db: Db, input: StoreSearch) {
  const metrics = db
    .select({
      storeId: reviews.storeId,
      reviewCount: countDistinct(reviews.id).as("review_count"),
      averageRating: sql<number | null>`${avg(reviewRatings.score)}`
        .mapWith(Number)
        .as("average_rating"),
    })
    .from(reviews)
    .leftJoin(reviewRatings, eq(reviewRatings.reviewId, reviews.id))
    .leftJoin(
      ratingDimensions,
      eq(ratingDimensions.id, reviewRatings.ratingDimensionId),
    )
    .where(
      and(
        publicReviewCondition(),
        isNotNull(reviews.occupation),
        inArray(ratingDimensions.code, [
          "atmosphere",
          "training",
          "workload",
          "flexibility",
        ]),
      ),
    )
    .groupBy(reviews.storeId)
    .as("metrics");
  const condition = and(
    publicStoreCondition(),
    input.q ? ilike(stores.name, literalPattern(input.q)) : undefined,
    input.area
      ? or(
          ilike(stores.prefecture, literalPattern(input.area)),
          ilike(stores.city, literalPattern(input.area)),
        )
      : undefined,
    input.category
      ? exists(
          db
            .select({ id: storeCategories.storeId })
            .from(storeCategories)
            .innerJoin(
              categories,
              eq(categories.id, storeCategories.categoryId),
            )
            .where(
              and(
                eq(storeCategories.storeId, stores.id),
                eq(categories.code, input.category),
                eq(categories.isActive, true),
              ),
            ),
        )
      : undefined,
    input.minRating > 0
      ? gte(metrics.averageRating, input.minRating)
      : undefined,
    input.ids
      ? input.ids.length
        ? inArray(stores.id, input.ids)
        : sql`false`
      : undefined,
  );
  const [totalRow] = await db
    .select({ total: count() })
    .from(stores)
    .leftJoin(metrics, eq(metrics.storeId, stores.id))
    .where(condition);
  const total = totalRow.total;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(input.page, pageCount);
  const order =
    input.sort === "rating"
      ? sql`${metrics.averageRating} desc nulls last`
      : input.sort === "reviews"
        ? sql`coalesce(${metrics.reviewCount}, 0) desc`
        : asc(stores.name);
  const rows = await db
    .select({
      id: stores.id,
      name: stores.name,
      prefecture: stores.prefecture,
      city: stores.city,
      reviewCount: metrics.reviewCount,
      averageRating: metrics.averageRating,
    })
    .from(stores)
    .leftJoin(metrics, eq(metrics.storeId, stores.id))
    .where(condition)
    .orderBy(order, asc(stores.name), asc(stores.id))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);
  const ids = rows.map((row) => row.id);
  const [categoryRows, excerpts] = ids.length
    ? await Promise.all([
        db
          .select({
            storeId: storeCategories.storeId,
            id: categories.id,
            code: categories.code,
            name: categories.name,
          })
          .from(storeCategories)
          .innerJoin(categories, eq(categories.id, storeCategories.categoryId))
          .where(
            and(
              inArray(storeCategories.storeId, ids),
              eq(categories.isActive, true),
            ),
          )
          .orderBy(asc(categories.name)),
        db
          .selectDistinctOn([reviews.storeId], {
            storeId: reviews.storeId,
            summary: reviews.summary,
          })
          .from(reviews)
          .where(and(inArray(reviews.storeId, ids), publicReviewCondition()))
          .orderBy(
            asc(reviews.storeId),
            desc(reviews.publishedAt),
            desc(reviews.id),
          ),
      ])
    : [[], []];
  return {
    stores: rows.map((row) => ({
      ...row,
      reviewCount: row.reviewCount ?? 0,
      categories: categoryRows
        .filter((category) => category.storeId === row.id)
        .map(({ id, code, name }) => ({ id, code, name })),
      reviewExcerpt:
        excerpts
          .find((review) => review.storeId === row.id)
          ?.summary.slice(0, 120) ?? null,
    })),
    total,
    page,
    pageCount,
  };
}

export async function getStoreFilters(db: Db) {
  const [categoryRows, areas] = await Promise.all([
    db
      .selectDistinct({ code: categories.code, name: categories.name })
      .from(categories)
      .innerJoin(storeCategories, eq(storeCategories.categoryId, categories.id))
      .innerJoin(stores, eq(stores.id, storeCategories.storeId))
      .where(and(publicStoreCondition(), eq(categories.isActive, true)))
      .orderBy(asc(categories.name)),
    db
      .selectDistinct({ prefecture: stores.prefecture })
      .from(stores)
      .where(and(publicStoreCondition(), isNotNull(stores.prefecture)))
      .orderBy(asc(stores.prefecture)),
  ]);
  return {
    categories: categoryRows,
    areas: areas
      .map((row) => row.prefecture)
      .filter((value): value is string => value !== null),
  };
}
