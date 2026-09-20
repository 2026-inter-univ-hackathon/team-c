# DB実装メモ

データベーススキーマは `doc/development-design.md` の「6. データモデル / DB設計」に沿っています。

## コマンド

```bash
pnpm run db:generate
pnpm run db:migrate
NODE_ENV=development pnpm run db:seed
pnpm run db:studio
```

`db:generate` は `src/db/schema/index.ts` を読み取り、SQLマイグレーションを `src/db/migrations/` に生成します。

`db:migrate` と `db:seed` を実行するには、PostgreSQL 18 のデータベースを指す `DATABASE_URL` が必要です。実際の接続情報を書いた `.env` はコミットしないでください。

`db:seed` はローカルの開発用DBにのみダミーデータを投入します。`NODE_ENV=development`、`ENABLE_DEV_REVIEW_POSTING=true`、接続先DB名と一致する `DEV_DATABASE_NAME` が必要です。DB名には `dev`、`test`、`local` のいずれかを含め、接続先ホストはローカルに限定します。実行前に `pnpm run db:check-dev` で接続先を確認してください。CIも専用の `baito_honne_test` DBで同じ条件を満たします。

## 現在の実装範囲

このDB基盤に含まれているもの:

- MVPで使うエンティティのDrizzleテーブル定義
- 単一カラム主キーに対するPostgreSQL `uuidv7()` デフォルト値
- ロール、ステータス、評価点、緯度経度、レビュー状態に対するCHECK制約
- 有効なユーザーメール、公開中レビューForm、ユーザーごとの有効レビュー、外部店舗IDに対する部分ユニークインデックス
- ReviewFormをまたいで質問や評価軸が混ざらないようにする複合外部キー
- `DATABASE_URL` が必要になった時点でだけ接続を作るDBクライアントファクトリ
- ローカル確認・クエリ開発用の決定的なSeedデータ

まだ含まれていないもの:

- PostgreSQLコンテナやホスト済みDB環境のセットアップ
- 認証・セッション永続化の実装

公開店舗・レビューのRepositoryとUse Caseは実装済みです。店舗一覧・詳細のServer Functionsと `src/server/db.ts` の `withDb` は、現在の作業ツリーに追加されています。`withDb` は処理ごとに接続を作成し、コールバック終了時には成功・失敗にかかわらず接続を終了します。

- [Repository層メモ](../server/repositories/README.md)
- [Use Case層メモ](../server/use-cases/README.md)
- [実装状況](../../doc/implementation-status.md)

## セキュリティメモ

- DB制約は最後の防御線です。アプリケーション側でも必ず認可を実装してください。
- 公開レビューのレスポンスでは、ユーザーID、メールアドレス、表示名を返さないでください。
- セッショントークンは必ずハッシュ化して保存してください。
- service roleや管理者権限を持つDB接続情報をブラウザ側コードで使わないでください。

## 画面確認用ダミーデータ

`db:seed` で約50店舗と新仕様の口コミ10件を用意します。各口コミには属性、雰囲気・スタッフ層のタグ、4項目評価、短文を設定します。個別の参考画像は追加しません。旧ダミー口コミからの移行は [開発手順](../../doc/review-flow-development.md) に従ってください。

追加店舗はカフェ・コンビニ・教育の3業種、東京・神奈川・埼玉・千葉の10エリアに分散しています。店舗名と本文にデモ・架空の表示を付け、実在店舗への口コミと誤認しないようにしています。住所は架空、メールはexample.comを使用します。

ダミー投稿者5名は固定テストユーザーと分けています。seedの再実行時には固定テストユーザーの投稿を残し、ダミー投稿者の口コミを入れ替えるため、件数は重複しません。対象は確認済みの開発用DBだけにしてください。
