import { and, eq, isNotNull, isNull } from "drizzle-orm";
import type { Db } from "../../db/client";
import { reviewReactions, reviews, stores } from "../../db/schema";
import type { ReviewReactionType } from "../../schemas/review-reactions";

export type SetReviewReactionRecord = {
  reviewId: string;
  userId: string;
  reactionType: ReviewReactionType;
  reacted: boolean;
};

const visiblePublishedReview = (reviewId: string) =>
  and(
    eq(reviews.id, reviewId),
    eq(reviews.status, "PUBLISHED"),
    isNull(reviews.deletedAt),
    isNull(reviews.hiddenAt),
    isNotNull(reviews.publishedAt),
    eq(stores.status, "ACTIVE"),
    isNull(stores.deletedAt),
  );

export async function setReviewReaction(
  db: Db,
  input: SetReviewReactionRecord,
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [review] = await tx
      .select({ id: reviews.id })
      .from(reviews)
      .innerJoin(stores, eq(stores.id, reviews.storeId))
      .where(visiblePublishedReview(input.reviewId))
      .limit(1);
    if (!review) return false;
    if (input.reacted) {
      await tx
        .insert(reviewReactions)
        .values({
          reviewId: input.reviewId,
          userId: input.userId,
          reactionType: input.reactionType,
        })
        .onConflictDoNothing();
    } else {
      await tx
        .delete(reviewReactions)
        .where(
          and(
            eq(reviewReactions.reviewId, input.reviewId),
            eq(reviewReactions.userId, input.userId),
            eq(reviewReactions.reactionType, input.reactionType),
          ),
        );
    }
    return true;
  });
}
