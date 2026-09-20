import type { Db } from "../../db/client";
import { reviewRatings, reviews } from "../../db/schema";
import { DuplicateReviewError, isUniqueViolation } from "../errors";
import type { CreateReviewRecord } from "./types";

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
          occupation: input.occupation,
          workDuration: input.workDuration,
          atmosphereTags: input.atmosphereTags,
          staffTags: input.staffTags,
          managerPresence: input.managerPresence,
          recommendation: input.recommendation,
          summary: input.summary,
          guidelineVersion: input.guidelineVersion,
          guidelineAgreedAt: new Date(),
          status: "PUBLISHED",
          publishedAt: new Date(),
        })
        .returning({ id: reviews.id });
      if (!review) throw new Error("Failed to create review");
      await tx.insert(reviewRatings).values(
        input.ratings.map((rating) => ({
          reviewId: review.id,
          reviewFormId: input.reviewFormId,
          ratingDimensionId: rating.ratingDimensionId,
          score: rating.score,
        })),
      );
      return review.id;
    });
  } catch (error) {
    if (isUniqueViolation(error, "reviews_active_author_store_unique"))
      throw new DuplicateReviewError();
    throw error;
  }
}
