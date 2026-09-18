# Repository層メモ

Repository層はDBからデータを取得する責務だけを持ちます。認可判断やユーザーごとの権限チェックはUse Case層で行います。

## 公開Queryのルール

- `select *` は使わず、返すカラムを明示する
- 公開店舗は `stores.status = 'ACTIVE'` かつ `stores.deleted_at is null` のみ返す
- 公開レビューは `reviews.status = 'PUBLISHED'` かつ `reviews.deleted_at is null` かつ `reviews.hidden_at is null` かつ `reviews.published_at is not null` のみ返す
- 公開レスポンスでは `user_id`、メールアドレス、表示名、認証アカウント、セッション情報を返さない
- 一覧系Queryには `limit` と `offset` を使い、並び順を固定する

## 現在の公開Repository

`public-stores.ts` では以下を提供しています。

- `listPublicStores(db, options)`
- `getPublicStoreById(db, storeId)`
- `listPublicReviewsByStoreId(db, storeId, options)`

一覧取得は既定20件、最大50件です。店舗は名前・IDの昇順、レビューは公開日時・IDの降順に並べます。店舗詳細とレビュー一覧も、有効かつ未削除の店舗を対象にします。

## 作業ツリーに追加されている集計

2026-09-17時点では、店舗一覧・詳細にレビュー件数、平均評価、最新レビューからの抜粋を追加しています。詳細には有効な評価軸ごとの平均も返します。詳細レスポンスには住所を含めますが、緯度・経度は含めません。

平均は評価点の単純平均を小数第1位に丸めた値で、勤続期間による重み付けはありません。評価がない場合は `null` です。全体平均では無効な評価軸の点数も集計対象になる一方、評価軸別サマリーは有効な評価軸のみ表示します。この扱いは今後の確認事項です。

集計対象の公開レビューと評価を取得してアプリ側で計算するため、店舗一覧の件数制限だけでは集計対象行数を制限できません。データ増加時の負荷と集計テストは未検証です。
