import { Link } from "@tanstack/react-router";
import { Button } from "../../components/button";
import { Icon } from "../../components/icon";
import { useFavorites } from "./favorites";
import cafe from "../../../img/cafe.jpg";
import convenience from "../../../img/conv.jpg";
import education from "../../../img/juku.jpg";
import other from "../../../img/wh.jpg";

export type StoreCardData = {
  id: string;
  name: string;
  prefecture: string | null;
  city: string | null;
  categories: { code: string; name: string }[];
  averageRating: number | null;
  reviewCount: number;
  reviewExcerpt: string | null;
  matchedReviewText: string | null;
  semanticScore: number | null;
};
export function categoryImage(code?: string) {
  return code === "cafe"
    ? cafe
    : code === "convenience"
      ? convenience
      : code === "education"
        ? education
        : other;
}
export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const { ids, toggle } = useFavorites();
  const saved = ids.includes(id);
  return (
    <div className="favorite-wrap">
      <button
        type="button"
        className={`favorite-button ${saved ? "saved" : ""}`}
        aria-pressed={saved}
        aria-label={`${name}を${saved ? "保存から解除" : "気になるに保存"}`}
        onClick={() => toggle(id)}
      >
        <Icon name="heart" size={18} />
        <span>{saved ? "保存済み" : "気になる"}</span>
      </button>
    </div>
  );
}
export function Rating({
  value,
  count,
}: {
  value: number | null;
  count?: number;
}) {
  return (
    <div className="rating">
      <span className="stars" aria-hidden="true">
        ★
      </span>
      <strong>{value === null ? "—" : value.toFixed(2)}</strong>
      <span className="rating-label">
        {value === null ? "評価はまだありません" : "/ 5.00"}
      </span>
      {count !== undefined && (
        <span className="review-count">
          口コミ <b>{count}</b>件
        </span>
      )}
    </div>
  );
}
export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <article className="store-card">
      <div className="store-photo">
        <img
          src={categoryImage(store.categories[0]?.code)}
          alt=""
          loading="lazy"
        />
        <span>業種イメージ</span>
      </div>
      <div className="store-card-body">
        <div className="card-top">
          <div>
            <div className="tags">
              {store.categories.map((c) => (
                <span key={c.code}>{c.name}</span>
              ))}
            </div>
            <h2>
              <Link
                to="/stores/$storeId"
                params={{ storeId: store.id }}
                search={{ page: 1 }}
              >
                {store.name}
              </Link>
            </h2>
          </div>
          <FavoriteButton id={store.id} name={store.name} />
        </div>
        <p className="location">
          <Icon name="pin" size={14} />
          {[store.prefecture, store.city].filter(Boolean).join(" ") ||
            "所在地の登録はありません"}
        </p>
        <Rating value={store.averageRating} count={store.reviewCount} />
        {store.matchedReviewText && (
          <details className="semantic-match">
            <summary>希望に近い口コミを読む</summary>
            <p>{store.matchedReviewText}</p>
          </details>
        )}
        <div className="review-excerpt">
          <Icon name="chat" size={17} />
          <p>
            {store.reviewExcerpt ??
              "この職場の口コミは、まだ投稿されていません。"}
          </p>
        </div>
        <Link
          className="text-link card-link"
          to="/stores/$storeId"
          params={{ storeId: store.id }}
          search={{ page: 1 }}
        >
          職場のホンネを見る <Icon name="arrow" size={16} />
        </Link>
      </div>
    </article>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name="search" size={30} />
      </span>
      <h2>{title}</h2>
      <div>{children}</div>
    </div>
  );
}
export function LoadingState() {
  return (
    <main id="main" className="container page-section" aria-busy="true">
      <div className="loading-state" role="status">
        職場の情報を読み込んでいます…
      </div>
    </main>
  );
}
export function ErrorState() {
  return (
    <main id="main" className="container page-section">
      <EmptyState title="情報を読み込めませんでした">
        <p>時間をおいて、もう一度お試しください。</p>
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
      </EmptyState>
    </main>
  );
}
