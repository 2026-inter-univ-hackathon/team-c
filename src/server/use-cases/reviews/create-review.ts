import type { Db } from "../../../db/client";
import {
  createPublishedReview,
  getPublishedReviewForm,
} from "../../repositories";
import type { CreateReviewRecord } from "../../repositories";
import type { PublishedReviewForm } from "../../repositories";
import {
  createReviewInputSchema,
  validateAgainstReviewForm,
  type CreateReviewInput,
  type ReviewFormValidationIssue,
} from "./schemas";

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
  input: CreateReviewInput,
  dependencies: CreateReviewDependencies = defaultDependencies,
): Promise<CreateReviewResult> {
  const parsed = createReviewInputSchema.parse(input);
  const form = await dependencies.getPublishedReviewForm(db);

  if (!form) {
    throw new Error("No published review form is available");
  }

  const issues = validateAgainstReviewForm(form, parsed);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const reviewId = await dependencies.createPublishedReview(db, {
    storeId: parsed.storeId,
    userId: parsed.userId,
    reviewFormId: form.id,
    employmentStatus: parsed.employmentStatus,
    employmentStartYear: parsed.employmentStartYear,
    employmentEndYear: parsed.employmentEndYear ?? null,
    publicAuthorLabel: parsed.publicAuthorLabel,
    summary: parsed.summary,
    answers: form.questions
      .filter((question) => (parsed.answers[question.id] ?? "").trim() !== "")
      .map((question) => ({
        reviewQuestionId: question.id,
        answerText: parsed.answers[question.id]!.trim(),
      })),
    ratings: form.dimensions
      .filter((dimension) => parsed.ratings[dimension.id] !== undefined)
      .map((dimension) => ({
        ratingDimensionId: dimension.id,
        score: parsed.ratings[dimension.id]!,
      })),
  });

  return { ok: true, reviewId };
}
