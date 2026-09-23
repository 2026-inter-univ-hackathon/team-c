import { eq, notInArray } from "drizzle-orm";
import type { Db } from "../db/client";
import { reviewEmbeddings } from "../db/schema";
import { embedTexts } from "./openai-embeddings";
import {
  isCurrentEmbedding,
  loadSemanticDocuments,
} from "./repositories/review-embeddings";
import { EMBEDDING_MODEL, MAX_INDEX_BATCH } from "./semantic-vectors";

export async function indexReviewEmbeddings(db: Db, reviewId?: string) {
  const documents = await loadSemanticDocuments(db, reviewId);
  const pending = documents.filter((document) => !isCurrentEmbedding(document));
  let indexed = 0;

  for (let offset = 0; offset < pending.length; offset += MAX_INDEX_BATCH) {
    const batch = pending.slice(offset, offset + MAX_INDEX_BATCH);
    const vectors = await embedTexts(batch.map((document) => document.text));
    for (let index = 0; index < batch.length; index++) {
      const document = batch[index];
      const [current] = await loadSemanticDocuments(db, document.reviewId);
      if (!current || current.sourceHash !== document.sourceHash) continue;
      await db
        .insert(reviewEmbeddings)
        .values({
          reviewId: document.reviewId,
          sourceHash: document.sourceHash,
          model: EMBEDDING_MODEL,
          embedding: vectors[index],
        })
        .onConflictDoUpdate({
          target: reviewEmbeddings.reviewId,
          set: {
            sourceHash: document.sourceHash,
            model: EMBEDDING_MODEL,
            embedding: vectors[index],
            indexedAt: new Date(),
          },
        });
      indexed++;
    }
  }

  if (!reviewId) {
    const publicIds = documents.map((document) => document.reviewId);
    if (publicIds.length) {
      await db
        .delete(reviewEmbeddings)
        .where(notInArray(reviewEmbeddings.reviewId, publicIds));
    } else {
      await db.delete(reviewEmbeddings);
    }
  } else if (!documents.length) {
    await db
      .delete(reviewEmbeddings)
      .where(eq(reviewEmbeddings.reviewId, reviewId));
  }

  return {
    publicReviews: documents.length,
    indexed,
    unchanged: documents.length - pending.length,
  };
}
