/** 同じユーザーが同じ店舗へ2件目のレビューを投稿しようとしたときのエラー。 */
export class DuplicateReviewError extends Error {
  constructor() {
    super("This user already has a review for the store");
    this.name = "DuplicateReviewError";
  }
}

/**
 * PostgreSQLの一意制約違反かどうかを判定する。
 * Drizzleは元のエラーを DrizzleQueryError で包むため、cause を辿って探す。
 */
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  let current: unknown = error;

  for (let depth = 0; current !== null && depth < 5; depth += 1) {
    if (typeof current !== "object") {
      return false;
    }

    const candidate = current as {
      code?: unknown;
      constraint_name?: unknown;
      cause?: unknown;
    };

    if (
      candidate.code === "23505" &&
      candidate.constraint_name === constraint
    ) {
      return true;
    }

    current = candidate.cause ?? null;
  }

  return false;
}
