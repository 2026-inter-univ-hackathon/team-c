import { useState } from "react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { getStoreDetail, reactToReview } from "../server/store-functions";
import { defaultSearch } from "../schemas/store-search";
import {
  categoryImage,
  EmptyState,
  ErrorState,
  FavoriteButton,
  LoadingState,
  Rating,
} from "../features/stores/store-ui";
import { ButtonLink } from "../components/button";
import { ReviewCard } from "../features/stores/review-card";
import { ratingCodes, type CreateReviewInput } from "../schemas/review-flow";
import type { ReviewReactionType } from "../schemas/review-reactions";
import { Icon } from "../components/icon";
import { Pagination } from "../components/pagination";
import { coarseAttributesNotice } from "../lib/review-visibility";
export const Route = createFileRoute("/stores/$storeId/")({
  validateSearch: (raw: Record<string, unknown>) => ({
    page: z.coerce.number().int().min(1).max(10000).catch(1).parse(raw.page),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ params, deps }) =>
    z.uuid().safeParse(params.storeId).success
      ? getStoreDetail({ data: { ...params, ...deps } })
      : { store: null, reviews: [], page: 1, pageCount: 1 },
  component: DetailPage,
  pendingComponent: LoadingState,
  errorComponent: ErrorState,
});
function DetailPage() {
  const { store, reviews, page, pageCount } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  const router = useRouter();
  const [pendingReactionKey, setPendingReactionKey] = useState<string | null>(
    null,
  );
  async function handleReactionToggle(
    reviewId: string,
    reactionType: ReviewReactionType,
    reacted: boolean,
  ) {
    const key = `${reviewId}:${reactionType}`;
    setPendingReactionKey(key);
    try {
      const result = await reactToReview({
        data: { reviewId, reactionType, reacted },
      });
      if (!result.ok) {
        window.alert(result.message);
        return;
      }
      await router.invalidate();
    } finally {
      setPendingReactionKey(null);
    }
  }
  if (!store)
    return (
      <main id="main" className="container page-section">
        <EmptyState title="職場が見つかりませんでした">
          <p>この職場は非公開、または削除された可能性があります。</p>
          <ButtonLink to="/stores" search={defaultSearch}>
            職場を探す
          </ButtonLink>
        </EmptyState>
      </main>
    );
  return (
    <main id="main" className="container detail-page">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / </span>
        <Link to="/stores" search={defaultSearch}>
          バイト先を探す
        </Link>
        <span> / {store.name}</span>
      </div>
      <header className="detail-header">
        <div className="detail-title">
          <div className="tags">
            {store.categories.map((category) => (
              <span key={category.code}>{category.name}</span>
            ))}
          </div>
          <h1>{store.name}</h1>
          <p className="location">
            <Icon name="pin" size={16} />
            {[store.prefecture, store.city, store.address]
              .filter(Boolean)
              .join(" ") || "住所の登録はありません"}
          </p>
          <Rating value={store.averageRating} count={store.reviewCount} />
        </div>
        <FavoriteButton id={store.id} name={store.name} />
      </header>
      <nav className="detail-tabs" aria-label="店舗内ナビゲーション">
        <a href="#overview">評価・職場情報</a>
        <a href="#reviews">
          口コミ <span>{store.reviewCount}</span>
        </a>
      </nav>
      <div className="detail-layout">
        <aside>
          <div className="detail-photo">
            <img
              src={categoryImage(store.categories[0]?.code)}
              alt="業種のイメージ"
            />
            <span>業種イメージ（実際の店舗写真ではありません）</span>
          </div>
          <div className="workplace-info">
            <p className="eyebrow">WORKPLACE INFO</p>
            <h2>職場の基本情報</h2>
            <dl>
              <dt>店舗名</dt>
              <dd>{store.name}</dd>
              <dt>住所</dt>
              <dd>
                {[store.prefecture, store.city, store.address]
                  .filter(Boolean)
                  .join(" ") || "未登録"}
              </dd>
              <dt>業種</dt>
              <dd>
                {store.categories.map((c) => c.name).join("・") || "未登録"}
              </dd>
            </dl>
          </div>
          <div className="reading-note">
            <Icon name="chat" size={24} />
            <h3>いろいろな声を、あなたの判断に。</h3>
            <p>
              働いた時期や立場によって、感じ方はさまざま。評価とあわせて、口コミの背景にも目を向けてみましょう。
            </p>
          </div>
        </aside>
        <div>
          <section id="overview" className="rating-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">WORKPLACE SCORE</p>
                <h2>働きやすさを、見てみよう。</h2>
              </div>
              <span className="small-muted">{store.reviewCount}件の口コミ</span>
            </div>
            <div className="score-grid">
              <div className="overall-score">
                <span>平均評価</span>
                <strong>{store.averageRating?.toFixed(2) ?? "—"}</strong>
                <span className="stars" aria-hidden="true">
                  {store.averageRating === null
                    ? "☆☆☆☆☆"
                    : "★".repeat(Math.round(store.averageRating)) +
                      "☆".repeat(5 - Math.round(store.averageRating))}
                </span>
                <small>5点満点</small>
              </div>
              <div className="dimension-list">
                {store.ratingSummary.map((rating) => (
                  <div key={rating.dimensionCode}>
                    <span>{rating.dimensionLabel}</span>
                    <meter
                      min={0}
                      max={5}
                      value={rating.averageScore ?? 0}
                      aria-label={rating.dimensionLabel}
                    />
                    <strong>{rating.averageScore?.toFixed(1) ?? "—"}</strong>
                  </div>
                ))}
              </div>
            </div>
            <p className="data-note">
              公開口コミを勤続期間と在籍状況で重み付けして集計しています。口コミがない項目は「—」で表示します。
            </p>
          </section>
          <section id="reviews" className="reviews-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">REAL VOICES</p>
                <h2>働いた人のホンネ</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="small-muted">新しい口コミから表示</span>
                <ButtonLink
                  to="/stores/$storeId/reviews/new"
                  params={{ storeId: store.id }}
                >
                  レビューを書く
                </ButtonLink>
              </div>
            </div>
            {!store.detailedAttributes && store.reviewCount > 0 && (
              <p className="data-note attribute-notice">
                <Icon name="shield" size={14} />
                {coarseAttributesNotice(store.reviewCount)}
              </p>
            )}
            {reviews.length ? (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={{
                    id: review.id,
                    author: review.author,
                    atmosphereTags: review.atmosphereTags,
                    staffTags: review.staffTags,
                    managerPresence: review.managerPresence,
                    recommendation: review.recommendation,
                    summary: review.summary,
                    publishedAt: review.publishedAt,
                    reactions: review.reactions,
                    ratings: Object.fromEntries(
                      ratingCodes.map((code) => [
                        code,
                        review.ratings.find(
                          (rating) => rating.dimensionCode === code,
                        )?.score ?? 0,
                      ]),
                    ) as CreateReviewInput["ratings"],
                  }}
                  onReactionToggle={handleReactionToggle}
                  pendingReactionKey={pendingReactionKey}
                />
              ))
            ) : (
              <EmptyState title="口コミはまだありません">
                <p>この職場の経験が集まるまで、ほかの職場も見てみましょう。</p>
                <Link to="/stores" search={defaultSearch} className="text-link">
                  職場一覧へ
                  <Icon name="arrow" />
                </Link>
              </EmptyState>
            )}
            {pageCount > 1 && (
              <Pagination
                label="口コミのページ"
                page={page}
                pageCount={pageCount}
                onPageChange={(next) =>
                  void navigate({ search: { page: next }, hash: "reviews" })
                }
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
