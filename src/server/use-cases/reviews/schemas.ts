export {
  createReviewInputSchema,
  reviewScore,
  type CreateReviewInput,
} from "../../../schemas/review-flow";

export type ReviewFormValidationIssue = {
  path: string;
  message: string;
};
