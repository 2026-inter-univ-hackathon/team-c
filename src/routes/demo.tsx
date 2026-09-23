import { Link, createFileRoute } from "@tanstack/react-router";
import { Icon } from "../components/icon";
import { defaultSearch } from "../schemas/store-search";

export const Route = createFileRoute("/demo")({ component: DemoSelector });

function DemoSelector() {
  return (
    <main id="main" className="demo-selector-page">
      <div className="container demo-selector-inner">
        <div className="demo-notice">
          <Icon name="alert" size={18} />
          <p>
            これは画面確認用のデモです。ログインやアカウントの切り替えは行いません。
          </p>
        </div>

        <header className="demo-selector-heading">
          <p className="eyebrow">CHOOSE A DEMO VIEW</p>
          <h1>どちらの立場で見ますか？</h1>
          <p>ボタンを押すと、それぞれのサービス画面へ移動します。</p>
        </header>

        <div className="demo-persona-grid">
          <Link
            to="/stores"
            search={defaultSearch}
            className="demo-persona-card"
            reloadDocument
          >
            <span className="demo-persona-icon">
              <Icon name="search" size={30} />
            </span>
            <p className="eyebrow">WORKER VIEW</p>
            <h2>バイトを探す人</h2>
            <p>店舗を検索し、働いた人の評価や口コミを見比べる画面です。</p>
            <strong>
              求職者向け画面を見る <Icon name="arrow" size={17} />
            </strong>
          </Link>

          <Link
            to="/company"
            className="demo-persona-card company"
            reloadDocument
          >
            <span className="demo-persona-icon">
              <Icon name="shield" size={30} />
            </span>
            <p className="eyebrow">COMPANY VIEW</p>
            <h2>掲載企業の担当者</h2>
            <p>自社店舗の評価傾向と、匿名化された口コミを確認する画面です。</p>
            <strong>
              企業向け画面を見る <Icon name="arrow" size={17} />
            </strong>
          </Link>
        </div>
      </div>
    </main>
  );
}
