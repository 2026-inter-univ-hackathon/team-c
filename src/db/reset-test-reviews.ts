import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { eq, inArray } from "drizzle-orm";
import { createDbFromClient, createPostgresClient } from "./client";
import { reviewAnswers, reviewRatings, reviews } from "./schema";
import {
  assertDevReviewPostingEnabled,
  DEV_REVIEW_USER_ID,
} from "../server/dev-review-access";

if (existsSync(".env")) loadEnvFile(".env");
assertDevReviewPostingEnabled(process.env);
const client = createPostgresClient(process.env.DATABASE_URL!);
const db = createDbFromClient(client);
try {
  const [identity] = await client`select current_database() as name`;
  if (identity?.name !== process.env.DEV_DATABASE_NAME)
    throw new Error("Unexpected database");
  const rows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.userId, DEV_REVIEW_USER_ID));
  console.log("Fixed test user reviews", {
    database: identity.name,
    count: rows.length,
  });
  if (process.argv.includes("--execute") && rows.length) {
    await db.transaction(async (tx) => {
      const ids = rows.map((row) => row.id);
      await tx
        .delete(reviewAnswers)
        .where(inArray(reviewAnswers.reviewId, ids));
      await tx
        .delete(reviewRatings)
        .where(inArray(reviewRatings.reviewId, ids));
      await tx.delete(reviews).where(eq(reviews.userId, DEV_REVIEW_USER_ID));
    });
    console.log("Deleted fixed test user reviews", { count: rows.length });
  } else if (!process.argv.includes("--execute")) {
    console.log("Dry run. Pass --execute to delete only these reviews.");
  }
} finally {
  await client.end();
}
