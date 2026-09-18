import type { Db } from "../../db/client";
import { reviewAnswers, reviewRatings, reviews } from "../../db/schema";
import { DuplicateReviewError, isUniqueViolation } from "../errors";
import type { CreateReviewRecord } from "./types";

/**
 * レビュー本体・回答・評価をまとめて1トランザクションで書き込み、公開する。
 * 認証が未実装のため下書き状態は扱わず、投稿された時点で PUBLISHED にする。
 */
export async function createPublishedReview(
  db: Db,
  input: CreateReviewRecord,
): Promise<string> {
  try {
    return await db.transaction(async (tx) => {
      const [review] = await tx
        .insert(reviews)
        .values({
          storeId: input.storeId,
          userId: input.userId,
          reviewFormId: input.reviewFormId,
          employmentStatus: input.employmentStatus,
          employmentStartYear: input.employmentStartYear,
          employmentEndYear: input.employmentEndYear,
          publicAuthorLabel: input.publicAuthorLabel,
          summary: input.summary,
          status: "PUBLISHED",
          publishedAt: new Date(),
        })
        .returning({ id: reviews.id });

      if (!review) {
        throw new Error("Failed to insert review");
      }

      if (input.answers.length > 0) {
        await tx.insert(reviewAnswers).values(
          input.answers.map((answer) => ({
            reviewId: review.id,
            reviewFormId: input.reviewFormId,
            reviewQuestionId: answer.reviewQuestionId,
            answerText: answer.answerText,
          })),
        );
      }

      if (input.ratings.length > 0) {
        await tx.insert(reviewRatings).values(
          input.ratings.map((rating) => ({
            reviewId: review.id,
            reviewFormId: input.reviewFormId,
            ratingDimensionId: rating.ratingDimensionId,
            score: rating.score,
          })),
        );
      }

      return review.id;
    });
  } catch (error) {
    if (isUniqueViolation(error, "reviews_active_author_store_unique")) {
      throw new DuplicateReviewError();
    }

    throw error;
  }
}
