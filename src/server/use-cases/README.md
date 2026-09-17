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

公開データだけを扱うため、現時点ではユーザー認可はありません。今後、投稿・編集・管理者操作を追加するときは、Use Case層でログインユーザーと権限を検証します。
