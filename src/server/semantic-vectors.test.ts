import { describe, expect, it } from "vitest";
import {
  documentHash,
  EMBEDDING_DIMENSIONS,
  isValidEmbedding,
} from "./semantic-vectors";

describe("semantic vectors", () => {
  it("validates finite, non-zero vectors with the configured dimensions", () => {
    expect(
      isValidEmbedding([1, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)]),
    ).toBe(true);
    for (const value of [
      [],
      [1],
      Array(EMBEDDING_DIMENSIONS).fill(0),
      [NaN, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)],
      [Infinity, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)],
    ]) {
      expect(isValidEmbedding(value)).toBe(false);
    }
  });

  it("changes the fingerprint when review content changes", () => {
    expect(documentHash("まかないがある")).not.toBe(
      documentHash("まかないがない"),
    );
  });
});
