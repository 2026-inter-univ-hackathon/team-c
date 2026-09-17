# Use Case層メモ

Use Case層は、UIやServer Functionから呼ばれるアプリケーション処理の入口です。Repositoryを直接UIから呼ばず、Use Caseを挟んで入力検証や認可判断を集約します。

## 責務

- 外部から来る入力を検証する
- 必要な認可判断を行う
- Repositoryを呼び出す
- UIやServer Functionに返す値の単位を決める

DBのJOINや集計の詳細はRepository層に置きます。

## 現在の公開店舗Use Case

`stores/public-stores.ts` では以下を提供しています。

- `listPublicStoresUseCase(db, input)`
- `getPublicStoreDetailUseCase(db, input)`
- `listPublicStoreReviewsUseCase(db, input)`

店舗IDはUUIDとして検証します。一覧の `limit` / `offset` は数値文字列を数値に変換し、有限値であることを検証します。件数上限や負数の補正はRepository層が担当します。存在しない店舗の詳細は `null` を返します。

現在の単体テストは、一覧パラメータの変換、不正UUIDの拒否、検証後のRepository呼び出しを確認しています。実DBの公開範囲や認可を検証するテストではありません。

公開データだけを扱うため、現時点ではユーザー認可はありません。今後、投稿・編集・管理者操作を追加するときは、Use Case層でログインユーザーと権限を検証します。
