# 実装ガイド

本書は目標とする仕様・構成を含みます。現在の実装範囲と未実装機能は[実装状況](./implementation-status.md)を参照してください。

この文書は、`doc/development-design.md` を実装へ移すときの置き場所と境界を定義する。設計判断の一次情報は `doc/development-design.md` とし、この文書は日々の実装で迷わないための作業ガイドとする。

## 1. ディレクトリ責務

### `src/routes/`

TanStack Router のRoute定義とページ単位の合成を置く。

- URL、loader、Server Function呼び出し、ページレイアウトを担当する
- DB、Drizzle、環境変数、Cookieの詳細を直接扱わない
- 複雑な表示やフォームは `src/features/*` へ切り出す
- RouteからDBを直接操作せず、Server FunctionまたはUse Caseを経由する

### `src/features/`

ユーザーが触る機能ごとのUI、hooks、画面用の整形処理を置く。

| ディレクトリ | 責務 |
|---|---|
| `features/auth/` | テストユーザー選択、ログイン状態表示、ログアウトUI |
| `features/stores/` | 店舗一覧、検索、店舗詳細、店舗カード |
| `features/reviews/` | 口コミ一覧、口コミ投稿フォーム、評価入力、質問回答UI |
| `features/profile/` | 自分の情報、投稿履歴 |
| `features/organizations/` | 組織ダッシュボード、管理店舗、店舗別評価 |

`features` は画面に近い層なので、DBテーブル定義や認可判定を直接importしない。必要なデータは `src/schemas/` のResponse型、またはRoute/Server Functionから渡されたDTOとして扱う。

### `src/components/`

複数featureで使う見た目だけの共通部品を置く。

- Button、Input、Dialog、EmptyStateなどの汎用UI
- ドメイン固有の知識を持たせない
- StoreやReviewの業務判断を含む部品は `features/*` 側に置く

### `src/schemas/`

Zod Schemaと、そこから推論されるRequest/Response型を置く。

- 外部入力、Server Function入力、画面へ返すResponseを検証する
- DB Entityをそのまま画面へ返さず、Response Schemaへ変換する
- `src/db/schema` に依存しない
- ブラウザでも使う可能性があるため、秘密情報やサーバー専用APIをimportしない

### `src/server/use-cases/`

アプリケーションの業務処理を置く。

- 認証済みPrincipal、入力DTO、Repository/DBを受け取り、ユースケースを完結させる
- Zod検証後の値を扱う
- Authorization Policyを呼び、権限不足なら `403` 相当のエラーにする
- Review作成など複数テーブルを更新する処理はTransaction単位で扱う
- RouteやUIに依存しない

例:

- `listStores`
- `getStoreDetail`
- `createReview`
- `updateReview`
- `listMyReviews`
- `listOrganizationStores`

### `src/server/auth/`

認証、Session、Cookieに関する処理を置く。

- `AuthAdapter` は本人確認だけを担当し、Roleや権限を返さない
- Basic認証資格情報は環境変数から読む
- Session Tokenは平文保存せず、DBにはハッシュのみ保存する
- Cookieは `HttpOnly`、`SameSite=Lax` を基本とする

### `src/server/authorization/`

認可ポリシーを置く。

- PlatformRole、OrganizationMembership、Review所有者条件を判定する
- `ACTIVE` なMembershipだけを有効な権限として扱う
- 「ログイン済みなら全データOK」にしない
- 他ユーザーのReview編集、他組織データ閲覧を防ぐテストを追加する

### `src/server/errors/`

Server FunctionとUse Caseで共有するエラー型を置く。

- `UnauthorizedError` -> 401
- `ForbiddenError` -> 403
- `NotFoundError` -> 404
- `ConflictError` -> 409
- 内部エラー詳細やstack traceをユーザー向けResponseへ含めない

### `src/db/schema/`

Drizzleのテーブル定義、relation、DB制約を置く。

- テーブル名とカラム名は `snake_case`
- 単独主キーはPostgreSQL 18の `uuidv7()` をDB側defaultにする
- Unique制約、CHECK制約、部分Indexをここで表現する
- 認可をクライアント側チェックだけに依存しない

### `src/db/migrations/`

Drizzle Kitが生成するMigrationを置く。適用済みMigrationは変更せず、Forward-onlyで運用する。

### `src/db/client.ts`

DB接続とDrizzle Clientを置く。`DATABASE_URL` は `src/server/env.ts` の検証を通す。

### `src/db/seed.ts`

開発・テスト用データ投入を置く。本番環境で実行できないようにする。

### `src/lib/`

ドメインに依存しない小さな共通処理を置く。

- 日付や文字列などの汎用関数
- アプリ情報などの静的メタデータ
- DB、認証、画面状態に依存する処理は置かない

## 2. 依存方向

基本の依存方向は次の通り。

```text
routes -> features -> schemas/lib
routes -> server functions -> use-cases -> db
use-cases -> authorization/auth/errors/schemas
```

禁止する依存:

- `features/*` -> `db/*`
- `components/*` -> `server/*` / `db/*`
- `schemas/*` -> `db/*` / `server/*`
- `routes/*` -> `db/*` の直接操作

## 3. `src/server/use-cases`, `src/schemas`, `src/db/schema` の使い分け

| 場所 | 置くもの | 置かないもの |
|---|---|---|
| `src/schemas/` | Zod Schema、Request/Response型、入力境界の検証 | DB接続、Cookie、権限判定 |
| `src/server/use-cases/` | 業務処理、Transaction、認可呼び出し、EntityからResponseへの変換 | JSX、DOM、Route固有処理 |
| `src/db/schema/` | Drizzleテーブル、relation、DB制約、Index | 画面表示用ラベル、Use Case固有の分岐 |

例: 口コミ投稿

```text
Review投稿フォーム
  -> createReviewInputSchema で入力検証
  -> createReview Use Case で認可・Transaction・整合性検証
  -> reviews / review_answers / review_ratings のDB制約で最終防御
  -> reviewResponseSchema の形で画面へ返す
```

## 4. 旧 `legacy/index.html` から移植する範囲

旧プロトタイプは参考実装として残し、DOM操作やlocalStorage中心の構造はそのまま移植しない。

### 移植するもの

- 店舗一覧の情報設計
- 評価軸の表示
- 重視項目チップによる並び替え
- 店舗カードの展開詳細
- 口コミ一覧の見せ方
- 勤続期間に応じた参考度表示
- 求職者が最後に判断する「気になる / 見送る」の考え方

### そのまま移植しないもの

- `innerHTML` でHTML文字列を組み立てる実装
- グローバル変数に全状態を持つ実装
- `localStorage` を永続データの正とする設計
- `app-data` に全データを詰め込む形式
- DOMの `addEventListener` に画面ロジックを集中させる構造

Reactでは、表示はComponent、状態は必要最小限のhook、永続データはServer Function/Use Case経由へ移す。

## 5. 移植順序

### Phase 1: 読み取り専用の店舗一覧

- デモデータをTypeScriptのfixtureへ移す
- Store CardをReact Component化する
- 評価軸と重み付き平均を純粋関数に分離する
- チップ選択による並び替えを実装する
- DB、認証、投稿機能はまだ入れない

### Phase 2: 店舗詳細と口コミ一覧

- 店舗カード展開または詳細Routeを実装する
- 評価内訳、事実情報、口コミ一覧を表示する
- 公開表示にUser ID、Email、表示名を含めないResponse形を先に固定する

### Phase 3: 口コミ投稿フォーム

- ReviewForm / Question / RatingDimensionの型とZod Schemaを作る
- Step形式の投稿UIを作る
- 投稿Use CaseはDB導入後に接続する

### Phase 4: Server Function / DB接続

- Drizzle SchemaとMigrationを作る
- Store一覧、Store詳細、Review一覧をServer Function化する
- Zod検証、認可、Use Case、DB制約を通す

### Phase 5: 認証・認可

- Basic認証とSessionを実装する
- Authorization Policyを実装する
- 他ユーザーや他組織のデータへアクセスできないテストを追加する

## 6. セキュリティ上の注意

- 外部入力は必ずZodで検証する
- LLM出力やlegacyデータも信頼済みとして扱わない
- 公開ResponseにUser ID、Email、表示名を含めない
- 認証済みであることと権限があることを分ける
- Basic認証のユーザー名・パスワード、Session Secret、DB URLをコミットしない
- 詳細な内部エラーやstack traceを画面/API Responseへ返さない
- `innerHTML` / `dangerouslySetInnerHTML` は原則使わない

## 7. 次のPR候補

次のPRでは、`feature/store-list-ui` のようなブランチを切り、Phase 1だけを実装するのがよい。

完了条件:

- 旧プロトタイプ相当の店舗一覧がReactで表示される
- デモデータとスコア計算が型付きで分離されている
- `pnpm run lint`
- `pnpm run format`
- `pnpm run typecheck`
- `pnpm run test`
- `pnpm run build`
