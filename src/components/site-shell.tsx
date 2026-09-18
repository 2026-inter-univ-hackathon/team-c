import { Link, Outlet } from "@tanstack/react-router";
import { defaultSearch } from "../schemas/store-search";
import { Icon } from "./icon";
export function SiteShell() {
  return (
    <>
      <a className="skip-link" href="#main">
        本文へスキップ
      </a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">
              <Icon name="chat" size={25} />
            </span>
            バイトの<span>ホンネ</span>
            <small>働く前に、知っておこう。</small>
          </Link>
          <nav aria-label="メインナビゲーション">
            <Link
              to="/stores"
              search={defaultSearch}
              activeProps={{ className: "active" }}
            >
              <Icon name="search" size={18} />
              バイト先を探す
            </Link>
            <Link to="/saved" activeProps={{ className: "active" }}>
              <Icon name="heart" size={18} />
              気になる
            </Link>
          </nav>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <strong>バイトのホンネ</strong>
            <p>働いた人の声から、自分らしい選択を。</p>
          </div>
          <p>
            口コミは個人の経験に基づくものです。
            <br />
            複数の声を参考に、あなたに合う職場を見つけてください。
          </p>
          <small>© 2026 バイトのホンネ</small>
        </div>
      </footer>
    </>
  );
}
