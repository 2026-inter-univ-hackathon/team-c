/**
 * 口コミの本文・評価を公開するために必要な最低件数。
 * 件数が少ない職場では投稿者の属性から個人が特定されうるため、
 * この件数に達するまで口コミの内容と評価は非公開にする（件数のみ表示）。
 */
export const MIN_PUBLIC_REVIEW_COUNT = 5;

export function isReviewContentPublic(reviewCount: number) {
  return reviewCount >= MIN_PUBLIC_REVIEW_COUNT;
}

export function remainingReviewsForPublic(reviewCount: number) {
  return Math.max(0, MIN_PUBLIC_REVIEW_COUNT - reviewCount);
}
