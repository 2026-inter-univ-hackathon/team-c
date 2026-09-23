import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "../components/button";
import { Icon } from "../components/icon";
import { Rating } from "../features/stores/store-ui";

const demoCompany = {
  name: "株式会社こもれびフーズ",
  representative: "採用・店舗運営チーム",
} as const;

const demoStores = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    name: "【デモ】こもれびカフェ 早稲田1号店",
    category: "カフェ",
    location: "東京都 新宿区",
    averageRating: 4.1,
    reviewCount: 5,
    status: "安定",
    focus: "繁忙時間の役割分担",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    name: "【デモ】まちかどマート 池袋1号店",
    category: "コンビニ",
    location: "東京都 豊島区",
    averageRating: 3.6,
    reviewCount: 5,
    status: "要フォロー",
    focus: "新人研修と夕方の業務負荷",
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    name: "【デモ】ひなた学習室 赤羽1号店",
    category: "教育・塾",
    location: "東京都 北区",
    averageRating: 4.3,
    reviewCount: 5,
    status: "安定",
    focus: "授業前後の相談体制",
  },
] as const;

const demoDimensions = [
  { code: "atmosphere", label: "職場の雰囲気", score: 4.2 },
  { code: "training", label: "教育・フォロー体制", score: 3.8 },
  { code: "workload", label: "業務のゆとり", score: 3.4 },
  { code: "flexibility", label: "シフトの融通度", score: 4.1 },
] as const;

const demoReviews = [
  {
    id: "demo-review-1",
    storeName: demoStores[0].name,
    score: 4.5,
    date: "2026年8月下旬",
    summary:
      "ランチのピークは忙しいものの、役割分担がはっきりしていました。テスト期間のシフトは早めに伝えると調整しやすかったです。",
  },
  {
    id: "demo-review-2",
    storeName: demoStores[1].name,
    score: 3.5,
    date: "2026年7月中旬",
    summary:
      "夕方は宅配の受付が増えます。最初は覚えることが多かったですが、先輩へ質問しやすい雰囲気でした。",
  },
  {
    id: "demo-review-3",
    storeName: demoStores[2].name,
    score: 4.3,
    date: "2026年6月上旬",
    summary:
      "授業前に教材を確認する時間があり、分からないことは社員へ相談できました。説明の振り返りもできて安心でした。",
  },
  {
    id: "demo-review-4",
    storeName: demoStores[0].name,
    score: 4.0,
    date: "2026年5月下旬",
    summary:
      "週末は急に混みますが、困ったときは近くのスタッフが声をかけてくれます。新人にも役割が分かりやすかったです。",
  },
] as const;

const demoInsights = [
  {
    label: "強み",
    title: "シフト相談のしやすさ",
    description:
      "テスト期間や予定変更を早めに相談できる点が、複数店舗で評価されています。求人情報でも具体的に伝えられます。",
  },
  {
    label: "改善余地",
    title: "繁忙時間の業務負荷",
    description:
      "4指標の中では「業務のゆとり」が最も低い傾向です。ピーク前の役割確認と新人フォローが優先候補です。",
  },
  {
    label: "注視店舗",
    title: "まちかどマート 池袋1号店",
    description:
      "夕方業務と研修に関する声が重なっています。現場確認と初週の教育手順の見直しを提案します。",
  },
] as const;

const demoActions = [
  {
    priority: "優先度 高",
    title: "新人の初週チェックリストを統一",
    store: "まちかどマート 池袋1号店",
    reason: "「覚えることが多い」「夕方に業務が重なる」という声への対応",
  },
  {
    priority: "優先度 中",
    title: "ピーク前の役割確認を5分実施",
    store: "こもれびカフェ 早稲田1号店",
    reason: "忙しい時間帯でも役割分担が機能している強みを定着させる",
  },
] as const;

export const Route = createFileRoute("/company")({
  component: CompanyDashboard,
});

function CompanyDashboard() {
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
            <Button onClick={() => showDemoMessage("組織改善レポート出力")}>
              改善レポートを見る
            </Button>
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
