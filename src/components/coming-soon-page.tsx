import { Link } from "@tanstack/react-router";

export function ComingSoonPage({ title }: { title: string }) {
  return (
    <main id="main" className="container page-section">
      <div className="breadcrumbs">
        <Link to="/">ホーム</Link>
        <span> / {title}</span>
      </div>
      <h1>{title}</h1>
      <p className="page-description">
        このページは現在準備中です。公開までしばらくお待ちください。
      </p>
    </main>
  );
}
