import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createPostgresClient } from "./client";
if (existsSync(".env")) loadEnvFile(".env");
const raw = process.env.DATABASE_URL;
if (!raw) {
  console.log("DATABASE_URL is not configured");
  process.exit(0);
}
const url = new URL(raw);
const name = decodeURIComponent(url.pathname.slice(1));
const client = createPostgresClient(raw);
try {
  const [row] =
    await client`select current_database() as database, current_user as role, inet_server_addr()::text as address`;
  const [counts] =
    await client`select (select count(*)::int from reviews where status = 'PUBLISHED') as published_reviews, (select count(*)::int from reviews where user_id = '10000000-0000-4000-8000-000000000099') as fixed_user_reviews`;
  console.log({
    urlHost: url.hostname,
    publishedReviews: counts?.published_reviews,
    fixedUserReviews: counts?.fixed_user_reviews,
    database: row?.database,
    matchesUrl: row?.database === name,
    devNameMatches: row?.database === process.env.DEV_DATABASE_NAME,
    looksDevelopment: /(?:dev|test|local)/i.test(name),
    postingFlag: process.env.ENABLE_DEV_REVIEW_POSTING === "true",
    nodeEnvironment: process.env.NODE_ENV ?? "unset",
  });
} finally {
  await client.end();
}
