import {
  authorBadge,
  labels,
  ratingCodes,
  reviewScore,
  type CreateReviewInput,
} from "../../schemas/review-flow";
import {
  coarseLabels,
  type PublicAuthorAttributes,
} from "../../lib/review-visibility";
import type { ReviewReactionType } from "../../schemas/review-reactions";
import type { PublicReviewReaction } from "../../server/repositories";

type CardReview = Pick<
  CreateReviewInput,
  | "atmosphereTags"
  | "staffTags"
  | "managerPresence"
  | "recommendation"
  | "ratings"
  | "summary"
> & {
  id?: string;
  author: PublicAuthorAttributes;
  publishedAt?: string;
  reactions?: PublicReviewReaction[];
};

function AuthorLine({ author }: { author: PublicAuthorAttributes }) {
  if (author.detail === "COARSE")
    return (
      <div>
        <strong>
          {coarseLabels.employmentStatus[author.employmentStatus]} /{" "}
          {coarseLabels.occupation[author.occupation]}
        </strong>
        <p>属性は大まかに表示しています</p>
      </div>
    );
  return (
    <div>
      <strong>{authorBadge(author)}</strong>
      <p>
        {labels.employmentStatus[author.employmentStatus]}（投稿時点） /
        勤務期間 {labels.workDuration[author.workDuration]}
      </p>
    </div>
  );
}

export function ReviewCard({
  review,
  preview = false,
  onReactionToggle,
  pendingReactionKey,
}: {
  review: CardReview;
  preview?: boolean;
  onReactionToggle?: (
    reviewId: string,
    reactionType: ReviewReactionType,
    reacted: boolean,
  ) => void | Promise<void>;
  pendingReactionKey?: string | null;
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
        <AuthorLine author={review.author} />
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
      {review.id && review.reactions?.length ? (
        <div className="review-reactions" aria-label="口コミへのリアクション">
          {review.reactions.map((reaction) => {
            const key = `${review.id}:${reaction.type}`;
            return (
              <button
                key={reaction.type}
                type="button"
                aria-pressed={reaction.reacted}
                disabled={!onReactionToggle || pendingReactionKey === key}
                onClick={() =>
                  void onReactionToggle?.(
                    review.id!,
                    reaction.type,
                    !reaction.reacted,
                  )
                }
              >
                <span>{reaction.label}</span>
                <b aria-label={`${reaction.label} ${reaction.count}件`}>
                  {reaction.count}
                </b>
              </button>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}
