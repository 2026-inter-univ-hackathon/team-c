import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";
import { drizzle } from "drizzle-orm/postgres-js";
import { parseServerEnv } from "../server/env";
import { createPostgresClient } from "./client";
import * as schema from "./schema";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Refusing to run database seed in production");
}

const { DATABASE_URL } = parseServerEnv(process.env);

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const seedIds = {
  users: {
    general: "10000000-0000-4000-8000-000000000001",
    owner: "10000000-0000-4000-8000-000000000002",
    admin: "10000000-0000-4000-8000-000000000003",
  },
  roles: {
    admin: "20000000-0000-4000-8000-000000000001",
  },
  organization: "30000000-0000-4000-8000-000000000001",
  stores: {
    cafe: "40000000-0000-4000-8000-000000000001",
    convenience: "40000000-0000-4000-8000-000000000002",
    schoolSupport: "40000000-0000-4000-8000-000000000003",
  },
  categories: {
    cafe: "50000000-0000-4000-8000-000000000001",
    convenience: "50000000-0000-4000-8000-000000000002",
    education: "50000000-0000-4000-8000-000000000003",
  },
  reviewForm: "60000000-0000-4000-8000-000000000001",
  questions: {
    firstTrap: "70000000-0000-4000-8000-000000000001",
    mistakeReaction: "70000000-0000-4000-8000-000000000002",
    busyMoment: "70000000-0000-4000-8000-000000000003",
  },
  dimensions: {
    overall: "80000000-0000-4000-8000-000000000001",
    atmosphere: "80000000-0000-4000-8000-000000000002",
    training: "80000000-0000-4000-8000-000000000003",
    workload: "80000000-0000-4000-8000-000000000004",
  },
  reviews: {
    cafeGeneral: "90000000-0000-4000-8000-000000000001",
    convenienceOwner: "90000000-0000-4000-8000-000000000002",
    schoolSupportGeneral: "90000000-0000-4000-8000-000000000003",
  },
} as const;

const publishedAt = new Date("2026-04-01T00:00:00.000Z");
const client = createPostgresClient(DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
  await db.transaction(async (tx) => {
    await tx
      .insert(schema.users)
      .values([
        {
          id: seedIds.users.general,
          email: "seed.general@example.com",
          displayName: "Seed General User",
          status: "ACTIVE",
          emailVerifiedAt: publishedAt,
        },
        {
          id: seedIds.users.owner,
          email: "seed.owner@example.com",
          displayName: "Seed Store Owner",
          status: "ACTIVE",
          emailVerifiedAt: publishedAt,
        },
        {
          id: seedIds.users.admin,
          email: "seed.admin@example.com",
          displayName: "Seed Admin User",
          status: "ACTIVE",
          emailVerifiedAt: publishedAt,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.authAccounts)
      .values([
        {
          userId: seedIds.users.general,
          provider: "development",
          providerUserId: "seed-general",
        },
        {
          userId: seedIds.users.owner,
          provider: "development",
          providerUserId: "seed-owner",
        },
        {
          userId: seedIds.users.admin,
          provider: "development",
          providerUserId: "seed-admin",
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.platformRoles)
      .values({
        id: seedIds.roles.admin,
        code: "ADMIN",
        name: "Administrator",
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.platformRoleAssignments)
      .values({
        userId: seedIds.users.admin,
        platformRoleId: seedIds.roles.admin,
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.organizations)
      .values({
        id: seedIds.organization,
        name: "Seed Partner Organization",
        status: "ACTIVE",
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.organizationMemberships)
      .values({
        organizationId: seedIds.organization,
        userId: seedIds.users.owner,
        role: "OWNER",
        status: "ACTIVE",
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.categories)
      .values([
        {
          id: seedIds.categories.cafe,
          code: "cafe",
          name: "カフェ",
          isActive: true,
        },
        {
          id: seedIds.categories.convenience,
          code: "convenience",
          name: "コンビニ",
          isActive: true,
        },
        {
          id: seedIds.categories.education,
          code: "education",
          name: "教育",
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.stores)
      .values([
        {
          id: seedIds.stores.cafe,
          organizationId: seedIds.organization,
          name: "Seed Cafe 早稲田店",
          normalizedName: "seed cafe 早稲田店",
          prefecture: "東京都",
          city: "新宿区",
          address: "西早稲田1-1-1",
          latitude: "35.709026",
          longitude: "139.719658",
          externalSource: "seed",
          externalId: "store-cafe-waseda",
          status: "ACTIVE",
        },
        {
          id: seedIds.stores.convenience,
          name: "Seed Mart 高田馬場駅前店",
          normalizedName: "seed mart 高田馬場駅前店",
          prefecture: "東京都",
          city: "新宿区",
          address: "高田馬場1-1-1",
          latitude: "35.712285",
          longitude: "139.703782",
          externalSource: "seed",
          externalId: "store-mart-takadanobaba",
          status: "ACTIVE",
        },
        {
          id: seedIds.stores.schoolSupport,
          organizationId: seedIds.organization,
          name: "Seed Study Support 池袋校",
          normalizedName: "seed study support 池袋校",
          prefecture: "東京都",
          city: "豊島区",
          address: "東池袋1-1-1",
          latitude: "35.729503",
          longitude: "139.7109",
          externalSource: "seed",
          externalId: "store-study-ikebukuro",
          status: "ACTIVE",
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.storeCategories)
      .values([
        {
          storeId: seedIds.stores.cafe,
          categoryId: seedIds.categories.cafe,
        },
        {
          storeId: seedIds.stores.convenience,
          categoryId: seedIds.categories.convenience,
        },
        {
          storeId: seedIds.stores.schoolSupport,
          categoryId: seedIds.categories.education,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.reviewForms)
      .values({
        id: seedIds.reviewForm,
        version: 1,
        status: "PUBLISHED",
        publishedAt,
      })
      .onConflictDoNothing();

    await tx
      .insert(schema.reviewQuestions)
      .values([
        {
          id: seedIds.questions.firstTrap,
          reviewFormId: seedIds.reviewForm,
          code: "first_trap",
          label: "働き始める前に知っておきたかったこと",
          answerType: "TEXT",
          displayOrder: 10,
          isRequired: true,
          minLength: 10,
          maxLength: 500,
        },
        {
          id: seedIds.questions.mistakeReaction,
          reviewFormId: seedIds.reviewForm,
          code: "mistake_reaction",
          label: "ミスをしたときの職場の反応",
          answerType: "TEXT",
          displayOrder: 20,
          isRequired: true,
          minLength: 10,
          maxLength: 500,
        },
        {
          id: seedIds.questions.busyMoment,
          reviewFormId: seedIds.reviewForm,
          code: "busy_moment",
          label: "一番忙しい時間帯や場面",
          answerType: "TEXT",
          displayOrder: 30,
          isRequired: true,
          minLength: 10,
          maxLength: 500,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.ratingDimensions)
      .values([
        {
          id: seedIds.dimensions.overall,
          code: "overall",
          label: "総合",
          displayOrder: 10,
          isActive: true,
        },
        {
          id: seedIds.dimensions.atmosphere,
          code: "atmosphere",
          label: "雰囲気",
          displayOrder: 20,
          isActive: true,
        },
        {
          id: seedIds.dimensions.training,
          code: "training",
          label: "教育",
          displayOrder: 30,
          isActive: true,
        },
        {
          id: seedIds.dimensions.workload,
          code: "workload",
          label: "忙しさ",
          displayOrder: 40,
          isActive: true,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.reviewFormRatingDimensions)
      .values([
        {
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.overall,
          displayOrder: 10,
          isRequired: true,
        },
        {
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.atmosphere,
          displayOrder: 20,
          isRequired: true,
        },
        {
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.training,
          displayOrder: 30,
          isRequired: true,
        },
        {
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.workload,
          displayOrder: 40,
          isRequired: true,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.reviews)
      .values([
        {
          id: seedIds.reviews.cafeGeneral,
          storeId: seedIds.stores.cafe,
          userId: seedIds.users.general,
          reviewFormId: seedIds.reviewForm,
          employmentStartYear: 2025,
          employmentEndYear: null,
          employmentStatus: "CURRENT",
          summary: "研修が丁寧で、初めての接客でも段階的に慣れられました。",
          publicAuthorLabel: "経験者A",
          status: "PUBLISHED",
          publishedAt,
        },
        {
          id: seedIds.reviews.convenienceOwner,
          storeId: seedIds.stores.convenience,
          userId: seedIds.users.owner,
          reviewFormId: seedIds.reviewForm,
          employmentStartYear: 2024,
          employmentEndYear: 2025,
          employmentStatus: "FORMER",
          summary:
            "駅前なのでピークは忙しいですが、シフト相談はしやすかったです。",
          publicAuthorLabel: "経験者B",
          status: "PUBLISHED",
          publishedAt,
        },
        {
          id: seedIds.reviews.schoolSupportGeneral,
          storeId: seedIds.stores.schoolSupport,
          userId: seedIds.users.general,
          reviewFormId: seedIds.reviewForm,
          employmentStartYear: 2023,
          employmentEndYear: 2024,
          employmentStatus: "FORMER",
          summary:
            "授業準備の時間も含めて、落ち着いて学習支援に向き合える環境でした。",
          publicAuthorLabel: "経験者C",
          status: "PUBLISHED",
          publishedAt,
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.reviewAnswers)
      .values([
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.firstTrap,
          answerText:
            "土日の昼前後は思ったより来客が多く、最初はレジと提供の流れを覚えるのが大変でした。",
        },
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.mistakeReaction,
          answerText:
            "新人のミスは店長や先輩がその場で理由を説明してくれて、次の動きも一緒に確認してくれました。",
        },
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.busyMoment,
          answerText:
            "ランチ後から夕方前までが混みやすく、注文と片付けが重なる時間帯はかなり集中力が必要です。",
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.firstTrap,
          answerText:
            "公共料金や宅配など、通常レジ以外の対応を覚えるまではメモを取っておくと安心でした。",
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.mistakeReaction,
          answerText:
            "確認すればすぐにフォローしてもらえましたが、忙しい時間は自分から早めに声をかける必要がありました。",
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.busyMoment,
          answerText:
            "朝の通勤時間帯と夕方の帰宅時間帯は列が伸びやすく、品出しよりレジ優先になることが多かったです。",
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.firstTrap,
          answerText:
            "生徒ごとに進度が違うので、担当前に教材と前回メモを確認する習慣を作ると楽でした。",
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.mistakeReaction,
          answerText:
            "教え方に迷ったときは社員の方が代替案を出してくれて、責めるより改善する雰囲気でした。",
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          reviewQuestionId: seedIds.questions.busyMoment,
          answerText:
            "定期テスト前は質問対応が増えますが、授業後に短く振り返る時間がありました。",
        },
      ])
      .onConflictDoNothing();

    await tx
      .insert(schema.reviewRatings)
      .values([
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.overall,
          score: 4,
        },
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.atmosphere,
          score: 5,
        },
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.training,
          score: 5,
        },
        {
          reviewId: seedIds.reviews.cafeGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.workload,
          score: 3,
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.overall,
          score: 3,
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.atmosphere,
          score: 3,
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.training,
          score: 4,
        },
        {
          reviewId: seedIds.reviews.convenienceOwner,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.workload,
          score: 5,
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.overall,
          score: 4,
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.atmosphere,
          score: 4,
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.training,
          score: 4,
        },
        {
          reviewId: seedIds.reviews.schoolSupportGeneral,
          reviewFormId: seedIds.reviewForm,
          ratingDimensionId: seedIds.dimensions.workload,
          score: 3,
        },
      ])
      .onConflictDoNothing();

    // Existing seed IDs and manually created data are preserved.
    // Fixed IDs and dates make repeated runs deterministic.
    const demoId = (prefix: string, index: number) =>
      `${prefix}-0000-4000-8000-${String(index).padStart(12, "0")}`;
    const demoUsers = Array.from({ length: 5 }, (_, index) => ({
      id: demoId("10000000", 101 + index),
      email: `seed.reviewer.${index + 1}@example.com`,
      displayName: `デモ投稿者${index + 1}`,
      status: "ACTIVE",
      emailVerifiedAt: publishedAt,
    }));
    await tx.insert(schema.users).values(demoUsers).onConflictDoNothing();

    const areas = [
      ["東京都", "新宿区", "早稲田"],
      ["東京都", "豊島区", "池袋"],
      ["東京都", "北区", "赤羽"],
      ["東京都", "渋谷区", "渋谷"],
      ["東京都", "千代田区", "神田"],
      ["神奈川県", "横浜市", "横浜"],
      ["神奈川県", "川崎市", "川崎"],
      ["埼玉県", "さいたま市", "大宮"],
      ["千葉県", "船橋市", "船橋"],
      ["千葉県", "千葉市", "千葉"],
    ] as const;
    const industries = [
      {
        name: "こもれびカフェ",
        categoryId: seedIds.categories.cafe,
        task: "ドリンク作りとレジ操作",
        peak: "休日の昼過ぎ",
      },
      {
        name: "まちかどマート",
        categoryId: seedIds.categories.convenience,
        task: "品出しと宅配便の受付",
        peak: "平日の朝と夕方",
      },
      {
        name: "ひなた学習室",
        categoryId: seedIds.categories.education,
        task: "教材の準備と生徒への説明",
        peak: "定期テスト前の夕方",
      },
    ];
    const impressions = [
      "忙しい時間は自分から確認する必要があり、慣れるまで時間がかかりました。",
      "仕事内容は覚えることが多く、研修時間がもう少しあると安心だと感じました。",
      "基本的な手順は決まっていて、慣れてからは自分のペースで働けました。",
      "先輩に質問しやすく、学校の予定に合わせたシフト相談もできました。",
      "研修で一つずつ練習でき、困ったときも周囲のフォローがありました。",
    ];
    const demoStores: (typeof schema.stores.$inferInsert)[] = [];
    const demoCategories: (typeof schema.storeCategories.$inferInsert)[] = [];
    const demoReviews: (typeof schema.reviews.$inferInsert)[] = [];
    const demoAnswers: (typeof schema.reviewAnswers.$inferInsert)[] = [];
    const demoRatings: (typeof schema.reviewRatings.$inferInsert)[] = [];
    for (let i = 0; i < 47; i++) {
      const area = areas[i % areas.length]!;
      const industry = industries[i % industries.length]!;
      const storeId = demoId("40000000", 101 + i);
      const name = `【デモ】${industry.name} ${area[2]}${Math.floor(i / 30) + 1}号店`;
      demoStores.push({
        id: storeId,
        name,
        normalizedName: name.toLowerCase(),
        prefecture: area[0],
        city: area[1],
        address: "架空の店舗（所在地はデモ用）",
        externalSource: "seed",
        externalId: `demo-store-${i + 1}`,
        status: "ACTIVE",
      });
      demoCategories.push({ storeId, categoryId: industry.categoryId });
      for (let j = 0; j < (i % 5) + 1; j++) {
        const reviewId = demoId("90000000", 1001 + i * 5 + j);
        const score = ((i + j) % 5) + 1;
        const current = (i + j) % 2 === 0;
        demoReviews.push({
          id: reviewId,
          storeId,
          userId: demoUsers[j]!.id,
          reviewFormId: seedIds.reviewForm,
          employmentStartYear: 2021 + ((i + j) % 4),
          employmentEndYear: current ? null : 2025,
          employmentStatus: current ? "CURRENT" : "FORMER",
          publicAuthorLabel: `デモ経験者${j + 1}`,
          summary: `【架空の口コミ】${industry.task}を担当しました。${impressions[score - 1]}`,
          status: "PUBLISHED",
          publishedAt: new Date(
            Date.UTC(2026, (i + j) % 8, 1 + ((i * 7 + j * 11) % 28), 3),
          ),
        });
        const answers = [
          `【架空の回答】${industry.task}は覚えることが多いので、最初に手順をメモしておくと安心でした。`,
          `【架空の回答】${impressions[score - 1]} ミスの後は手順を見直して次の対応を確認しました。`,
          `【架空の回答】${industry.peak}に対応が集中しました。事前に準備を済ませ、周囲と分担していました。`,
        ];
        Object.values(seedIds.questions).forEach((questionId, k) => {
          demoAnswers.push({
            reviewId,
            reviewFormId: seedIds.reviewForm,
            reviewQuestionId: questionId,
            answerText: answers[k]!,
          });
        });
        Object.values(seedIds.dimensions).forEach((dimensionId, k) => {
          demoRatings.push({
            reviewId,
            reviewFormId: seedIds.reviewForm,
            ratingDimensionId: dimensionId,
            score: Math.max(1, Math.min(5, score + (k % 3) - 1)),
          });
        });
      }
    }
    await tx.insert(schema.stores).values(demoStores).onConflictDoNothing();
    await tx
      .insert(schema.storeCategories)
      .values(demoCategories)
      .onConflictDoNothing();
    await tx.insert(schema.reviews).values(demoReviews).onConflictDoNothing();
    await tx
      .insert(schema.reviewAnswers)
      .values(demoAnswers)
      .onConflictDoNothing();
    await tx
      .insert(schema.reviewRatings)
      .values(demoRatings)
      .onConflictDoNothing();
  });
}

async function printSeedSummary() {
  const [summary] = await client`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from stores) as stores,
      (select count(*)::int from reviews where status = 'PUBLISHED') as published_reviews,
      (select count(*)::int from review_answers) as review_answers,
      (select count(*)::int from review_ratings) as review_ratings
  `;

  console.log("Database seed completed", summary);
}

try {
  await seed();
  await printSeedSummary();
} finally {
  await client.end();
}
