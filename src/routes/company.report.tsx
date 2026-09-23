import { Link, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "../components/button";
import {
  demoActions,
  demoCompany,
  demoDimensions,
  demoInsights,
  demoReviews,
  demoStores,
} from "../features/company/demo-data";

export const Route = createFileRoute("/company/report")({
  component: CompanyReport,
});

type Period = "3" | "6";

function CompanyReport() {
  const [period, setPeriod] = useState<Period>("3");
  const [storeId, setStoreId] = useState("all");
  const [preventedDepartures, setPreventedDepartures] = useState(1);
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const selectedStores = useMemo(
    () =>
      storeId === "all"
        ? [...demoStores]
        : demoStores.filter((store) => store.id === storeId),
    [storeId],
  );
  const selectedNames = new Set(selectedStores.map((store) => store.name));
  const visibleReviews = demoReviews.filter(
    (review, index) =>
      selectedNames.has(review.storeName) && (period === "6" || index < 3),
  );
  const average =
    selectedStores.reduce((sum, store) => sum + store.averageRating, 0) /
    selectedStores.length;
  const lowSaving = preventedDepartures * 15;
  const highSaving = preventedDepartures * 30;

  function toggleAction(title: string) {
    setCompletedActions((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title],
    );
  }

  return (
    <main id="main" className="company-report-page">
      <div className="company-demo-bar company-report-no-print">
        <div className="container">
          <span>組織改善レポート・デモ</span>
          <p>表示条件の変更と印刷／PDF保存を試せます。</p>
          <Link to="/company">ダッシュボードへ戻る</Link>
        </div>
      </div>

      <div className="container company-report-layout">
        <header className="company-report-header">
          <div>
            <p className="eyebrow">WORKPLACE IMPROVEMENT REPORT</p>
            <h1>組織改善レポート</h1>
            <p>{demoCompany.name} ・ 2026年9月24日作成</p>
          </div>
          <Button
            className="company-report-no-print"
            onClick={() => window.print()}
          >
            印刷・PDF保存
          </Button>
        </header>

        <section
          className="company-report-controls company-report-no-print"
          aria-label="レポート表示条件"
        >
          <label>
            集計期間
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value as Period)}
            >
              <option value="3">直近3か月</option>
              <option value="6">直近6か月</option>
            </select>
          </label>
          <label>
            対象店舗
            <select
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
            >
              <option value="all">全店舗</option>
              {demoStores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name.replace("【デモ】", "")}
                </option>
              ))}
            </select>
          </label>
          <p role="status">
            {period === "3" ? "直近3か月" : "直近6か月"}・
            {storeId === "all" ? "全店舗" : selectedStores[0]?.name}
          </p>
        </section>

        <section
          className="company-report-summary"
          aria-labelledby="report-summary"
        >
          <div>
            <p className="eyebrow">EXECUTIVE SUMMARY</p>
            <h2 id="report-summary">経営・人事向けサマリー</h2>
          </div>
          <p>
            シフト相談のしやすさは定着につながる強みです。一方、繁忙時間の業務負荷と新人の初週研修には改善余地があります。
            まずは要フォロー店舗の教育手順をそろえ、ピーク前の役割確認を定着させることを推奨します。
          </p>
          <small>
            固定データから生成したデモ要約です。AI分析結果ではありません。
          </small>
        </section>

        <section className="company-report-kpis" aria-label="主要指標">
          <article>
            <span>対象店舗</span>
            <strong>{selectedStores.length}</strong>
            <small>店舗</small>
          </article>
          <article>
            <span>対象口コミ</span>
            <strong>{visibleReviews.length}</strong>
            <small>件</small>
          </article>
          <article>
            <span>平均評価</span>
            <strong>{average.toFixed(2)}</strong>
            <small>/ 5.00</small>
          </article>
          <article>
            <span>要フォロー</span>
            <strong>
              {
                selectedStores.filter((store) => store.status === "要フォロー")
                  .length
              }
            </strong>
            <small>店舗</small>
          </article>
        </section>

        <section
          className="company-report-section"
          aria-labelledby="report-scores"
        >
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">SCORE DETAILS</p>
              <h2 id="report-scores">職場体験の4指標</h2>
            </div>
            <p>5点満点・デモ集計</p>
          </div>
          <div className="company-report-score-list">
            {demoDimensions.map((dimension) => (
              <div key={dimension.code}>
                <span>{dimension.label}</span>
                <div aria-hidden="true">
                  <i style={{ width: `${(dimension.score / 5) * 100}%` }} />
                </div>
                <strong>{dimension.score.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </section>

        <section
          className="company-report-section"
          aria-labelledby="report-findings"
        >
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">FINDINGS</p>
              <h2 id="report-findings">定性コメントからの発見</h2>
            </div>
          </div>
          <div className="company-report-findings">
            {demoInsights.map((insight) => (
              <article key={insight.label}>
                <span>{insight.label}</span>
                <h3>{insight.title}</h3>
                <p>{insight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          className="company-report-section"
          aria-labelledby="report-actions"
        >
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">ACTION PLAN</p>
              <h2 id="report-actions">改善アクション</h2>
            </div>
            <p className="company-report-no-print">
              チェック状態はこの画面を開いている間だけ保持されます
            </p>
          </div>
          <div className="company-report-checklist">
            {demoActions.map((action) => (
              <label key={action.title}>
                <input
                  type="checkbox"
                  checked={completedActions.includes(action.title)}
                  onChange={() => toggleAction(action.title)}
                />
                <span>
                  <strong>{action.title}</strong>
                  <small>{action.store}</small>
                  <p>{action.reason}</p>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section
          className="company-report-impact"
          aria-labelledby="report-impact"
        >
          <div>
            <p className="eyebrow">COST IMPACT</p>
            <h2 id="report-impact">改善インパクト試算</h2>
            <p>
              早期離職1人あたり15〜30万円という企画資料の参考値を使った単純試算です。
            </p>
          </div>
          <label className="company-report-no-print">
            防げると仮定する早期離職
            <input
              type="number"
              min={0}
              max={20}
              value={preventedDepartures}
              onChange={(event) =>
                setPreventedDepartures(
                  Math.min(20, Math.max(0, Number(event.target.value) || 0)),
                )
              }
            />
            人
          </label>
          <div>
            <span>想定削減効果</span>
            <strong>
              {lowSaving}〜{highSaving}万円
            </strong>
          </div>
        </section>

        <section
          className="company-report-section"
          aria-labelledby="report-voices"
        >
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">SOURCE VOICES</p>
              <h2 id="report-voices">判断の根拠となった口コミ</h2>
            </div>
          </div>
          <div className="company-report-voices">
            {visibleReviews.map((review) => (
              <blockquote key={review.id}>
                <p>{review.summary}</p>
                <footer>
                  {review.storeName} ・ {review.date} ・ 総合
                  {review.score.toFixed(1)}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <footer className="company-report-footnote">
          本レポートは機能確認用のデモです。実在する企業・店舗・従業員の評価ではありません。
        </footer>
      </div>
    </main>
  );
}
