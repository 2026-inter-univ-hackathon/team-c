import { and, asc, eq } from "drizzle-orm";
import type { Db } from "../../db/client";
import {
  ratingDimensions,
  reviewForms,
  reviewFormRatingDimensions,
  reviewQuestions,
  users,
} from "../../db/schema";
import type { PublishedReviewForm, TestUser } from "./types";

export async function getPublishedReviewForm(
  db: Db,
): Promise<PublishedReviewForm | null> {
  const [form] = await db
    .select({ id: reviewForms.id, version: reviewForms.version })
    .from(reviewForms)
    .where(eq(reviewForms.status, "PUBLISHED"))
    .limit(1);

  if (!form) {
    return null;
  }

  const [questions, dimensions] = await Promise.all([
    db
      .select({
        id: reviewQuestions.id,
        code: reviewQuestions.code,
        label: reviewQuestions.label,
        displayOrder: reviewQuestions.displayOrder,
        isRequired: reviewQuestions.isRequired,
        minLength: reviewQuestions.minLength,
        maxLength: reviewQuestions.maxLength,
      })
      .from(reviewQuestions)
      .where(eq(reviewQuestions.reviewFormId, form.id))
      .orderBy(asc(reviewQuestions.displayOrder), asc(reviewQuestions.id)),
    db
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
      .orderBy(
        asc(reviewFormRatingDimensions.displayOrder),
        asc(ratingDimensions.id),
      ),
  ]);

  return { ...form, questions, dimensions };
}

/**
 * 認証が未実装の間、投稿者として選べる開発用ユーザーを返す。
 * Session実装後は、ログイン中のユーザーに置き換える。
 */
export async function listTestUsers(db: Db): Promise<TestUser[]> {
  return db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(eq(users.status, "ACTIVE"))
    .orderBy(asc(users.displayName), asc(users.id));
}
