# アルバイト口コミWebアプリ 基本設計

## 1. システム構成

```
Browser → TanStack Start（UI / Server Functions / Server Routes）→ PostgreSQL
```

MVPは単一のTypeScriptアプリとして構築する。画面から使う処理はServer Functions、外部クライアントにも公開する必要が生じた処理はServer Routesに置き、不要なレイヤーを増やさない。

## 2. 技術スタック

| レイヤー | 技術 | 採用理由 |
|---|---|---|
| Full-stack | TanStack Start / React / TypeScript | UIとサーバー処理を1つの型安全なアプリに集約 |
| TanStack | Router / Query / Form | ルーティング、非同期データ、フォームを統一 |
| UI | Tailwind CSS / shadcn/ui | 短期間でレスポンシブUIを構築しやすい |
| Validation | Zod | Server Functionsを含む全外部入力を実行時検証 |
| DB | PostgreSQL / Drizzle ORM | スキーマとDBアクセスをTypeScriptで管理 |
| Auth（初期） | HTTP Basic認証＋固定テストユーザー | 機能開発中のアクセス制限と権限確認に限定 |
| Test | Vitest / Playwright | ロジックと主要ユーザーフローを検証 |
| Tooling | pnpm / ESLint / Prettier | 一般的な構成に統一し保守しやすくする |

デプロイ構成、AI API、Embedding、pgvectorは初期スコープに含めない。

## 3. ユーザー種別と権限

| 機能 | USER | COMPANY | ADMIN |
|---|:---:|:---:|:---:|
| 店舗検索・閲覧 | ○ | ○ | ○ |
| 口コミ閲覧 | ○ | ○ | ○ |
| 口コミ投稿・編集 | ○ | × | ○ |
| 企業ダッシュボード・店舗分析 | × | ○ | ○ |
| 管理機能 | × | × | ○ |

企業ユーザーは自社に紐づく店舗データのみアクセス可能。ADMIN機能はMVPでは最小限。

### 認証・認可設計

認証（本人確認）と認可（操作権限）を分離する。Routeや業務ロジックからBasic認証を直接参照せず、必ず共通の認証サービスを経由する。

```ts
type AuthenticatedUser = {
  userId: string
  role: "USER" | "COMPANY" | "ADMIN"
}

interface AuthAdapter {
  authenticate(request: Request): Promise<AuthenticatedUser | null>
}
```

初期実装では`BasicAuthAdapter`を使用する。Basic認証を通過した後、開発用の固定ユーザーを選択し、その`userId`と`role`を`AuthenticatedUser`として返す。Basic認証のユーザー名を口コミ投稿者IDとして使用しない。

将来は`GoogleAuthAdapter`等を追加し、環境設定で利用するAdapterを切り替える。Google等の外部IDはアプリ内のUserへ紐づけ、ReviewやCompanyMemberは常にアプリ内の`userId`を参照する。

```text
Request → AuthAdapter → AuthenticatedUser → Authorization Policy → Use Case
              │
              ├─ BasicAuthAdapter（初期）
              └─ GoogleAuthAdapter（将来）
```

認可判定はAdapterに持たせず、共通のAuthorization Policyで行う。

- 未認証は`401 Unauthorized`
- 認証済みだが権限不足の場合は`403 Forbidden`
- Reviewの編集・削除は`review.userId === currentUser.userId`またはADMIN
- 企業向けデータはCompanyMemberによる所属確認を必須とする
- Basic認証は開発環境限定とし、資格情報は環境変数で管理する

## 4. 画面構成・遷移

**一般ユーザー**：ホーム →（検索）→ 店舗一覧 → 店舗詳細 →（口コミ閲覧／投稿）、プロフィール → 投稿履歴

**企業ユーザー**：Login → 企業Dashboard → 管理店舗一覧 → 店舗分析 → 口コミ詳細

**共通**：Basic認証 → テストユーザー選択／エラー／403／404

### 口コミ投稿はStep形式（一度に全項目を出さない）
```
Step1 勤務情報 → Step2 5段階評価 → Step3 リアルな質問 → Step4 総合コメント → 確認 → 投稿
```
進捗表示（例：3/4）を画面上部に設置。

## 5. データモデル

### 主要Entity
```
Company ── Store ── Review
Company ── CompanyMember ── User
User ── Review / ReviewLike / UserView
User ── AuthIdentity
```

| Entity | 概要 |
|---|---|
| User | アプリ内識別子・名前・Email・プロフィール画像・Role。認証方式に依存しない |
| AuthIdentity | Userと認証元を結ぶ情報（Provider・Provider側ID）。外部認証導入時に使用 |
| Company | 企業識別子・企業名 |
| CompanyMember | User⇔Companyの所属関係（中間テーブル、複数企業/Role対応） |
| Store | 店舗識別子・所属企業・店舗名・業種・所在地 |
| Review | 投稿者・店舗・5段階評価・勤務情報・自由記述質問群・一言コメント |
| UserView | 店舗閲覧履歴（将来のレコメンド用） |

## 6. サーバー処理構成（Resource単位）

```
/auth  /stores  /reviews  /users  /companies  /search
```

- アプリ画面からの呼び出しはTanStack StartのServer Functionsを使う
- 外部公開が必要な処理だけServer Routesとして実装する
- **Store**：一覧／詳細／店舗ごとの口コミ取得
- **Review**：投稿／編集／削除／取得（編集・削除は投稿者本人 or 管理者のみ）
- **Search**：店舗名・業種・エリア・評価による通常検索

## 7. 将来機能の扱い

AI検索・口コミ分析・Embeddingは初期実装に含めない。口コミと検索条件のデータ構造を先に安定させ、必要性を確認してから別途設計する。

## 8. ストレージ方針

| 対象 | MVP | 将来 |
|---|---|---|
| プロフィール画像 | Google Loginの画像URLをそのまま利用 | — |
| 店舗画像 | Frontend内の静的アセット | Cloudflare R2等のObject Storageへ移行 |
| 口コミ画像 | 未対応（MVP対象外） | Object Storage、DBにはURL/Keyのみ保持 |

## 9. セキュリティ / 非機能方針

- **認証**：初期は開発環境限定のBasic認証。業務コードはAuthAdapter経由で認証結果を取得
- **認可**：認証方式から独立したRole＋企業所属情報でアクセス制御
- **入力検証**：Zodによる全外部入力のサーバー側検証
- **通信**：ローカル開発環境に限定。本番通信方式はデプロイ設計時に決定
- **投稿保護**：編集・削除時に投稿者IDを照合
- **Pagination**：店舗一覧・口コミ一覧で必須（一括取得しない）
- **Cache**：TanStack Queryでリスト・詳細をキャッシュ、投稿/編集後は再取得
- **Index**：Review→Store／Review→User／Store→Company／CompanyMember関連にIndex

### MVPでは導入しない
外部OAuth／AI API／pgvector／Redis／Elasticsearch／Kafka等のMQ／マイクロサービス化／複雑なキャッシュ層 — 必要性が確認されてから導入する。

## 10. MVP完成条件（動作フロー）

**一般ユーザー**：Basic認証 → USER選択 → 店舗一覧 → 店舗詳細 → 口コミ確認 → 口コミ投稿 → 投稿確認

**企業ユーザー**：Basic認証 → COMPANY選択 → 企業Dashboard → 自社店舗選択 → 評価確認 → 口コミ確認

**認証の交換可能性**：業務ロジックを変更せず、AuthAdapterの差し替えで外部認証を追加できる。

## 11. 将来拡張の全体像

```
口コミ蓄積 → 意味検索 → AI分析 → レコメンド → RAG → 求人応募 → 採用連携
```

外部クライアントが必要になった場合は、既存ユースケースをTanStack StartのServer Routesから公開する。
