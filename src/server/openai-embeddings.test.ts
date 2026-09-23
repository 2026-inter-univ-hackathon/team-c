import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./semantic-vectors";

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("OPENAI_API_KEY", "test-placeholder");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const row = (index: number) => ({
  index,
  embedding: [1, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)],
});

it("uses the fixed API endpoint and orders validated vectors by input index", async () => {
  const request = vi
    .fn()
    .mockResolvedValue(
      Response.json({ model: EMBEDDING_MODEL, data: [row(1), row(0)] }),
    );
  const { embedTexts } = await import("./openai-embeddings");
  expect(
    await embedTexts(["店長が優しい", "学校と両立しやすい"], request),
  ).toHaveLength(2);
  expect(request.mock.calls[0][0]).toBe("https://api.openai.com/v1/embeddings");
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({
    model: EMBEDDING_MODEL,
    dimensions: EMBEDDING_DIMENSIONS,
    encoding_format: "float",
    input: ["店長が優しい", "学校と両立しやすい"],
  });
});

it("does not call the API for missing configuration or oversized input", async () => {
  const request = vi.fn();
  const { embedTexts } = await import("./openai-embeddings");
  await expect(embedTexts(["a".repeat(2001)], request)).rejects.toThrow();
  vi.stubEnv("OPENAI_API_KEY", "");
  await expect(embedTexts(["hello"], request)).rejects.toThrow();
  expect(request).not.toHaveBeenCalled();
});

it.each([
  { data: [row(0), row(0)] },
  { data: [{ index: 0, embedding: [1] }] },
  { data: [row(4)] },
  { data: [{ index: 0, embedding: Array(EMBEDDING_DIMENSIONS).fill(0) }] },
])("rejects malformed API output", async ({ data }) => {
  const { embedTexts } = await import("./openai-embeddings");
  const request = vi
    .fn()
    .mockResolvedValue(Response.json({ model: EMBEDDING_MODEL, data }));
  await expect(embedTexts(["hello"], request)).rejects.toThrow();
});

it("does not include API response details in errors", async () => {
  const { embedTexts } = await import("./openai-embeddings");
  const request = vi
    .fn()
    .mockResolvedValue(new Response("sensitive details", { status: 429 }));
  await expect(embedTexts(["hello"], request)).rejects.toThrow(
    "Embedding service unavailable",
  );
});

it("coalesces concurrent repeated queries and caches successful vectors", async () => {
  const request = vi
    .fn()
    .mockResolvedValue(
      Response.json({ model: EMBEDDING_MODEL, data: [row(0)] }),
    );
  vi.stubGlobal("fetch", request);
  const { embedSearchQuery } = await import("./openai-embeddings");
  await Promise.all([
    embedSearchQuery("店長が優しい"),
    embedSearchQuery("店長が優しい"),
  ]);
  await embedSearchQuery("店長が優しい");
  expect(request).toHaveBeenCalledTimes(1);
});
