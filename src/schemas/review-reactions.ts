import { z } from "zod";

export const reviewReactionTypes = ["HELPFUL", "THANKS", "USEFUL"] as const;

export const reviewReactionTypeSchema = z.enum(reviewReactionTypes);

export type ReviewReactionType = z.infer<typeof reviewReactionTypeSchema>;

export const reviewReactionLabels: Record<ReviewReactionType, string> = {
  HELPFUL: "参考になった",
  THANKS: "ありがとう",
  USEFUL: "役に立った",
};
