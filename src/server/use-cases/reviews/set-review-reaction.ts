import { z } from "zod";
import type { Db } from "../../../db/client";
import { reviewReactionTypeSchema } from "../../../schemas/review-reactions";
import {
  assertDevReviewPostingEnabled,
  DEV_REVIEW_USER_ID,
} from "../../dev-review-access";
import { setReviewReaction } from "../../repositories";

export const setReviewReactionInputSchema = z.strictObject({
  reviewId: z.uuid(),
  reactionType: reviewReactionTypeSchema,
  reacted: z.boolean(),
});

export type SetReviewReactionInput = z.input<
  typeof setReviewReactionInputSchema
>;

export type SetReviewReactionDependencies = {
  setReviewReaction: typeof setReviewReaction;
};

const defaultDependencies: SetReviewReactionDependencies = {
  setReviewReaction,
};

export async function setReviewReactionUseCase(
  db: Db,
  input: SetReviewReactionInput,
  dependencies: SetReviewReactionDependencies = defaultDependencies,
  env: NodeJS.ProcessEnv = process.env,
) {
  assertDevReviewPostingEnabled(env);
  const values = setReviewReactionInputSchema.parse(input);
  const found = await dependencies.setReviewReaction(db, {
    reviewId: values.reviewId,
    userId: DEV_REVIEW_USER_ID,
    reactionType: values.reactionType,
    reacted: values.reacted,
  });
  return found
    ? { ok: true as const, reacted: values.reacted }
    : { ok: false as const, message: "口コミが見つかりませんでした" };
}
