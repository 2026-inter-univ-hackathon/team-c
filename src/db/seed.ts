import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { eq, ne } from "drizzle-orm";
import { createDbFromClient, createPostgresClient } from "./client";
import * as schema from "./schema";
import { syncStoreWeightedScoresWithDb } from "../server/services/store-weighted-scores";
import {
  assertDevReviewPostingEnabled,
  DEV_REVIEW_USER_ID,
} from "../server/dev-review-access";
import {
  GUIDELINE_VERSION,
  atmosphereTags,
  staffTags,
  occupations,
  workDurations,
  employmentStatuses,
  managerPresences,
  recommendations,
} from "../schemas/review-flow";

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

    // The existing data is explicitly designated dummy data. Preserve manual posts by the fixed user.
    await tx
      .delete(schema.reviews)
      .where(ne(schema.reviews.userId, DEV_REVIEW_USER_ID));

    const areas = [
      ["東京都", "新宿区", "早稲田"],
      ["東京都", "豊島区", "池袋"],
      ["東京都", "北区", "赤羽"],
      ["東京都", "渋谷区", "渋谷"],
      ["神奈川県", "横浜市", "横浜"],
      ["神奈川県", "川崎市", "川崎"],
      ["埼玉県", "さいたま市", "大宮"],
      ["千葉県", "船橋市", "船橋"],
    ] as const;
    const kinds = [
      { title: "こもれびカフェ", category: 1, task: "ドリンク作りとレジ" },
      { title: "まちかどマート", category: 2, task: "品出しと宅配便の受付" },
      { title: "ひなた学習室", category: 3, task: "教材準備と生徒への説明" },
    ] as const;
    const stories = [
      "最初はレジとドリンク作りを同時に覚えるのが大変でしたが、混雑前に練習時間を取ってもらえました。学校行事の休みは早めに相談すると調整してくれました。",
      "朝は納品とレジが重なるので、優先順位を先輩に聞いてから動くと安心です。ミスをしたときは責めずに手順を一緒に見直してくれました。",
      "授業の前に教材を確認する時間が必要です。質問に答えられないときは社員に相談でき、分からないまま生徒に説明する必要はありませんでした。",
      "ランチのピークは忙しいものの、役割分担がはっきりしていました。テスト期間のシフトは一ヶ月ほど前に伝えると調整しやすかったです。",
      "夕方は宅配の受付が増えます。初めは覚えることが多かったので、自分用のメモを作って確認していました。先輩へ質問しやすい雰囲気です。",
      "定期テスト前は生徒からの質問が集中します。授業後に短い振り返りの時間があり、次回に向けて説明を準備できたのが助かりました。",
      "平日の午後は比較的落ち着いていて、新しい仕事を練習できました。週末は急に混みますが、困ったときは近くのスタッフが声をかけてくれます。",
      "シフトの希望は毎月決まった時期に提出します。直前の変更は難しいので、予定が決まったら早めに伝えると働きやすいと思います。",
      "長く働いている方が多く、作業のコツを教えてくれました。静かな時間はもくもくと仕事を進め、混むと自然に声をかけ合う職場でした。",
      "閉店前は片付けと会計が重なり、慣れるまでは大変でした。業務の流れを確認してから入ると安心です。残業はほとんどありませんでした。",
    ];
    const stores: (typeof schema.stores.$inferInsert)[] = [];
    const categories: (typeof schema.storeCategories.$inferInsert)[] = [];
    const reviews: (typeof schema.reviews.$inferInsert)[] = [];
    const ratings: (typeof schema.reviewRatings.$inferInsert)[] = [];
    for (let i = 0; i < 50; i++) {
      const area = areas[i % areas.length]!;
      const kind = kinds[i % kinds.length]!;
      const storeId = i < 3 ? id("40000000", i + 1) : id("40000000", 98 + i);
      const name = `【デモ】${kind.title} ${area[2]}${Math.floor(i / 24) + 1}号店`;
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
      for (let j = 0; j < (i < 10 ? 1 : 0); j++) {
        const reviewId = id("90000000", 1001 + i * 5 + j);
        const score = ((i + j) % 5) + 1;
        const date = new Date(
          Date.UTC(2026, (i + j) % 8, 1 + ((i * 7 + j * 11) % 28)),
        );
        reviews.push({
          id: reviewId,
          storeId,
          userId: id("10000000", 101 + j),
          reviewFormId: formId,
          employmentStatus:
            employmentStatuses[(i + j) % employmentStatuses.length],
          occupation: occupations[(i + j) % occupations.length],
          workDuration: workDurations[(i + j) % workDurations.length],
          atmosphereTags: [atmosphereTags[(i + j) % atmosphereTags.length]!],
          staffTags: [staffTags[(i + j) % staffTags.length]!],
          managerPresence: managerPresences[(i + j) % managerPresences.length],
          recommendation: recommendations[(i + j) % recommendations.length],
          summary: `【架空の口コミ】${stories[i]!}`,
          guidelineVersion: GUIDELINE_VERSION,
          guidelineAgreedAt: date,
          status: "PUBLISHED",
          publishedAt: date,
        });
        dims.forEach((dimension, k) =>
          ratings.push({
            reviewId,
            reviewFormId: formId,
            ratingDimensionId: dimension.id,
            score: Math.max(1, Math.min(5, score + (k % 3) - 1)),
          }),
        );
      }
    }
    await tx
      .insert(schema.stores)
      .values(stores)
      .onConflictDoUpdate({
        target: schema.stores.id,
        set: { status: "ACTIVE" },
      });
    await tx
      .insert(schema.storeCategories)
      .values(categories)
      .onConflictDoNothing();
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
