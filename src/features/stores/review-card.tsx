import {
  authorBadge,
  labels,
  ratingCodes,
  reviewScore,
  type CreateReviewInput,
} from "../../schemas/review-flow";

type CardReview = Pick<
  CreateReviewInput,
  | "employmentStatus"
  | "occupation"
  | "workDuration"
  | "atmosphereTags"
  | "staffTags"
  | "managerPresence"
  | "recommendation"
  | "ratings"
  | "summary"
> & { publishedAt?: string };

export function ReviewCard({
  review,
  preview = false,
}: {
  review: CardReview;
  preview?: boolean;
}) {
  return (
    <article
      className="review-card"
      aria-label={preview ? "公開プレビュー" : "口コミ"}
    >
      <div className="review-author">
        <span className="author-icon" aria-hidden="true">
          ✦
        </span>
        <div>
          <strong>{authorBadge(review)}</strong>
          <p>
            {labels.employmentStatus[review.employmentStatus]}（投稿時点） /
            勤務期間 {labels.workDuration[review.workDuration]}
          </p>
        </div>
        <span className="small-muted">
          {review.publishedAt ?? "投稿日は投稿後に表示"}
        </span>
      </div>
      <p className="review-summary">{review.summary}</p>
      <div className="review-ratings">
        <span>
          総合 <b>★ {reviewScore(review.ratings).toFixed(1)}</b>
        </span>
        {ratingCodes.map((code) => (
          <span key={code}>
            {labels.rating[code]} <b>{review.ratings[code]} / 5</b>
          </span>
        ))}
      </div>
      <div className="tags" aria-label="職場の特徴">
        {review.atmosphereTags.map((tag) => (
          <span key={tag}>{labels.atmosphere[tag]}</span>
        ))}
        {review.staffTags.map((tag) => (
          <span key={tag}>{labels.staff[tag]}</span>
        ))}
      </div>
      <p className="small-muted">
        店長の関与: {labels.manager[review.managerPresence]} / おすすめ度:{" "}
        {labels.recommendation[review.recommendation]}
      </p>
    </article>
  );
}
