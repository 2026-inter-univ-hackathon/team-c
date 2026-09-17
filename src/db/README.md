# DB実装メモ

データベーススキーマは `doc/development-design.md` の「6. データモデル / DB設計」に沿っています。

## コマンド

```bash
pnpm run db:generate
pnpm run db:migrate
pnpm run db:seed
pnpm run db:studio
```

`db:generate` は `src/db/schema/index.ts` を読み取り、SQLマイグレーションを `src/db/migrations/` に生成します。

`db:migrate` と `db:seed` を実行するには、PostgreSQL 18 のデータベースを指す `DATABASE_URL` が必要です。実際の接続情報を書いた `.env` はコミットしないでください。

`db:seed` は、ローカルでの画面確認やクエリ実装に使う開発用データを投入します。同じコマンドを複数回実行しても重複しないようにしてあります。また、`NODE_ENV=production` の場合は実行を拒否します。

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
