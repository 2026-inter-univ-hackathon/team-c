import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button, ButtonLink } from "../components/button";
import { Icon } from "../components/icon";
import { Pagination } from "../components/pagination";
import { parseFavorites, useFavorites } from "../features/stores/favorites";
import { categoryImage, EmptyState } from "../features/stores/store-ui";
import { labels, ratingCodes } from "../schemas/review-flow";
import { defaultSearch } from "../schemas/store-search";
import { getStoreDetail, searchStores } from "../server/store-functions";

export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "気になる職場を比較 | バイトのホンネ" }] }),
  component: ComparePage,
});

type Choice = { id: string; name: string };
type Detail = Awaited<ReturnType<typeof getStoreDetail>>;
type Result = { id: string; data: Detail | null; failed: boolean };

function ComparePage() {
  const { raw } = useFavorites();
  const ids = useMemo(() => parseFavorites(raw), [raw]);
  return (
    <main id="main" className="container page-section compare-page">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / </span>
        <Link to="/saved">気になる職場</Link>
        <span> / 比較</span>
      </div>
      <header className="compare-heading">
        <div>
          <p className="eyebrow">FIND YOUR FIT</p>
          <h1>
            私に合う職場、
            <br className="compare-mobile-break" />
            見比べてみよう。
          </h1>
          <p className="page-description">
            雰囲気も、シフトも。あなたが大切にしたいことを、並べて確認。
          </p>
        </div>
        <Link className="text-link" to="/saved">
          気になる職場に戻る
        </Link>
      </header>
      {ids.length ? (
        <CompareWorkspace key={raw} ids={ids} />
      ) : (
        <EmptyState title="まずは、気になる職場を保存しよう">
          <p>店舗のハートを押して保存すると、ここで最大3件まで比較できます。</p>
          <ButtonLink to="/stores" search={defaultSearch}>
            バイト先を探す
          </ButtonLink>
        </EmptyState>
      )}
    </main>
  );
}

function CompareWorkspace({ ids }: { ids: string[] }) {
  const [selected, setSelected] = useState<Choice[]>([]);
  const [page, setPage] = useState(1);
  function toggle(choice: Choice) {
    setSelected((current) =>
      current.some((s) => s.id === choice.id)
        ? current.filter((s) => s.id !== choice.id)
        : current.length < 3
          ? [...current, choice]
          : current,
    );
  }
  return (
    <>
      <section
        className="compare-picker"
        aria-labelledby="compare-picker-title"
      >
        <div className="compare-section-heading">
          <div>
            <p className="eyebrow">STEP 01</p>
            <h2 id="compare-picker-title">比較する職場を選ぶ</h2>
          </div>
          <span className="compare-counter" role="status">
            {selected.length} / 3件 選択中
          </span>
        </div>
        <p className="compare-help">
          保存した職場から2〜3件を選んでください。比較から外しても、保存は解除されません。
        </p>
        <SavedChoices
          key={page}
          ids={ids}
          page={page}
          selected={selected}
          toggle={toggle}
          onPageChange={setPage}
        />
      </section>
      <div className="compare-selection" aria-label="選択した職場">
        <div className="compare-selected-list">
          {selected.length === 0 ? (
            <span>比較したい職場を選んでみましょう</span>
          ) : (
            selected.map((s) => (
              <button
                type="button"
                key={s.id}
                onClick={() => toggle(s)}
                aria-label={`${s.name}を比較から外す`}
              >
                {s.name}
                <span aria-hidden="true">×</span>
              </button>
            ))
          )}
        </div>
        {selected.length >= 2 ? (
          <a href="#comparison" className="button primary">
            {selected.length}件を見比べる <Icon name="arrow" size={16} />
          </a>
        ) : (
          <span className="compare-help">
            あと{2 - selected.length}件選ぶと比較できます
          </span>
        )}
      </div>
      {selected.length >= 2 && (
        <Comparison
          key={selected.map((s) => s.id).join(",")}
          selected={selected}
        />
      )}
      <p className="data-note">
        保存した職場はこのブラウザだけに反映されます。比較対象はページを開き直すとリセットされます。
      </p>
    </>
  );
}

function SavedChoices({
  ids,
  page,
  selected,
  toggle,
  onPageChange,
}: {
  ids: string[];
  page: number;
  selected: Choice[];
  toggle: (choice: Choice) => void;
  onPageChange: (page: number) => void;
}) {
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof searchStores>
  > | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
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
  }, [ids, page, attempt]);
  if (error)
    return (
      <div className="compare-notice" role="alert">
        <p>保存した職場を読み込めませんでした。</p>
        <Button
          variant="secondary"
          onClick={() => {
            setError(false);
            setAttempt((a) => a + 1);
          }}
        >
          再読み込み
        </Button>
      </div>
    );
  if (!result)
    return (
      <p className="loading-state" role="status">
        保存した職場を読み込んでいます…
      </p>
    );
  return (
    <>
      {result.total < ids.length && (
        <p className="data-note">
          保存した{ids.length}件のうち、公開中の{result.total}件を選べます。
        </p>
      )}
      {result.total === 0 ? (
        <EmptyState title="現在比較できる職場がありません">
          <p>保存した職場が非公開または削除された可能性があります。</p>
          <ButtonLink to="/stores" search={defaultSearch}>
            職場を探す
          </ButtonLink>
        </EmptyState>
      ) : (
        <div className="compare-choices">
          {result.stores.map((store) => {
            const checked = selected.some((s) => s.id === store.id);
            return (
              <label
                key={store.id}
                className={`compare-choice${checked ? " is-selected" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={!checked && selected.length >= 3}
                  onChange={() => toggle({ id: store.id, name: store.name })}
                />
                <img
                  src={categoryImage(store.categories[0]?.code)}
                  alt=""
                  loading="lazy"
                />
                <span>
                  <strong>{store.name}</strong>
                  <small>
                    {[store.prefecture, store.city].filter(Boolean).join(" ") ||
                      "所在地未登録"}
                  </small>
                  <small>
                    {store.categories.map((c) => c.name).join("・")} · 口コミ
                    {store.reviewCount}件
                  </small>
                </span>
              </label>
            );
          })}
        </div>
      )}
      <p className="data-note">
        写真は業種イメージです。
        {selected.length === 3 &&
          "別の職場を選ぶには、選択中の職場を1件外してください。"}
      </p>
      <Link className="text-link" to="/stores" search={defaultSearch}>
        バイト先を探して、候補を追加 <Icon name="arrow" size={16} />
      </Link>
      {result.pageCount > 1 && (
        <Pagination
          label="比較する職場のページ"
          page={result.page}
          pageCount={result.pageCount}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}

function Comparison({ selected }: { selected: Choice[] }) {
  const [results, setResults] = useState<Result[] | null>(null);
  const [focus, setFocus] = useState<string>("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(
      selected.map((s) => getStoreDetail({ data: { storeId: s.id, page: 1 } })),
    ).then((values) => {
      if (!cancelled)
        setResults(
          values.map((r, i) => ({
            id: selected[i].id,
            data: r.status === "fulfilled" ? r.value : null,
            failed: r.status === "rejected",
          })),
        );
    });
    return () => {
      cancelled = true;
    };
  }, [selected, attempt]);
  return (
    <section
      id="comparison"
      className="compare-results"
      aria-labelledby="compare-results-title"
    >
      <div className="compare-section-heading">
        <div>
          <p className="eyebrow">STEP 02</p>
          <h2 id="compare-results-title">あなたの「大切」で、見比べる。</h2>
        </div>
      </div>
      <fieldset className="compare-priorities">
        <legend>重視する項目をハイライト</legend>
        {[
          { code: "", label: "すべて見る" },
          ...ratingCodes.map((code) => ({ code, label: labels.rating[code] })),
        ].map(({ code, label }) => (
          <button
            key={code}
            type="button"
            aria-pressed={focus === code}
            onClick={() => setFocus(code)}
          >
            {label}
          </button>
        ))}
      </fieldset>
      {!results ? (
        <p className="loading-state" role="status">
          職場の評価を読み込んでいます…
        </p>
      ) : (
        <>
          {results.some((r) => r.failed) && (
            <div className="compare-notice" role="alert">
              <p>
                一部の職場を読み込めませんでした。読み込めた職場は引き続き確認できます。
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setResults(null);
                  setAttempt((a) => a + 1);
                }}
              >
                再読み込み
              </Button>
            </div>
          )}
          <p className="compare-scroll-hint" id="compare-scroll-help">
            表は上下左右にスクロールできます。職場名と項目名は固定されます。
          </p>
          <div
            className="compare-table-scroll"
            role="region"
            aria-label="職場の比較表"
            aria-describedby="compare-scroll-help"
            tabIndex={0}
          >
            <table className="compare-table">
              <caption className="sr-only">
                選択した職場の評価・所在地・口コミの比較
              </caption>
              <thead>
                <tr>
                  <th scope="col">比較する項目</th>
                  {results.map((r, i) => (
                    <th key={r.id} scope="col">
                      <span className="compare-store-number">候補 {i + 1}</span>
                      <h3>{r.data?.store?.name ?? selected[i].name}</h3>
                      {r.data?.store ? (
                        <>
                          <span className="compare-store-category">
                            {r.data.store.categories
                              .map((c) => c.name)
                              .join("・")}
                          </span>
                          <Link
                            to="/stores/$storeId"
                            params={{ storeId: r.id }}
                            search={{ page: 1 }}
                            className="text-link"
                          >
                            詳しく見る <Icon name="arrow" size={14} />
                          </Link>
                        </>
                      ) : (
                        <p className="compare-help">
                          {r.failed
                            ? "読み込みに失敗しました"
                            : "非公開または削除された職場です"}
                        </p>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th scope="row">総合評価</th>
                  {results.map((r) => (
                    <td key={r.id}>
                      <Score value={r.data?.store?.averageRating ?? null} />
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">口コミ件数</th>
                  {results.map((r) => (
                    <td key={r.id}>
                      {r.data?.store ? (
                        <>
                          <strong>{r.data.store.reviewCount}件</strong>
                          {r.data.store.reviewCount < 5 && (
                            <span className="compare-sample-note">
                              口コミが少ないため、評価は参考としてご確認ください。
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
                {ratingCodes.map((code) => (
                  <tr
                    key={code}
                    className={focus === code ? "is-highlighted" : undefined}
                  >
                    <th scope="row">
                      {labels.rating[code]}
                      {focus === code && (
                        <small className="compare-focus-label">
                          重視する項目
                        </small>
                      )}
                    </th>
                    {results.map((r) => (
                      <td key={r.id}>
                        <Score
                          value={
                            r.data?.store?.ratingSummary.find(
                              (d) => d.dimensionCode === code,
                            )?.averageScore ?? null
                          }
                          bar
                        />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <th scope="row">所在地</th>
                  {results.map((r) => (
                    <td key={r.id}>
                      {r.data?.store
                        ? [
                            r.data.store.prefecture,
                            r.data.store.city,
                            r.data.store.address,
                          ]
                            .filter(Boolean)
                            .join(" ") || "所在地未登録"
                        : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">
                    口コミで挙がった
                    <br />
                    雰囲気<small>直近最大10件から表示</small>
                  </th>
                  {results.map((r) => (
                    <td key={r.id}>
                      <div className="compare-tags">
                        {r.data?.store && r.data.reviews.length > 0
                          ? [
                              ...new Set(
                                r.data.reviews.flatMap(
                                  (review) => review.atmosphereTags,
                                ),
                              ),
                            ].map((tag) => (
                              <span key={tag}>{labels.atmosphere[tag]}</span>
                            ))
                          : "—"}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <th scope="row">
                    最新の口コミ<small>個人の経験・感想です</small>
                  </th>
                  {results.map((r) => (
                    <td key={r.id}>
                      {r.data?.store ? (
                        r.data.reviews[0] ? (
                          <blockquote className="compare-quote">
                            {r.data.reviews[0].summary}
                          </blockquote>
                        ) : (
                          <span className="compare-help">
                            口コミはまだありません
                          </span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <div className="compare-footnote">
            <Icon name="chat" size={20} />
            <p>
              点数だけでは分からないことも。気になった職場は「詳しく見る」から、ほかの口コミも読んでみましょう。評価は5点満点で、勤続期間・在籍状況を考慮した集計です。「—」は評価データがない、または取得できない項目です。
            </p>
          </div>
        </>
      )}
    </section>
  );
}

function Score({
  value,
  bar = false,
}: {
  value: number | null;
  bar?: boolean;
}) {
  return (
    <div className="compare-score">
      <span>
        {value === null ? "—" : value.toFixed(2)}
        <small>{value !== null && " / 5"}</small>
      </span>
      {bar && value !== null && (
        <div className="compare-score-track" aria-hidden="true">
          <span style={{ width: `${Math.max(0, Math.min(5, value)) * 20}%` }} />
        </div>
      )}
    </div>
  );
}
