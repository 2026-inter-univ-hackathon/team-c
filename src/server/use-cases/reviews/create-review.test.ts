import { describe, expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import type { PublishedReviewForm } from "../../repositories";
import {
  createReviewUseCase,
  type CreateReviewDependencies,
} from "./create-review";
import { validateAgainstReviewForm } from "./schemas";
import { createReviewInputSchema } from "./schemas";

const db = {} as Db;
const storeId = "40000000-0000-4000-8000-000000000001";
const userId = "10000000-0000-4000-8000-000000000001";
const questionId = "70000000-0000-4000-8000-000000000001";
const dimensionId = "80000000-0000-4000-8000-000000000001";

const form: PublishedReviewForm = {
  id: "60000000-0000-4000-8000-000000000001",
  version: 1,
  questions: [
    {
      id: questionId,
      code: "first_trap",
      label: "働き始める前に知っておきたかったこと",
      displayOrder: 10,
      isRequired: true,
      minLength: 10,
      maxLength: 500,
    },
  ],
  dimensions: [
    {
      id: dimensionId,
      code: "overall",
      label: "総合",
      displayOrder: 10,
      isRequired: true,
    },
  ],
};

function createDependencies(): CreateReviewDependencies {
  return {
    getPublishedReviewForm: vi.fn().mockResolvedValue(form),
    createPublishedReview: vi.fn().mockResolvedValue("review-id"),
  };
}

function validInput() {
  return {
    storeId,
    userId,
    employmentStatus: "FORMER" as const,
    employmentStartYear: "2023",
    employmentEndYear: "2025",
    publicAuthorLabel: "学生アルバイト2年目",
    summary: "研修が丁寧でした。",
    answers: { [questionId]: "最初の3日は先輩がついてくれました。" },
    ratings: { [dimensionId]: 4 },
  };
}

describe("createReviewUseCase", () => {
  it("公開中のフォームのIDで書き込む", async () => {
    const dependencies = createDependencies();

    const result = await createReviewUseCase(db, validInput(), dependencies);

    expect(result).toEqual({ ok: true, reviewId: "review-id" });
    expect(dependencies.createPublishedReview).toHaveBeenCalledWith(
      db,
      expect.objectContaining({
        storeId,
        userId,
        reviewFormId: form.id,
        employmentStartYear: 2023,
        employmentEndYear: 2025,
        answers: [
          {
            reviewQuestionId: questionId,
            answerText: "最初の3日は先輩がついてくれました。",
          },
        ],
        ratings: [{ ratingDimensionId: dimensionId, score: 4 }],
      }),
    );
  });

  it("在籍中なら終了年を持たない", async () => {
    const dependencies = createDependencies();

    const result = await createReviewUseCase(
      db,
      {
        ...validInput(),
        employmentStatus: "CURRENT",
        employmentEndYear: "",
      },
      dependencies,
    );

    expect(result).toEqual({ ok: true, reviewId: "review-id" });
    expect(dependencies.createPublishedReview).toHaveBeenCalledWith(
      db,
      expect.objectContaining({ employmentEndYear: null }),
    );
  });

  it("必須の評価が欠けていたら書き込まない", async () => {
    const dependencies = createDependencies();

    const result = await createReviewUseCase(
      db,
      { ...validInput(), ratings: {} },
      dependencies,
    );

    expect(result).toEqual({
      ok: false,
      issues: [
        {
          path: `ratings.${dimensionId}`,
          message: "「総合」を評価してください",
        },
      ],
    });
    expect(dependencies.createPublishedReview).not.toHaveBeenCalled();
  });
});

describe("createReviewInputSchema", () => {
  it("在籍中に終了年があると弾く", () => {
    const result = createReviewInputSchema.safeParse({
      ...validInput(),
      employmentStatus: "CURRENT",
      employmentEndYear: "2025",
    });

    expect(result.success).toBe(false);
  });

  it("終了年が開始年より前だと弾く", () => {
    const result = createReviewInputSchema.safeParse({
      ...validInput(),
      employmentStartYear: "2025",
      employmentEndYear: "2023",
    });

    expect(result.success).toBe(false);
  });

  it("空白だけの総合コメントを弾く", () => {
    const result = createReviewInputSchema.safeParse({
      ...validInput(),
      summary: "   ",
    });

    expect(result.success).toBe(false);
  });
});

describe("validateAgainstReviewForm", () => {
  it("最低文字数を満たさない回答を指摘する", () => {
    const parsed = createReviewInputSchema.parse({
      ...validInput(),
      answers: { [questionId]: "短い" },
    });

    expect(validateAgainstReviewForm(form, parsed)).toEqual([
      {
        path: `answers.${questionId}`,
        message:
          "「働き始める前に知っておきたかったこと」は10文字以上で入力してください",
      },
    ]);
  });

  it("フォームにない設問のIDを弾く", () => {
    const unknownId = "70000000-0000-4000-8000-000000000099";
    const parsed = createReviewInputSchema.parse({
      ...validInput(),
      answers: {
        ...validInput().answers,
        [unknownId]: "フォーム外の回答",
      },
    });

    expect(validateAgainstReviewForm(form, parsed)).toEqual([
      { path: `answers.${unknownId}`, message: "このフォームにない設問です" },
    ]);
  });
});
