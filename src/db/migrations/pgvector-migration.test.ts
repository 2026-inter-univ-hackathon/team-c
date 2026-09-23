import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL("./0004_concerned_namorita.sql", import.meta.url),
);
const migration = readFileSync(migrationPath, "utf8");

describe("pgvector migration", () => {
  it("enables pgvector before declaring the vector column", () => {
    expect(
      migration.indexOf("CREATE EXTENSION IF NOT EXISTS vector"),
    ).toBeLessThan(migration.indexOf('"embedding" vector(512)'));
  });

  it("upgrades the paused JSONB implementation without losing valid vectors", () => {
    expect(migration).toContain("format_type(atttypid, atttypmod) = 'jsonb'");
    expect(migration).toContain('USING "embedding"::text::vector(512)');
  });

  it("creates a cosine HNSW index idempotently", () => {
    expect(migration).toContain("CREATE INDEX IF NOT EXISTS");
    expect(migration).toContain("USING hnsw");
    expect(migration).toContain("vector_cosine_ops");
  });
});
