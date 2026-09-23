import {
  and,
  asc,
  cosineDistance,
  eq,
  exists,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  categories,
  reviewEmbeddings,
  reviews,
  storeCategories,
  stores,
} from "../../db/schema";
import type { StoreSearch } from "../../schemas/store-search";
import {
  documentHash,
  EMBEDDING_MODEL,
  MAX_DOCUMENT_CHARS,
  MAX_INDEX_REVIEWS,
  MAX_SEMANTIC_CANDIDATES,
  MIN_SIMILARITY,
} from "../semantic-vectors";
import {
  literalPattern,
  publicReviewCondition,
  publicStoreCondition,
} from "./search-stores";

export type SemanticDocument = {
  reviewId: string;
  text: string;
  sourceHash: string;
  indexedHash: string | null;
  model: string | null;
};

export type SemanticMatch = {
  storeId: string;
  reviewId: string;
  score: number;
  text: string;
};

function documentText(row: {
  summary: string;
  atmosphereTags: string[] | null;
  staffTags: string[] | null;
  managerPresence: string | null;
  recommendation: string | null;
}) {
  return [
    row.summary,
    row.atmosphereTags?.length
      ? `職場の雰囲気: ${row.atmosphereTags.join("、")}`
      : null,
    row.staffTags?.length ? `一緒に働く人: ${row.staffTags.join("、")}` : null,
    row.managerPresence ? `店長・責任者: ${row.managerPresence}` : null,
    row.recommendation ? `おすすめ度: ${row.recommendation}` : null,
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, MAX_DOCUMENT_CHARS);
}

export async function loadSemanticDocuments(db: Db, reviewId?: string) {
  const rows = await db
    .select({
      reviewId: reviews.id,
      summary: reviews.summary,
      atmosphereTags: reviews.atmosphereTags,
      staffTags: reviews.staffTags,
      managerPresence: reviews.managerPresence,
      recommendation: reviews.recommendation,
      indexedHash: reviewEmbeddings.sourceHash,
      model: reviewEmbeddings.model,
    })
    .from(reviews)
    .innerJoin(stores, eq(stores.id, reviews.storeId))
    .leftJoin(reviewEmbeddings, eq(reviewEmbeddings.reviewId, reviews.id))
    .where(
      and(
        publicReviewCondition(),
        publicStoreCondition(),
        reviewId ? eq(reviews.id, reviewId) : undefined,
      ),
    )
    .orderBy(asc(reviews.id))
    .limit(MAX_INDEX_REVIEWS + 1);

  if (rows.length > MAX_INDEX_REVIEWS) {
    throw new Error("Semantic index capacity exceeded");
  }

  return rows.map((row): SemanticDocument => {
    const text = documentText(row);
    return { ...row, text, sourceHash: documentHash(text) };
  });
}

export function isCurrentEmbedding(document: SemanticDocument) {
  return (
    document.model === EMBEDDING_MODEL &&
    document.indexedHash === document.sourceHash
  );
}

export async function hasSemanticIndex(db: Db) {
  const [row] = await db
    .select({ reviewId: reviewEmbeddings.reviewId })
    .from(reviewEmbeddings)
    .innerJoin(reviews, eq(reviews.id, reviewEmbeddings.reviewId))
    .innerJoin(stores, eq(stores.id, reviews.storeId))
    .where(
      and(
        publicReviewCondition(),
        publicStoreCondition(),
        eq(reviewEmbeddings.model, EMBEDDING_MODEL),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function findSemanticMatches(
  db: Db,
  input: StoreSearch,
  queryEmbedding: number[],
) {
  const distance = cosineDistance(reviewEmbeddings.embedding, queryEmbedding);
  const rows = await db
    .select({
      storeId: reviews.storeId,
      reviewId: reviews.id,
      text: reviews.summary,
      score: sql<number>`1 - (${distance})`,
    })
    .from(reviewEmbeddings)
    .innerJoin(reviews, eq(reviews.id, reviewEmbeddings.reviewId))
    .innerJoin(stores, eq(stores.id, reviews.storeId))
    .where(
      and(
        publicReviewCondition(),
        publicStoreCondition(),
        eq(reviewEmbeddings.model, EMBEDDING_MODEL),
        lte(distance, 1 - MIN_SIMILARITY),
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
          ? gte(stores.overallScore, input.minRating)
          : undefined,
        input.ids
          ? input.ids.length
            ? inArray(stores.id, input.ids)
            : sql`false`
          : undefined,
      ),
    )
    .orderBy(asc(distance))
    .limit(MAX_SEMANTIC_CANDIDATES);

  const bestByStore = new Map<string, SemanticMatch>();
  for (const row of rows) {
    if (!bestByStore.has(row.storeId)) bestByStore.set(row.storeId, row);
  }
  return [...bestByStore.values()];
}
