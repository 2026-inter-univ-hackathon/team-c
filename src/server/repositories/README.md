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

平均は勤続期間と在籍状況で重み付けし、小数第1位に丸めた値です。評価順にはレビュー件数の少ない店舗を全体平均へ補正するベイジアン平均を使います。評価がない場合は `null` です。4項目がそろわない口コミや、非公開・削除・非表示の口コミは集計対象外です。

集計値は `stores` に永続化し、口コミの作成と同じトランザクションで更新します。店舗一覧・評価順ソート・最低評価フィルターは集計済みカラムを参照し、評価順には `bayesian_score` のインデックスを使用します。
