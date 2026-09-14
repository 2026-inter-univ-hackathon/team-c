# アルバイト口コミWebアプリ 基本設計

## 1. システム構成

```
Browser → (HTTPS) → Caddy → Next.js(Frontend) → Hono API(Backend) → PostgreSQL(+pgvector) / AI API
```

Frontend/Backendを分離することで、将来Native（Expo）アプリを追加しても同じAPIを利用できる構成にする。

## 2. 技術スタック

| レイヤー | 技術 | 採用理由 |
|---|---|---|
| Frontend | Next.js / React / TypeScript / Tailwind / shadcn/ui / TanStack Query | SEO対応・開発事例の多さ・短期間でのUI構築のしやすさ |
| Backend | Hono / TypeScript / Zod | 軽量API、Frontend/Backendでスキーマ共有可能 |
| DB | PostgreSQL / Drizzle ORM / pgvector | リレーショナル管理＋型安全アクセス＋ベクトル検索を1DBに統合 |
| Auth | Google OAuth（Better Auth） | シンプルな導入 |
| Infra | Docker Compose（web/api/db/caddy） | 開発・デプロイ環境の統一 |
| Monorepo | pnpm workspace（apps/web, api, mobile / packages/db, types, validation, api-client） | 型・スキーマの共有 |

> AI処理（Embedding生成・分析）はBackend経由でのみ呼び出す。APIキーをブラウザに公開しないため。

## 3. ユーザー種別と権限

| 機能 | USER | COMPANY | ADMIN |
|---|:---:|:---:|:---:|
| 店舗検索・閲覧 | ○ | ○ | ○ |
| 口コミ閲覧 | ○ | ○ | ○ |
| 口コミ投稿・編集 | ○ | × | ○ |
| 企業ダッシュボード・店舗分析 | × | ○ | ○ |
| 管理機能 | × | × | ○ |

企業ユーザーは自社に紐づく店舗データのみアクセス可能。ADMIN機能はMVPでは最小限。

## 4. 画面構成・遷移

**一般ユーザー**：ホーム →（検索）→ 店舗一覧 → 店舗詳細 →（口コミ閲覧／投稿）、プロフィール → 投稿履歴

**企業ユーザー**：Login → 企業Dashboard → 管理店舗一覧 → 店舗分析 → 口コミ詳細

**共通**：ログイン（Google認証）／エラー／404

### 口コミ投稿はStep形式（一度に全項目を出さない）
```
Step1 勤務情報 → Step2 5段階評価 → Step3 リアルな質問 → Step4 総合コメント → 確認 → 投稿
```
進捗表示（例：3/4）を画面上部に設置。

## 5. データモデル

### 主要Entity
```
Company ── Store ── Review ── ReviewEmbedding
Company ── CompanyMember ── User
User ── Review / ReviewLike / UserView
```

| Entity | 概要 |
|---|---|
| User | 識別子・名前・Email・プロフィール画像・Role |
| Company | 企業識別子・企業名 |
| CompanyMember | User⇔Companyの所属関係（中間テーブル、複数企業/Role対応） |
| Store | 店舗識別子・所属企業・店舗名・業種・所在地 |
| Review | 投稿者・店舗・5段階評価・勤務情報・自由記述質問群・一言コメント |
| ReviewEmbedding | 口コミ本文のEmbedding（意味検索用、更新時は再生成） |
| UserView | 店舗閲覧履歴（将来のレコメンド用） |

## 6. API構成（Resource単位）

```
/auth  /stores  /reviews  /users  /companies  /search
```

- **Store API**：一覧／詳細／店舗ごとの口コミ取得
- **Review API**：投稿／編集／削除／取得（編集・削除は投稿者本人 or 管理者のみ）
- **Search API**：
  - 通常検索（店舗名・業種・エリア・評価）
  - 意味検索：検索文 → Embedding生成 → pgvectorで類似Review検索 → Store単位で集計

## 7. AI関連の処理フロー

**意味検索**
```
自然文入力 → Embedding生成 → pgvector検索 → 類似Review取得 → Store単位集計 → 結果表示
```

**企業向け口コミ分析**
```
Store → Reviews取得 → AI分析 → 良い点／改善点 → Dashboard表示
```
MVPではリアルタイム処理 or 簡易キャッシュで対応。大量データ対応は将来課題。

**将来のRAG拡張**（MVP対象外）
```
Document → Chunk → Embedding(pgvector) → Retrieval → LLM回答
```
本格導入時はVector Search + Keyword Search + Metadata Filter + Rerankingの組み合わせ（Hybrid Search）を検討。日本語全文検索が必要になればPostgreSQLの拡張追加を検討。

## 8. ストレージ方針

| 対象 | MVP | 将来 |
|---|---|---|
| プロフィール画像 | Google Loginの画像URLをそのまま利用 | — |
| 店舗画像 | Frontend内の静的アセット | Cloudflare R2等のObject Storageへ移行 |
| 口コミ画像 | 未対応（MVP対象外） | Object Storage、DBにはURL/Keyのみ保持 |

## 9. セキュリティ / 非機能方針

- **認証**：Google OAuth（Better Auth）
- **認可**：Role＋企業所属情報でアクセス制御
- **入力検証**：Zodによる全外部入力のBackend検証
- **通信**：HTTPS（Caddyでリバースプロキシ）
- **投稿保護**：編集・削除時に投稿者IDを照合
- **Pagination**：店舗一覧・口コミ一覧で必須（一括取得しない）
- **Cache**：TanStack Queryでリスト・詳細をキャッシュ、投稿/編集後は再取得
- **Index**：Review→Store／Review→User／Store→Company／UserView関連にIndex。Vector量増加時はpgvectorのVector Index追加を検討

### MVPでは導入しない
Redis／Elasticsearch／Kafka等のMQ／マイクロサービス化／大規模分散DB／複雑なキャッシュ層 — 必要性が確認されてから導入。

## 10. MVP完成条件（動作フロー）

**一般ユーザー**：Login → 店舗一覧 → 店舗詳細 → 口コミ確認 → 口コミ投稿 → 投稿確認

**企業ユーザー**：Login → 企業Dashboard → 自社店舗選択 → 評価確認 → 口コミ確認

**技術チャレンジ（余裕があれば）**：
1. 自然言語入力 → Embedding → pgvector検索 → 関連店舗表示
2. 口コミ → AI分析 → 良い点/改善点 → 企業Dashboard表示

## 11. 将来拡張の全体像

```
口コミ蓄積 → 意味検索 → AI分析 → レコメンド → RAG → 求人応募 → 採用連携
```

Nativeアプリを追加する場合も、既存のHono APIをそのまま利用する設計。
