import { createHash } from "node:crypto";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 512;
export const MAX_DOCUMENT_CHARS = 2000;
export const MAX_INDEX_BATCH = 16;
export const MAX_INDEX_REVIEWS = 5000;
export const MAX_SEMANTIC_CANDIDATES = 1000;
export const MIN_SIMILARITY = 0.36;

export function documentHash(text: string) {
  return createHash("sha256").update(text).digest("hex");
}

export function isValidEmbedding(value: number[]) {
  return (
    value.length === EMBEDDING_DIMENSIONS &&
    value.every(Number.isFinite) &&
    value.some((item) => item !== 0)
  );
}
