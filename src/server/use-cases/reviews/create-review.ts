import type { Db } from "../../../db/client";
import {
  createReviewInputSchema,
  GUIDELINE_VERSION,
  ratingCodes,
  type CreateReviewInput,
} from "../../../schemas/review-flow";
import {
  assertDevReviewPostingEnabled,
  DEV_REVIEW_USER_ID,
} from "../../dev-review-access";
import {
  createPublishedReview,
  getPublishedReviewForm,
} from "../../repositories";
import type {
  CreateReviewRecord,
  PublishedReviewForm,
} from "../../repositories";
import type { ReviewFormValidationIssue } from "./schemas";

export type CreateReviewDependencies = {
  getPublishedReviewForm: (db: Db) => Promise<PublishedReviewForm | null>;
  createPublishedReview: (db: Db, input: CreateReviewRecord) => Promise<string>;
};
const defaultDependencies: CreateReviewDependencies = {
  getPublishedReviewForm,
  createPublishedReview,
};
export type CreateReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; issues: ReviewFormValidationIssue[] };

export async function createReviewUseCase(
  db: Db,
  input: unknown,
  dependencies: CreateReviewDependencies = defaultDependencies,
  env: NodeJS.ProcessEnv = process.env,
): Promise<CreateReviewResult> {
  assertDevReviewPostingEnabled(env);
  const parsed = createReviewInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    };
  }
  const form = await dependencies.getPublishedReviewForm(db);
  if (!form || form.version !== 2)
    throw new Error("The current review form is unavailable");
  const ids = new Map(
    form.dimensions.map((dimension) => [dimension.code, dimension.id]),
  );
  if (ratingCodes.some((code) => !ids.has(code)))
    throw new Error("The review form is incomplete");
  const values: CreateReviewInput = parsed.data;
  const reviewId = await dependencies.createPublishedReview(db, {
    storeId: values.storeId,
    userId: DEV_REVIEW_USER_ID,
    reviewFormId: form.id,
    employmentStatus: values.employmentStatus,
    occupation: values.occupation,
    workDuration: values.workDuration,
    atmosphereTags: values.atmosphereTags,
    staffTags: values.staffTags,
    managerPresence: values.managerPresence,
    recommendation: values.recommendation,
    summary: values.summary,
    guidelineVersion: GUIDELINE_VERSION,
    ratings: ratingCodes.map((code) => ({
      ratingDimensionId: ids.get(code)!,
      score: values.ratings[code],
    })),
  });
  return { ok: true, reviewId };
}
