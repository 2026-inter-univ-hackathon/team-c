import { DEV_REVIEW_USER_ID } from "../schemas/review-flow";

export { DEV_REVIEW_USER_ID };

export function isDevReviewPostingEnabled(env: NodeJS.ProcessEnv): boolean {
  if (
    env.NODE_ENV !== "development" ||
    env.ENABLE_DEV_REVIEW_POSTING !== "true"
  )
    return false;
  if (!env.DATABASE_URL || !env.DEV_DATABASE_NAME) return false;
  try {
    const url = new URL(env.DATABASE_URL);
    const name = decodeURIComponent(url.pathname.slice(1));
    return (
      (url.hostname === "localhost" ||
        url.hostname === "127.0.0.1" ||
        url.hostname === "[::1]") &&
      name === env.DEV_DATABASE_NAME &&
      /(?:dev|test|local)/i.test(name)
    );
  } catch {
    return false;
  }
}

export function assertDevReviewPostingEnabled(env: NodeJS.ProcessEnv) {
  if (!isDevReviewPostingEnabled(env)) {
    throw new Error("投稿は開発環境でのみ利用できます");
  }
}
