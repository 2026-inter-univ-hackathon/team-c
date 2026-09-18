import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useFavorites } from "../features/stores/favorites";
import { EmptyState, StoreCard } from "../features/stores/store-ui";
import { searchStores } from "../server/store-functions";
import { defaultSearch } from "../schemas/store-search";
export const Route = createFileRoute("/saved")({ component: SavedPage });
function SavedPage() {
  const { ids, raw, clear, message } = useFavorites();
  return (
    <main id="main" className="container page-section">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / 気になる職場</span>
      </div>
      <p className="eyebrow">YOUR SHORTLIST</p>
      <h1>気になる職場</h1>
      <p className="page-description">
        あとでじっくり、見比べよう。保存はこのブラウザだけに反映されます。
      </p>
      {ids.length > 0 && (
        <button
          type="button"
          className="text-link"
          onClick={() => {
            if (
              window.confirm("このブラウザに保存した職場をすべて解除しますか？")
            )
              clear();
          }}
        >
          保存をすべて解除
        </button>
      )}
      <p className="data-note" role="status">
        {message}
      </p>
      {ids.length ? (
        <SavedResults key={raw} ids={ids} />
      ) : (
        <EmptyState title="気になる職場を集めてみよう">
          <p>店舗のハートを押すと、ここからいつでも確認できます。</p>
          <Link to="/stores" search={defaultSearch} className="button primary">
            バイト先を探す
          </Link>
        </EmptyState>
      )}
    </main>
  );
}
function SavedResults({ ids }: { ids: string[] }) {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof searchStores>
  > | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    searchStores({ data: { ...defaultSearch, ids, page } })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [ids, page]);
  if (error)
    return (
      <EmptyState title="保存した職場を読み込めませんでした">
        <p>時間をおいて再度お試しください。</p>
        <button
          className="button primary"
          onClick={() => window.location.reload()}
        >
          再読み込み
        </button>
      </EmptyState>
    );
  if (!result)
    return (
      <p className="loading-state" role="status">
        保存した職場を読み込んでいます…
      </p>
    );
  return (
    <>
      <p className="data-note">
        保存した{ids.length}件のうち、公開中の{result.total}件を表示できます。
      </p>
      <div className="store-list">
        {result.stores.map((store) => (
          <StoreCard key={store.id} store={store} />
        ))}
      </div>
      {result.total === 0 && (
        <EmptyState title="現在表示できる職場がありません">
          <p>保存した職場が非公開または削除された可能性があります。</p>
        </EmptyState>
      )}
      {result.pageCount > 1 && (
        <nav className="pagination" aria-label="保存した職場のページ">
          <button
            disabled={result.page <= 1}
            onClick={() => {
              setResult(null);
              setPage(result.page - 1);
            }}
          >
            前へ
          </button>
          <span>
            {result.page} / {result.pageCount}
          </span>
          <button
            disabled={result.page >= result.pageCount}
            onClick={() => {
              setResult(null);
              setPage(result.page + 1);
            }}
          >
            次へ
          </button>
        </nav>
      )}
    </>
  );
}
