import { Link, createFileRoute } from "@tanstack/react-router";
import { searchStores, getFilters } from "../server/store-functions";
import {
  defaultSearch,
  parseSearchParams,
  type StoreSearch,
} from "../schemas/store-search";
import {
  StoreCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from "../features/stores/store-ui";
import { SearchForm } from "../features/stores/search-form";
import { ButtonLink } from "../components/button";
import { Icon } from "../components/icon";
import { Pagination } from "../components/pagination";
export const Route = createFileRoute("/stores/")({
  validateSearch: parseSearchParams,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const [result, filters] = await Promise.all([
      searchStores({ data: deps }),
      getFilters(),
    ]);
    return { result, filters };
  },
  component: StoresPage,
  pendingComponent: LoadingState,
  errorComponent: ErrorState,
});
function StoresPage() {
  const { result, filters } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  function update(patch: Partial<StoreSearch>) {
    void navigate({ search: { ...search, ...patch, page: patch.page ?? 1 } });
  }
  const active = Boolean(
    search.q || search.area || search.category || search.minRating,
  );
  return (
    <main id="main">
      <div className="search-strip">
        <div className="container">
          <SearchForm key={search.q + "|" + search.area} search={search} />
        </div>
      </div>
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">ホーム</Link>
          <span> / </span>
          <span>バイト先を探す</span>
        </div>
        <div className="listing-title">
          <div>
            <p className="eyebrow">WORKPLACE REVIEWS</p>
            <h1>あなたに合う、バイト先を。</h1>
            <p>働いた人のリアルな声から、職場を見比べよう。</p>
          </div>
          <span className="listing-total">
            <strong>{result.total}</strong> 件の職場
          </span>
        </div>
        <div className="listing-layout">
          <aside className="filter-panel">
            <div className="filter-heading">
              <h2>条件を絞り込む</h2>
              {active && (
                <Link to="/stores" search={defaultSearch}>
                  クリア
                </Link>
              )}
            </div>
            <label className="filter-field">
              エリア
              <select
                value={filters.areas.includes(search.area) ? search.area : ""}
                onChange={(e) => update({ area: e.target.value })}
              >
                <option value="">すべてのエリア</option>
                {filters.areas.map((area) => (
                  <option key={area}>{area}</option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>業種から選ぶ</legend>
              <label className="radio-row">
                <input
                  type="radio"
                  name="category"
                  checked={!search.category}
                  onChange={() => update({ category: "" })}
                />
                すべての業種
              </label>
              {filters.categories.map((category) => (
                <label className="radio-row" key={category.code}>
                  <input
                    type="radio"
                    name="category"
                    checked={search.category === category.code}
                    onChange={() => update({ category: category.code })}
                  />
                  {category.name}
                </label>
              ))}
            </fieldset>
            <label className="filter-field">
              平均評価
              <select
                value={search.minRating}
                onChange={(e) => update({ minRating: Number(e.target.value) })}
              >
                <option value={0}>すべての評価</option>
                <option value={4}>4.0以上</option>
                <option value={3}>3.0以上</option>
                <option value={2}>2.0以上</option>
              </select>
            </label>
            <div className="filter-note">
              <Icon name="chat" size={25} />
              <strong>数字と、その理由も。</strong>
              <p>評価だけでなく、口コミに書かれた経験も参考にしましょう。</p>
            </div>
          </aside>
          <section aria-label="検索結果" className="results">
            <div className="results-toolbar">
              <p role="status">
                <b>{result.total}</b>件
                {result.total > 0 && (
                  <>
                    中 {(result.page - 1) * 12 + 1}–
                    {Math.min(result.page * 12, result.total)}件を表示
                  </>
                )}
              </p>
              <label>
                並び替え
                <select
                  value={search.sort}
                  onChange={(e) =>
                    update({ sort: e.target.value as StoreSearch["sort"] })
                  }
                >
                  <option value="name">店舗名順</option>
                  <option value="rating">評価が高い順</option>
                  <option value="reviews">口コミが多い順</option>
                </select>
              </label>
            </div>
            {active && (
              <div className="active-filters">
                {search.q && <span>店舗名：{search.q}</span>}
                {search.area && <span>{search.area}</span>}
                {search.category && (
                  <span>
                    {filters.categories.find((c) => c.code === search.category)
                      ?.name ?? search.category}
                  </span>
                )}
                {search.minRating > 0 && (
                  <span>評価 {search.minRating}以上</span>
                )}
              </div>
            )}
            <div className="store-list">
              {result.stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
            {result.total === 0 && (
              <EmptyState title="条件に合う職場が見つかりませんでした">
                <p>
                  キーワードを短くするか、絞り込み条件を変更してみてください。
                </p>
                <ButtonLink to="/stores" search={defaultSearch}>
                  すべての職場を見る
                </ButtonLink>
              </EmptyState>
            )}
            {result.pageCount > 1 && (
              <Pagination
                label="検索結果のページ"
                page={result.page}
                pageCount={result.pageCount}
                onPageChange={(next) => update({ page: next })}
              />
            )}
            <p className="data-note">
              評価は公開口コミの各評価点の単純平均です。写真は業種のイメージです。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
