# Repository層メモ

Repository層はDBからデータを取得する責務だけを持ちます。認可判断やユーザーごとの権限チェックはUse Case層で行います。

## 公開Queryのルール

- `select *` は使わず、返すカラムを明示する
- 公開店舗は `stores.status = 'ACTIVE'` かつ `stores.deleted_at is null` のみ返す
- 公開レビューは `reviews.status = 'PUBLISHED'` かつ `reviews.deleted_at is null` かつ `reviews.published_at is not null` のみ返す
- 公開レスポンスでは `user_id`、メールアドレス、表示名、認証アカウント、セッション情報を返さない
- 一覧系Queryには `limit` と `offset` を使い、並び順を固定する

## 現在の公開Repository

`public-stores.ts` では以下を提供しています。

- `listPublicStores(db, options)`
- `getPublicStoreById(db, storeId)`
- `listPublicReviewsByStoreId(db, storeId, options)`
