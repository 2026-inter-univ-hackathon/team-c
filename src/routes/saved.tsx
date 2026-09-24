import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, ButtonLink } from "../components/button";
import { ConfirmDialog } from "../components/confirm-dialog";
import { Pagination } from "../components/pagination";
import { useFavorites } from "../features/stores/favorites";
import { EmptyState, StoreCard } from "../features/stores/store-ui";
import { searchStores } from "../server/store-functions";
import { defaultSearch } from "../schemas/store-search";
export const Route = createFileRoute("/saved")({ component: SavedPage });
function SavedPage() {
  const { ids, raw, clear } = useFavorites();
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
        <div className="saved-compare-banner">
          <div>
            <strong>気になる職場、どこが自分に合いそう？</strong>
            <p>最大3件の評価や口コミを、並べて見比べられます。</p>
          </div>
          <ButtonLink to="/compare">職場を比較する</ButtonLink>
        </div>
      )}
      {ids.length > 0 && (
        <ConfirmDialog
          triggerLabel="保存をすべて解除"
          triggerClassName="text-link"
          message="このブラウザに保存した職場をすべて解除しますか？"
          confirmLabel="すべて解除"
          onConfirm={clear}
        />
      )}
      {ids.length ? (
        <SavedResults key={raw} ids={ids} />
      ) : (
        <EmptyState title="気になる職場を集めてみよう">
          <p>店舗のハートを押すと、ここからいつでも確認できます。</p>
          <ButtonLink to="/stores" search={defaultSearch}>
            バイト先を探す
          </ButtonLink>
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
        <Button onClick={() => window.location.reload()}>再読み込み</Button>
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
        <Pagination
          label="保存した職場のページ"
          page={result.page}
          pageCount={result.pageCount}
          onPageChange={(next) => {
            setResult(null);
            setPage(next);
          }}
        />
      )}
    </>
  );
}
