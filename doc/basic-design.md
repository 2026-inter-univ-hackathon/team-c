# アルバイト口コミWebアプリ 基本設計

更新日: 2026-09-23

本書は現在のMVP構成を示します。未実装の認証・組織管理・AI機能は「将来設計」として区別します。詳細なDB定義は[開発設計書](./development-design.md)、実装済み範囲は[実装状況](./implementation-status.md)を参照してください。

## 1. システム構成

```text
Browser
  → TanStack Start Routes / React UI
  → Server Functions
  → Use Cases
  → Repositories / Drizzle ORM
  → PostgreSQL 18
```

単一のTypeScriptアプリとして構築し、独立したBackendやモノレポは設けません。画面からの読み取り・更新はServer Functionsを通し、Use CaseとRepositoryへ責務を分けます。現在、外部向けAPIやServer Routesはありません。

## 2. 現在の技術スタック

| レイヤー | 技術 |
| --- | --- |
| Runtime / Package manager | Node.js 24 / pnpm 11 |
| Full-stack | TanStack Start / React / TypeScript |
| Routing | TanStack Router |
| UI | Tailwind CSS / プロジェクト固有CSS |
| 状態 | Routeのsearch params、React hooks、`localStorage` |
| Validation | Zod |
| DB | PostgreSQL 18 / Drizzle ORM / postgres.js |
| Test | Vitest |
| Tooling | ESLint / Prettier / GitHub Actions |
| Deployment | self-hosted runner / Nginx / systemd |

TanStack Query、TanStack Form、shadcn/ui、Playwrightは依存関係または実装へ導入していません。外部AI API、Embedding、pgvectorも使用していません。

## 3. 画面構成

```text
ホーム
  ├─ 店舗一覧 → 店舗詳細 → 口コミ閲覧
  │                         └─ 開発環境限定の口コミ投稿
  └─ このブラウザに保存した職場

共通案内
  ├─ ガイドライン
  ├─ 利用規約
  ├─ プライバシーポリシー
  ├─ 運営者情報
  └─ お問い合わせ・削除依頼
```

## 4. 投稿フロー

```text
Step 1 属性
  → Step 2 職場の特徴
  → Step 3 4項目評価とおすすめ度
  → Step 4 生の声
  → Step 5 公開プレビュー・同意
  → サーバー検証・保存
```

戻る操作で入力を保持します。各ステップで利用者へエラーを示し、最終送信ではZod、Use Case、DB制約で再検証します。口コミ、回答、評価は1つのトランザクションで保存します。

## 5. データモデル

```text
Organization ── Store ── Review ── ReviewReaction
Organization ── OrganizationMembership ── User
User ── AuthAccount / Session / Review
ReviewForm ── ReviewQuestion ── ReviewAnswer
ReviewForm ── ReviewFormRatingDimension ── RatingDimension
RatingDimension ── ReviewRating
Store ── StoreCategory ── Category
```

認証・組織関連テーブルは将来拡張を壊さないためスキーマにありますが、認証フローと組織向け画面は未実装です。現在の投稿・リアクションはサーバー内で固定した開発用Userを使います。

## 6. 公開境界

- 有効な店舗と `PUBLISHED` の新形式口コミだけを返す。
- 内部ユーザーID、Email、正確な投稿日、同意日時を公開しない。
- 公開口コミが5件未満の店舗では属性を粗くし、勤務期間を公開せず、投稿日を年月までに丸める。
- 5件以上では詳細属性を表示し、投稿日を日本時間の上旬・中旬・下旬へ丸める。
- 自由記述はReactのテキストとして描画し、HTMLとして解釈しない。
- 検索SQLへユーザー入力を文字列連結しない。

## 7. 認証・認可の現在地

認証、Session、Authorization Policyは未実装です。そのため、一般公開環境では口コミ投稿とリアクションを受け付けません。

開発用の更新操作は、次をすべて満たす場合だけ許可します。

- `NODE_ENV=development`
- `ENABLE_DEV_REVIEW_POSTING=true`
- `DATABASE_URL` のホストがlocalhost
- 接続先DB名が `DEV_DATABASE_NAME` と一致
- DB名に `dev`、`test`、`local` のいずれかを含む

この制限は認証の代替ではなく、開発中の誤操作防止です。将来認証を導入するときは、本人確認と操作権限を分離し、投稿者本人・Platform Role・Organization MembershipをUse Caseで検証します。

## 8. 集計と保存

- 口コミ総合点は4評価の算術平均。
- 店舗の評価軸別・総合点は勤続期間と在籍状況を掛け合わせた重み付き平均。
- 評価順は口コミが少ない店舗を全体平均へ寄せるベイズ補正値を使用し、画面には重み付き総合点を表示。
- おすすめ度は点数へ含めない。
- ブラウザの「気になる」は店舗IDだけを `localStorage` に保存し、サーバー上のUserとは結び付けない。
- 口コミリアクションはDBへ保存するが、開発用固定Userだけが更新できる。

## 9. 品質と運用

- Vitestで入力境界、公開条件、集計、投稿、リアクション、保存データの検証を行う。
- CIでTest、Lint、Format、Typecheck、Build、DBマイグレーション、seed、依存監査を行う。
- CIに成功した最新の `main` だけを開発デモへ反映する。
- デプロイ前にDBをバックアップし、起動確認に失敗した場合は直前のコードへ戻す。

## 10. 将来設計

- 一般ユーザー認証とSession
- 投稿者本人、Platform Role、Organization Membershipに基づく認可
- 口コミ編集・削除、通報、プロフィール、組織ダッシュボード
- アカウント単位のお気に入り
- 必要性と安全性を検証したうえでのAI要約・自然言語検索

将来AI機能を追加しても、元口コミの表示、利用者の最終判断、外部操作の明示的な承認を維持します。
