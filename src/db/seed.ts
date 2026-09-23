import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { eq } from "drizzle-orm";
import { createDbFromClient, createPostgresClient } from "./client";
import {
  demoAuthors,
  demoReviewCountForStore,
  demoReviewProfileAt,
  demoStoreAt,
} from "./demo-content";
import * as schema from "./schema";
import { syncStoreWeightedScoresWithDb } from "../server/services/store-weighted-scores";
import {
  assertDevReviewPostingEnabled,
  DEV_REVIEW_USER_ID,
} from "../server/dev-review-access";
import { GUIDELINE_VERSION } from "../schemas/review-flow";

if (existsSync(".env")) loadEnvFile(".env");
assertDevReviewPostingEnabled(process.env);
const databaseUrl = process.env.DATABASE_URL!;
const client = createPostgresClient(databaseUrl);
const db = createDbFromClient(client);
const id = (prefix: string, number: number) =>
  `${prefix}-0000-4000-8000-${String(number).padStart(12, "0")}`;
const publishedAt = new Date("2026-04-01T00:00:00.000Z");
const formId = id("60000000", 2);
const dims = [
  {
    id: id("80000000", 2),
    code: "atmosphere",
    label: "職場の雰囲気",
    order: 10,
  },
  {
    id: id("80000000", 3),
    code: "training",
    label: "教育・フォロー体制",
    order: 20,
  },
  { id: id("80000000", 4), code: "workload", label: "業務のゆとり", order: 30 },
  {
    id: id("80000000", 5),
    code: "flexibility",
    label: "シフトの融通度",
    order: 40,
  },
] as const;

async function seed() {
  const [identity] =
    await client`select current_database() as name, current_setting('server_version') as version`;
  if (identity?.name !== process.env.DEV_DATABASE_NAME)
    throw new Error("Unexpected database");
  console.log("Seeding confirmed development database", {
    database: identity.name,
  });
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.users)
      .values([
        {
          id: DEV_REVIEW_USER_ID,
          displayName: "開発用投稿者",
          status: "ACTIVE",
        },
        ...Array.from({ length: 5 }, (_, index) => ({
          id: id("10000000", 101 + index),
          displayName: `デモ投稿者${index + 1}`,
          status: "ACTIVE",
        })),
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.categories)
      .values([
        { id: id("50000000", 1), code: "cafe", name: "カフェ" },
        { id: id("50000000", 2), code: "convenience", name: "コンビニ" },
        { id: id("50000000", 3), code: "education", name: "教育" },
      ])
      .onConflictDoNothing();

    await tx.update(schema.reviewForms).set({ status: "RETIRED" });
    await tx
      .insert(schema.reviewForms)
      .values({
        id: formId,
        version: 2,
        status: "PUBLISHED",
        publishedAt,
      })
      .onConflictDoUpdate({
        target: schema.reviewForms.id,
        set: { status: "PUBLISHED", publishedAt },
      });

    for (const dimension of dims) {
      await tx
        .insert(schema.ratingDimensions)
        .values({
          id: dimension.id,
          code: dimension.code,
          label: dimension.label,
          displayOrder: dimension.order,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: schema.ratingDimensions.id,
          set: {
            code: dimension.code,
            label: dimension.label,
            displayOrder: dimension.order,
            isActive: true,
          },
        });
    }
    await tx
      .update(schema.ratingDimensions)
      .set({ isActive: false })
      .where(eq(schema.ratingDimensions.code, "overall"));
    await tx
      .insert(schema.reviewFormRatingDimensions)
      .values(
        dims.map((dimension) => ({
          reviewFormId: formId,
          ratingDimensionId: dimension.id,
          displayOrder: dimension.order,
          isRequired: true,
        })),
      )
      .onConflictDoNothing();

    const stores: (typeof schema.stores.$inferInsert)[] = [];
    const categories: (typeof schema.storeCategories.$inferInsert)[] = [];
    const reviews: (typeof schema.reviews.$inferInsert)[] = [];
    const ratings: (typeof schema.reviewRatings.$inferInsert)[] = [];
    for (let i = 0; i < 50; i++) {
      const { area, kind, name } = demoStoreAt(i);
      const storeId = i < 3 ? id("40000000", i + 1) : id("40000000", 98 + i);
      stores.push({
        id: storeId,
        name,
        normalizedName: name.toLowerCase(),
        prefecture: area[0],
        city: area[1],
        address: "架空の店舗（デモ用）",
        externalSource: "seed-v2",
        externalId: `review-demo-${i + 1}`,
        status: "ACTIVE",
      });
      categories.push({ storeId, categoryId: id("50000000", kind.category) });
      // 比較に十分な声を用意しつつ、5件未満で属性を一般化する表示も残す。
      const reviewCountForStore = demoReviewCountForStore(i);
      for (let j = 0; j < reviewCountForStore; j++) {
        const reviewId = id("90000000", 1001 + i * 5 + j);
        const profile = demoReviewProfileAt(kind.code, i, j);
        const author = demoAuthors[j]!;
        const date = new Date(
          Date.UTC(2026, (i + j * 2) % 9, 3 + ((i * 7 + j * 5) % 18)),
        );
        reviews.push({
          id: reviewId,
          storeId,
          userId: id("10000000", 101 + j),
          reviewFormId: formId,
          employmentStatus: author.employmentStatus,
          occupation: author.occupation,
          workDuration: author.workDuration,
          atmosphereTags: [...profile.atmosphereTags],
          staffTags: [...profile.staffTags],
          managerPresence: profile.managerPresence,
          recommendation: profile.recommendation,
          summary: `【架空の口コミ】${profile.summary}`,
          guidelineVersion: GUIDELINE_VERSION,
          guidelineAgreedAt: date,
          status: "PUBLISHED",
          publishedAt: date,
        });
        dims.forEach((dimension) =>
          ratings.push({
            reviewId,
            reviewFormId: formId,
            ratingDimensionId: dimension.id,
            score: profile.ratings[dimension.code],
          }),
        );
      }
    }
    for (const store of stores) {
      await tx
        .insert(schema.stores)
        .values(store)
        .onConflictDoUpdate({
          target: schema.stores.id,
          set: {
            name: store.name,
            normalizedName: store.normalizedName,
            prefecture: store.prefecture,
            city: store.city,
            address: store.address,
            externalSource: store.externalSource,
            externalId: store.externalId,
            status: "ACTIVE",
          },
        });
    }
    await tx
      .insert(schema.storeCategories)
      .values(categories)
      .onConflictDoNothing();
    // Existing reviews may already have embeddings. Never delete or overwrite them here;
    // only add missing deterministic demo rows so the seed stays non-destructive.
    await tx.insert(schema.reviews).values(reviews).onConflictDoNothing();
    await tx.insert(schema.reviewRatings).values(ratings).onConflictDoNothing();
    for (const store of stores) {
      await syncStoreWeightedScoresWithDb(tx, store.id!);
    }
  });
}
try {
  await seed();
  console.log("New review seed completed");
} finally {
  await client.end();
}
