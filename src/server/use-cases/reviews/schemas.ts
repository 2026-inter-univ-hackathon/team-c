import { z } from "zod";
import type { PublishedReviewForm } from "../../repositories";

/** DBの reviews_employment_year_range_check と揃える下限。 */
const MIN_EMPLOYMENT_YEAR = 1970;
const SUMMARY_MAX_LENGTH = 500;
const PUBLIC_AUTHOR_LABEL_MAX_LENGTH = 100;

const trimmedString = z.string().transform((value) => value.trim());

export const createReviewInputSchema = z
  .object({
    storeId: z.uuid(),
    userId: z.uuid(),
    employmentStatus: z.enum(["CURRENT", "FORMER"]),
    employmentStartYear: z.coerce
      .number()
      .int()
      .min(MIN_EMPLOYMENT_YEAR)
      .max(new Date().getFullYear()),
    employmentEndYear: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      z.coerce
        .number()
        .int()
        .min(MIN_EMPLOYMENT_YEAR)
        .max(new Date().getFullYear())
        .optional(),
    ),
    publicAuthorLabel: trimmedString.pipe(
      z.string().min(1).max(PUBLIC_AUTHOR_LABEL_MAX_LENGTH),
    ),
    summary: trimmedString.pipe(z.string().min(1).max(SUMMARY_MAX_LENGTH)),
    answers: z.record(z.uuid(), z.string()),
    ratings: z.record(z.uuid(), z.coerce.number().int().min(1).max(5)),
  })
  .strip()
  // 在籍中なら終了年を持たない（reviews_current_end_year_check と同じ条件）。
  .refine(
    (value) =>
      value.employmentStatus !== "CURRENT" ||
      value.employmentEndYear === undefined,
    {
      message: "在籍中の場合は終了年を指定できません",
      path: ["employmentEndYear"],
    },
  )
  .refine(
    (value) =>
      value.employmentEndYear === undefined ||
      value.employmentStartYear <= value.employmentEndYear,
    {
      message: "終了年は開始年以降にしてください",
      path: ["employmentEndYear"],
    },
  );

export type CreateReviewInput = z.input<typeof createReviewInputSchema>;
export type ParsedCreateReviewInput = z.output<typeof createReviewInputSchema>;

export type ReviewFormValidationIssue = {
  path: string;
  message: string;
};

/**
 * 公開中のフォーム定義に対して、回答と評価が揃っているかを検証する。
 * 設問・評価軸はDBで可変なので、Zodスキーマではなくフォーム定義側で突き合わせる。
 */
export function validateAgainstReviewForm(
  form: PublishedReviewForm,
  input: ParsedCreateReviewInput,
): ReviewFormValidationIssue[] {
  const issues: ReviewFormValidationIssue[] = [];

  for (const question of form.questions) {
    const answer = (input.answers[question.id] ?? "").trim();

    if (answer.length === 0) {
      if (question.isRequired) {
        issues.push({
          path: `answers.${question.id}`,
          message: `「${question.label}」に回答してください`,
        });
      }

      continue;
    }

    if (question.minLength !== null && answer.length < question.minLength) {
      issues.push({
        path: `answers.${question.id}`,
        message: `「${question.label}」は${question.minLength}文字以上で入力してください`,
      });
    }

    if (question.maxLength !== null && answer.length > question.maxLength) {
      issues.push({
        path: `answers.${question.id}`,
        message: `「${question.label}」は${question.maxLength}文字以内で入力してください`,
      });
    }
  }

  for (const dimension of form.dimensions) {
    const score = input.ratings[dimension.id];

    if (score === undefined && dimension.isRequired) {
      issues.push({
        path: `ratings.${dimension.id}`,
        message: `「${dimension.label}」を評価してください`,
      });
    }
  }

  const knownQuestionIds = new Set(form.questions.map((item) => item.id));
  const knownDimensionIds = new Set(form.dimensions.map((item) => item.id));

  // フォームに属さないIDが混ざっていたら、DBの複合外部キーで落ちる前に弾く。
  for (const questionId of Object.keys(input.answers)) {
    if (!knownQuestionIds.has(questionId)) {
      issues.push({
        path: `answers.${questionId}`,
        message: "このフォームにない設問です",
      });
    }
  }

  for (const dimensionId of Object.keys(input.ratings)) {
    if (!knownDimensionIds.has(dimensionId)) {
      issues.push({
        path: `ratings.${dimensionId}`,
        message: "このフォームにない評価軸です",
      });
    }
  }

  return issues;
}
