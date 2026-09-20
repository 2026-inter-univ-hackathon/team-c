import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { createPostgresClient } from "./client";
import { assertDevReviewPostingEnabled } from "../server/dev-review-access";

if (existsSync(".env")) loadEnvFile(".env");
assertDevReviewPostingEnabled(process.env);
const client = createPostgresClient(process.env.DATABASE_URL!);
try {
  const [identity] = await client`select current_database() as name`;
  if (identity?.name !== process.env.DEV_DATABASE_NAME)
    throw new Error("Unexpected database");
  const [count] = await client`select count(*)::int as reviews from reviews`;
  console.log("Development review-flow preparation", {
    database: identity.name,
    reviews: count?.reviews ?? 0,
  });
  if (process.argv.includes("--execute")) {
    await client.begin(async (tx) => {
      await tx`delete from reviews`;
    });
    console.log("Deleted existing dummy reviews", {
      count: count?.reviews ?? 0,
    });
  } else {
    console.log(
      "Dry run. Pass --execute only after confirming this development database.",
    );
  }
} finally {
  await client.end();
}
