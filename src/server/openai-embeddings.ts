import { z } from "zod";
import {
  documentHash,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  isValidEmbedding,
  MAX_DOCUMENT_CHARS,
  MAX_INDEX_BATCH,
} from "./semantic-vectors";

const responseSchema = z.object({
  model: z.literal(EMBEDDING_MODEL),
  data: z.array(
    z.object({
      index: z.number().int().nonnegative(),
      embedding: z.array(z.number().finite()).length(EMBEDDING_DIMENSIONS),
    }),
  ),
});

let windowStart = 0;
let requests = 0;
let active = 0;

export async function embedTexts(
  input: string[],
  request: typeof fetch = fetch,
) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Embeddings are not configured");
  if (
    input.length < 1 ||
    input.length > MAX_INDEX_BATCH ||
    input.some((text) => !text.trim() || text.length > MAX_DOCUMENT_CHARS)
  ) {
    throw new Error("Invalid embedding input");
  }

  const now = Date.now();
  if (now - windowStart >= 60_000) {
    windowStart = now;
    requests = 0;
  }
  if (requests >= 30 || active >= 3) {
    throw new Error("Embedding request limit reached");
  }
  requests++;
  active++;
  try {
    const response = await request("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        encoding_format: "float",
        input,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error("Embedding service unavailable");

    const result = responseSchema.parse(await response.json());
    if (
      result.data.length !== input.length ||
      new Set(result.data.map((row) => row.index)).size !== input.length ||
      result.data.some(
        (row) => row.index >= input.length || !isValidEmbedding(row.embedding),
      )
    ) {
      throw new Error("Invalid embedding response");
    }
    return result.data
      .sort((a, b) => a.index - b.index)
      .map((row) => row.embedding);
  } finally {
    active--;
  }
}

const cache = new Map<string, { vector: number[]; expires: number }>();
const pending = new Map<string, Promise<number[]>>();

export async function embedSearchQuery(text: string) {
  const hash = documentHash(text);
  const cached = cache.get(hash);
  if (cached && cached.expires > Date.now()) return cached.vector;
  const existing = pending.get(hash);
  if (existing) return existing;

  const task = embedTexts([text])
    .then(([vector]) => {
      if (cache.size >= 100) cache.delete(cache.keys().next().value!);
      cache.set(hash, { vector, expires: Date.now() + 10 * 60_000 });
      return vector;
    })
    .finally(() => pending.delete(hash));
  pending.set(hash, task);
  return task;
}
