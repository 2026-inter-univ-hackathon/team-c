import {
  Link,
  Outlet,
  createFileRoute,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import { Button, ButtonLink } from "../components/button";
import { Icon } from "../components/icon";
import {
  demoActions,
  demoCompany,
  demoDimensions,
  demoInsights,
  demoReviews,
  demoStores,
} from "../features/company/demo-data";
import { Rating } from "../features/stores/store-ui";

export const Route = createFileRoute("/company")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const [message, setMessage] = useState("");
  const totalReviews = demoStores.reduce(
    (total, store) => total + store.reviewCount,
    0,
  );
  const companyAverage =
    demoStores.reduce((total, store) => total + store.averageRating, 0) /
    demoStores.length;

  function showDemoMessage(action: string) {
    setMessage(`${action}はデモ表示のため保存されません。`);
  }

  if (pathname.startsWith("/company/")) return <Outlet />;

  return (
    <main id="main" className="company-page">
      <div className="company-demo-bar">
        <div className="container">
          <span>企業向けデモ画面</span>
          <p>ログイン・権限管理・データ更新は行いません。</p>
          <Link to="/demo">表示を切り替える</Link>
        </div>
      </div>

      <div className="container company-layout">
        <header className="company-heading">
          <div>
            <p className="eyebrow">COMPANY DASHBOARD</p>
            <h1>{demoCompany.name}</h1>
            <p>
              {demoCompany.representative} ・
              現場の声から、定着しやすい職場づくりへ
            </p>
          </div>
          <div className="company-heading-actions">
            <Button
              variant="secondary"
              onClick={() => showDemoMessage("店舗追加")}
            >
              店舗を追加
            </Button>
            <ButtonLink to="/company/report">改善レポートを見る</ButtonLink>
          </div>
        </header>

        {message && (
          <p className="company-action-message" role="status">
            {message}
          </p>
        )}

        <section aria-labelledby="summary-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">OVERVIEW</p>
              <h2 id="summary-title">組織の現在地</h2>
            </div>
            <p>公開口コミをもとにしたデモ推定</p>
          </div>
          <div className="company-stat-grid">
            <article>
              <span>管理店舗</span>
              <strong>{demoStores.length}</strong>
              <small>店舗</small>
            </article>
            <article>
              <span>公開口コミ</span>
              <strong>{totalReviews}</strong>
              <small>件</small>
            </article>
            <article>
              <span>改善優先店舗</span>
              <strong>1</strong>
              <small>店舗</small>
            </article>
            <article className="company-stat-cost">
              <span>早期離職1人あたりの想定損失</span>
              <strong>15〜30</strong>
              <small>万円</small>
              <p>採用費・研修人件費・教育担当者の工数を含む参考値</p>
            </article>
          </div>
          <p className="company-stat-note">
            店舗平均 {companyAverage.toFixed(2)} / 5.00 ・
            企画資料に記載された調査値を使ったデモ表示です。
          </p>
        </section>

        <section className="company-insight" aria-labelledby="insight-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">VOICE INSIGHTS</p>
              <h2 id="insight-title">口コミから見えること</h2>
            </div>
            <span className="company-demo-label">デモ要約</span>
          </div>
          <div className="company-insight-grid">
            {demoInsights.map((insight) => (
              <article key={insight.label}>
                <span>{insight.label}</span>
                <h3>{insight.title}</h3>
                <p>{insight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="company-analysis" aria-labelledby="analysis-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">ANALYSIS</p>
              <h2 id="analysis-title">評価の傾向</h2>
            </div>
            <p>3店舗の傾向をまとめたサンプル表示</p>
          </div>
          <div className="company-dimension-grid">
            {demoDimensions.map((dimension) => (
              <article key={dimension.code}>
                <span>{dimension.label}</span>
                <strong>{dimension.score.toFixed(1)}</strong>
                <div aria-hidden="true">
                  <i style={{ width: `${(dimension.score / 5) * 100}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="company-actions" aria-labelledby="actions-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">NEXT ACTIONS</p>
              <h2 id="actions-title">今月の改善アクション</h2>
            </div>
            <p>定性コメントと評価傾向から整理したデモ提案</p>
          </div>
          <div className="company-action-list">
            {demoActions.map((action) => (
              <article key={action.title}>
                <span>{action.priority}</span>
                <div>
                  <h3>{action.title}</h3>
                  <strong>{action.store}</strong>
                  <p>{action.reason}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => showDemoMessage("改善アクション登録")}
                >
                  対応を記録
                </Button>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="stores-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">YOUR STORES</p>
              <h2 id="stores-title">管理店舗</h2>
            </div>
          </div>
          <div className="company-store-grid">
            {demoStores.map((store) => (
              <article key={store.id}>
                <div className="company-store-top">
                  <div>
                    <span>{store.category}</span>
                    <h3>{store.name}</h3>
                    <p>
                      <Icon name="pin" size={14} />
                      {store.location}
                    </p>
                  </div>
                  <Rating
                    value={store.averageRating}
                    count={store.reviewCount}
                  />
                </div>
                <div className="company-store-signal">
                  <span data-status={store.status}>{store.status}</span>
                  <p>
                    注目ポイント：<strong>{store.focus}</strong>
                  </p>
                </div>
                <div className="company-store-actions">
                  <Link
                    to="/stores/$storeId"
                    params={{ storeId: store.id }}
                    search={{ page: 1 }}
                  >
                    公開ページを見る
                  </Link>
                  <Button
                    variant="secondary"
                    onClick={() => showDemoMessage("店舗情報の編集")}
                  >
                    店舗情報を編集
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="reviews-title">
          <div className="company-section-heading">
            <div>
              <p className="eyebrow">RECENT REVIEWS</p>
              <h2 id="reviews-title">最近の口コミ</h2>
            </div>
            <p>企業には匿名化・丸め処理後の情報だけを表示</p>
          </div>
          <div className="company-review-list">
            {demoReviews.map((review) => (
              <article key={review.id}>
                <div>
                  <span>{review.storeName}</span>
                  <strong>総合 {review.score.toFixed(1)}</strong>
                </div>
                <p>{review.summary}</p>
                <footer>
                  <time>{review.date}</time>
                  <Button
                    variant="secondary"
                    onClick={() => showDemoMessage("公式回答")}
                  >
                    公式回答を書く
                  </Button>
                </footer>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
