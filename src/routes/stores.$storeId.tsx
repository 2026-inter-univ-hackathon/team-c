import { Link, createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getStoreDetail } from "../server/store-functions";
import { defaultSearch } from "../schemas/store-search";
import {
  categoryImage,
  EmptyState,
  ErrorState,
  FavoriteButton,
  LoadingState,
  Rating,
} from "../features/stores/store-ui";
import { Icon } from "../components/icon";
export const Route = createFileRoute("/stores/$storeId")({
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
  if (!store)
    return (
      <main id="main" className="container page-section">
        <EmptyState title="職場が見つかりませんでした">
          <p>この職場は非公開、または削除された可能性があります。</p>
          <Link className="button primary" to="/stores" search={defaultSearch}>
            職場を探す
          </Link>
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
              公開口コミの評価点を単純平均しています。口コミがない項目は「—」で表示します。
            </p>
          </section>
          <section id="reviews" className="reviews-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">REAL VOICES</p>
                <h2>働いた人のホンネ</h2>
              </div>
              <span className="small-muted">新しい口コミから表示</span>
            </div>
            {reviews.length ? (
              reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <div className="review-author">
                    <span className="author-icon">
                      <Icon name="chat" size={22} />
                    </span>
                    <div>
                      <strong>{review.publicAuthorLabel}</strong>
                      <p>
                        {review.employmentStatus === "CURRENT"
                          ? "在職中"
                          : "退職済み"}
                        <span> / </span>
                        {review.employmentStartYear}年〜
                        {review.employmentEndYear
                          ? review.employmentEndYear + "年"
                          : review.employmentStatus === "CURRENT"
                            ? "現在"
                            : "終了年未登録"}
                      </p>
                    </div>
                    <time dateTime={review.publishedAt}>
                      {new Intl.DateTimeFormat("ja-JP", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        timeZone: "Asia/Tokyo",
                      }).format(new Date(review.publishedAt))}
                    </time>
                  </div>
                  <p className="review-summary">{review.summary}</p>
                  <div className="review-ratings">
                    {review.ratings.map((rating) => (
                      <span key={rating.dimensionCode}>
                        {rating.dimensionLabel}
                        <b>★ {rating.score.toFixed(1)}</b>
                      </span>
                    ))}
                  </div>
                  {review.answers.length > 0 && (
                    <details className="review-answers">
                      <summary>
                        この人の詳しい体験を読む <span>＋</span>
                      </summary>
                      <dl>
                        {review.answers.map((answer) => (
                          <div key={answer.questionCode}>
                            <dt>{answer.questionLabel}</dt>
                            <dd>{answer.answerText}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </article>
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
              <nav className="pagination" aria-label="口コミのページ">
                <button
                  disabled={page <= 1}
                  onClick={() =>
                    void navigate({
                      search: { page: page - 1 },
                      hash: "reviews",
                    })
                  }
                >
                  前へ
                </button>
                <span>
                  {page} / {pageCount}
                </span>
                <button
                  disabled={page >= pageCount}
                  onClick={() =>
                    void navigate({
                      search: { page: page + 1 },
                      hash: "reviews",
                    })
                  }
                >
                  次へ
                </button>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
