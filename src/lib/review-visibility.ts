import type { CreateReviewInput } from "../schemas/review-flow";

/**
 * 投稿者の属性を詳細に表示するために必要な口コミ件数。
 *
 * 口コミが少ない職場では「高校生・勤続3ヶ月未満・退職1年未満」のような
 * 属性の組み合わせから投稿者が推測されうる。本文と評価は初日から公開しつつ、
 * この件数に達するまでは属性を大まかな区分に一般化して返す。
 */
export const MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES = 5;

export function hasDetailedAttributes(reviewCount: number) {
  return reviewCount >= MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES;
}

export function remainingForDetailedAttributes(reviewCount: number) {
  return Math.max(0, MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES - reviewCount);
}

export type CoarseOccupation = "STUDENT" | "WORKER";
export type CoarseEmploymentStatus = "CURRENT" | "LEFT";

export const coarseLabels = {
  occupation: {
    STUDENT: "学生",
    WORKER: "社会人",
  },
  employmentStatus: {
    CURRENT: "現役スタッフ",
    LEFT: "退職したスタッフ",
  },
} as const satisfies {
  occupation: Record<CoarseOccupation, string>;
  employmentStatus: Record<CoarseEmploymentStatus, string>;
};

type AuthorInput = Pick<
  CreateReviewInput,
  "employmentStatus" | "occupation" | "workDuration"
>;

/** 公開口コミに付ける投稿者属性。件数に応じて詳細か大まかかが決まる。 */
export type PublicAuthorAttributes =
  | ({ detail: "DETAILED" } & AuthorInput)
  | {
      detail: "COARSE";
      employmentStatus: CoarseEmploymentStatus;
      occupation: CoarseOccupation;
      workDuration: null;
    };

export function detailedAuthorAttributes(
  review: AuthorInput,
): PublicAuthorAttributes {
  return {
    detail: "DETAILED",
    employmentStatus: review.employmentStatus,
    occupation: review.occupation,
    workDuration: review.workDuration,
  };
}

/** 属性を「学生/社会人」「現役/退職」の2区分に一般化し、勤務期間は伏せる。 */
export function coarseAuthorAttributes(
  review: AuthorInput,
): PublicAuthorAttributes {
  return {
    detail: "COARSE",
    employmentStatus:
      review.employmentStatus === "CURRENT" ? "CURRENT" : "LEFT",
    occupation:
      review.occupation === "HIGH_SCHOOL" || review.occupation === "COLLEGE"
        ? "STUDENT"
        : "WORKER",
    workDuration: null,
  };
}

export function publicAuthorAttributes(
  review: AuthorInput,
  reviewCount: number,
): PublicAuthorAttributes {
  return hasDetailedAttributes(reviewCount)
    ? detailedAuthorAttributes(review)
    : coarseAuthorAttributes(review);
}

/** 口コミ一覧に添える、属性が大まかな表示になっている理由の案内文。 */
export function coarseAttributesNotice(reviewCount: number) {
  return `投稿者を守るため、口コミが${MIN_REVIEWS_FOR_DETAILED_ATTRIBUTES}件集まるまで属性は大まかに表示しています（あと${remainingForDetailedAttributes(reviewCount)}件）。`;
}
