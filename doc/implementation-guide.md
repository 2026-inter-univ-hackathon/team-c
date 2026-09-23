# 実装ガイド

更新日: 2026-09-23

本書は現在のディレクトリ構成と依存境界を示します。過去の移植Phaseではなく、今後の変更で守る実装規約です。現在の機能範囲は[実装状況](./implementation-status.md)、データ設計は[開発設計書](./development-design.md)を参照してください。

## 1. ディレクトリ責務

### `src/routes/`

TanStack RouterのRoute、loader、Server Function、ページ単位の合成を置きます。

- URLとsearch paramsを検証する。
- DBへ直接アクセスせず、Use Caseを呼ぶServer Functionを境界にする。
- 利用者向けには汎用エラーを返し、内部例外やstack traceを公開しない。
- ページ固有の小規模な状態はRoute内に置き、再利用する表示は `features` や `components` へ切り出す。

口コミ投稿画面は現時点でRoute内にあります。分割する場合も、入力SchemaとServer Functionの境界を変えずに行います。

### `src/features/stores/`

現在の主要featureです。

- 検索フォーム
- 店舗カードと店舗詳細用表示
- 共通口コミカード
- `localStorage` を使う「気になる」保存
- 保存結果のフィードバック

DBテーブルやサーバー専用モジュールを直接importしません。

### `src/components/`

Button、Dialog、Pagination、Icon、共通SiteShell等、複数画面で使う表示部品を置きます。認可やDB更新などの業務判断は持たせません。

### `src/schemas/`

ブラウザとサーバーで共有するZod Schema、許可値、Request型を置きます。

- 検索条件、口コミ投稿、リアクション等の外部入力を検証する。
- 許可リスト、型、文字数、配列件数、重複をここで制限する。
- DB接続、秘密情報、Node.js専用処理へ依存しない。

### `src/server/use-cases/`

検索、公開店舗取得、口コミ作成、リアクション等の業務処理を置きます。

- Repositoryの具体的なSQLから独立させる。
- 入力をZodで検証する。
- 投稿者IDや集計値をクライアントから信用しない。
- 複数テーブルの更新はRepositoryのトランザクションへまとめる。

### `src/server/repositories/`

Drizzleを使った読み取り、保存、集計を置きます。

- SQLへユーザー入力を文字列連結しない。
- 公開対象のstatusと削除状態を必ず絞り込む。
- 公開DTOへ内部ユーザーID、Email、正確な日時、同意日時を含めない。
- 検索、ページング、並べ替えをDB側で行う。

### `src/server/dev-review-access.ts`

認証導入前の投稿・リアクションを開発環境へ限定するガードです。`NODE_ENV`、明示フラグ、localhost、DB名の一致をすべて検証します。これは本人確認や認可ではありません。

### `src/server/errors/`

Use CaseとRouteで共有する業務エラーを置きます。重複投稿等の想定可能な失敗だけを識別し、予期しない内部エラーは公開レスポンスへ展開しません。

### `src/db/schema/`

Drizzleテーブル、外部キー、一意制約、CHECK制約、Indexを置きます。

- 単独主キーはPostgreSQL 18の `uuidv7()` をDB側defaultにする。
- 1ユーザー・1店舗、評価1〜5、口コミ30〜300文字等をDBでも守る。
- 公開済みのMigrationを直接書き換えず、Forward-onlyで追加する。

### `src/db/`

- `client.ts`: DB接続
- `seed.ts`: 開発用初期データ
- `check-dev-db.ts`: 接続先の安全確認
- `prepare-review-flow.ts`: 旧ダミー口コミの確認・削除
- `reset-test-reviews.ts`: 固定テストユーザーの口コミだけを確認・削除
- `migrations/`: Drizzle Migration

DBを変更するスクリプトは、対象DBと明示フラグを確認し、既定では読み取り専用または確認モードにします。

## 2. 依存方向

```text
routes / components / features
              ↓
           schemas / lib

routes の Server Function
              ↓
          use-cases
              ↓
         repositories
              ↓
          db / Drizzle
```

禁止する依存:

- `features/*` または `components/*` から `db/*` を直接importする。
- `schemas/*` から `server/*` や秘密情報へ依存する。
- RouteのUIコードからRepositoryやDrizzleを直接呼ぶ。
- RepositoryのDB Entityをそのまま公開レスポンスとして返す。

## 3. 変更時の確認

### UI・表示

- PC、スマートフォン、キーボード、フォーカス表示を確認する。
- 長い店舗名、0件、未評価、長い口コミで崩れないことを確認する。
- `dangerouslySetInnerHTML` や未サニタイズHTMLを使わない。
- favicon、画像、manifest等の静的アセットは `public/`、バンドルする画面画像は `img/` に置く。

### 検索・公開処理

- 未知のsort、範囲外の評価・ページ、不正UUIDを拒否または安全な既定値へ戻す。
- 非公開、非表示、削除済みデータが一覧・詳細・保存一覧へ混入しないことを確認する。
- 同順位の並び順を固定し、ページ間の重複・欠落を防ぐ。

### 投稿・リアクション

- UIの検証だけに依存せず、Schema、Use Case、DB制約で防御する。
- 開発環境ガードをServer Functionより内側のUse Caseでも確認する。
- 他のUser ID、総合点、同意日時をリクエストから受け取らない。
- 失敗時に部分データを残さず、内部詳細を利用者へ返さない。

### DB・依存関係

- Migrationを空のPostgreSQL 18へ適用する。
- seedを2回実行して重複しないことを確認する。
- `pnpm db:generate` 後に意図しない差分がないことを確認する。
- 新しい依存関係は必要性、公開元、更新状況、install script、ライセンス、既知脆弱性を確認してから追加する。

## 4. 自動検証

```bash
pnpm run test
pnpm run lint
pnpm run format
pnpm run typecheck
pnpm run build
```

CIは上記に加え、Migration、seed再実行、Drizzleスキーマ差分、`pnpm audit --audit-level high` を確認します。E2Eテストは未導入なので、主要動線は手動でも確認します。

## 5. 今後の大きな変更

認証、Session、口コミ編集・削除、組織管理、AI機能は未実装です。これらを追加するときは既存の開発用固定Userを一般公開へ流用せず、認証と認可を分け、他ユーザー・他組織のデータへアクセスできないテストを先に定義します。
