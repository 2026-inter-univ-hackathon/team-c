# 雰囲気検索

公開口コミを OpenAI Embeddings API でベクトル化し、PostgreSQL の pgvector でコサイン距離検索します。

## 開発環境の準備

1. PostgreSQL 18 に pgvector をインストールします。
2. サーバー専用の `OPENAI_API_KEY` を `.env` に設定します。値をコミットせず、`VITE_` を付けないでください。
3. `pnpm db:migrate` で `vector` 拡張と `review_embeddings` テーブルを作成します。
4. `pnpm db:index-reviews` で既存の公開口コミを索引化します。

CI は `pgvector/pgvector:0.8.6-pg18-trixie` を使用します。開発DBでも PostgreSQL 18 と pgvector 0.8.6 の組み合わせを推奨します。

通常の `db:seed` は外部APIを呼びません。Seed追加後は別途 `db:index-reviews` を実行してください。索引化にはAPI利用料が発生しますが、本文とモデルが変わらない口コミは再送信しません。

## 保存・検索仕様

- モデルは `text-embedding-3-small`、512次元です。
- Embeddingは `review_embeddings.embedding vector(512)` に保存します。
- コサイン距離演算子に対応するHNSW索引を作成します。
- 対象は、ACTIVEかつ未削除の店舗に属する、PUBLISHED・未削除・非表示でない・公開日時ありの口コミです。
- APIへ送る口コミ情報は、公開される総合コメントと構造化された職場属性だけです。ユーザーID、メール、投稿者名、住所、投稿日時は付加しません。
- 検索文は200文字までです。検索文はOpenAIへ送信されるため、UIで個人情報を入力しないよう案内します。
- API呼び出しは15秒でタイムアウトし、1プロセスあたり30リクエスト/分・同時3リクエストに制限します。
- APIキー、検索文、口コミ本文、外部APIの応答本文はログに残しません。
- 類似度0.36未満の候補は除外します。この値は初期値であり、公開前に評価セットで調整が必要です。
- 最大1,000件の近傍口コミ候補をDBから取得し、店舗ごとに最も近い口コミを採用します。
- 一度の索引更新は公開口コミ5,000件を上限とし、超過時は一部だけを黙って索引化せずに失敗させます。超過前にバッチジョブ化してください。

## 運用上の注意

口コミの公開状態は検索SQLでも再確認するため、非表示・削除済みの口コミは結果に出ません。口コミ内容を直接DB編集した場合や、索引処理が失敗した場合は `pnpm db:index-reviews` を再実行してください。

複数インスタンスで運用する場合は、現在のプロセス内レート制限に加え、共有レート制限とAPIプロジェクトの予算上限が必要です。また、公開前に外部送信の内容をプライバシーポリシーへ反映してください。

## 検証項目

- Embedding API応答の型、次元、index整合性、非有限値、ゼロベクトルの拒否
- SQLのパラメータ化と、公開状態・店舗状態・地域・カテゴリ・評価フィルター
- API未設定、索引未作成、API障害時の安全な表示
- pgvectorマイグレーション、HNSW索引、seedのCI検証
- 正確検索とHNSW検索の再現率比較、`EXPLAIN (ANALYZE, BUFFERS)` による性能確認

API仕様: [OpenAI Embeddings](https://developers.openai.com/api/docs/guides/embeddings)

pgvector仕様: [pgvector](https://github.com/pgvector/pgvector)
