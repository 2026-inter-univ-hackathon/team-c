import { withDb } from "../server/db";
import { indexReviewEmbeddings } from "../server/index-review-embeddings";

try {
  const summary = await withDb((db) => indexReviewEmbeddings(db));
  console.log("Review embedding index updated", summary);
} catch {
  console.error(
    "口コミの索引更新に失敗しました。DB接続、OPENAI_API_KEY、API利用上限を確認して再実行してください。",
  );
  process.exitCode = 1;
}
