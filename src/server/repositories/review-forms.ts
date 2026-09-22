import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  ratingDimensions,
  reviewForms,
  reviewFormRatingDimensions,
} from "../../db/schema";
import type { PublishedReviewForm } from "./types";

export async function getPublishedReviewForm(
  db: Db,
): Promise<PublishedReviewForm | null> {
  const [form] = await db
    .select({ id: reviewForms.id, version: reviewForms.version })
    .from(reviewForms)
    .where(eq(reviewForms.status, "PUBLISHED"))
    .limit(1);
  if (!form) return null;
  const dimensions = await db
    .select({
      id: ratingDimensions.id,
      code: ratingDimensions.code,
      label: ratingDimensions.label,
      displayOrder: reviewFormRatingDimensions.displayOrder,
      isRequired: reviewFormRatingDimensions.isRequired,
    })
    .from(reviewFormRatingDimensions)
    .innerJoin(
      ratingDimensions,
      eq(reviewFormRatingDimensions.ratingDimensionId, ratingDimensions.id),
    )
    .where(
      and(
        eq(reviewFormRatingDimensions.reviewFormId, form.id),
        eq(ratingDimensions.isActive, true),
      ),
    )
    .orderBy(asc(reviewFormRatingDimensions.displayOrder));
  return { ...form, dimensions };
}
