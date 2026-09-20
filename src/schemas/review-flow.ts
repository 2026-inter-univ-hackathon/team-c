import { z } from "zod";

export const GUIDELINE_VERSION = 1;
export const DEV_REVIEW_USER_ID = "10000000-0000-4000-8000-000000000099";

export const employmentStatuses = [
  "CURRENT",
  "LEFT_RECENTLY",
  "LEFT_LONG_AGO",
] as const;
export const occupations = [
  "HIGH_SCHOOL",
  "COLLEGE",
  "FREELANCER",
  "HOMEMAKER",
  "OTHER",
] as const;
export const workDurations = [
  "UNDER_3_MONTHS",
  "MONTHS_3_TO_12",
  "AT_LEAST_YEAR",
] as const;
export const atmosphereTags = [
  "FRIENDLY",
  "QUIET",
  "FOCUSED",
  "ENERGETIC",
] as const;
export const staffTags = [
  "STUDENTS",
  "HOMEMAKERS",
  "FREELANCERS",
  "WIDE_AGES",
] as const;
export const managerPresences = [
  "USUALLY_PRESENT",
  "SOMETIMES_PRESENT",
  "RARELY_PRESENT",
] as const;
export const recommendations = ["YES", "DEPENDS", "NO"] as const;
export const ratingCodes = [
  "atmosphere",
  "training",
  "workload",
  "flexibility",
] as const;

export const labels = {
  employmentStatus: {
    CURRENT: "現在勤務中",
    LEFT_RECENTLY: "退職から1年未満",
    LEFT_LONG_AGO: "退職から1年以上",
  },
  occupation: {
    HIGH_SCHOOL: "高校生",
    COLLEGE: "大学生・専門",
    FREELANCER: "フリーター",
    HOMEMAKER: "主婦・主夫",
    OTHER: "その他",
  },
  workDuration: {
    UNDER_3_MONTHS: "3ヶ月未満",
    MONTHS_3_TO_12: "3ヶ月以上〜1年未満",
    AT_LEAST_YEAR: "1年以上",
  },
  atmosphere: {
    FRIENDLY: "和気あいあい",
    QUIET: "静か・もくもく",
    FOCUSED: "業務中は集中",
    ENERGETIC: "元気・活発",
  },
  staff: {
    STUDENTS: "学生が多め",
    HOMEMAKERS: "主婦・主夫層が多め",
    FREELANCERS: "フリーター・Wワーク中心",
    WIDE_AGES: "高校生〜シニアまで幅広い",
  },
  manager: {
    USUALLY_PRESENT: "ほぼ常駐している",
    SOMETIMES_PRESENT: "シフトによって半々",
    RARELY_PRESENT: "ほぼ不在・現場任せ",
  },
  recommendation: {
    YES: "ぜひ勧めたい",
    DEPENDS: "人・条件による",
    NO: "あまり勧めない",
  },
  rating: {
    atmosphere: "職場の雰囲気",
    training: "教育・フォロー体制",
    workload: "業務のゆとり",
    flexibility: "シフトの融通度",
  },
} as const;

const uniqueTags = <T extends readonly [string, ...string[]]>(values: T) =>
  z
    .array(z.enum(values))
    .min(1)
    .max(2)
    .refine(
      (items) => new Set(items).size === items.length,
      "同じタグは選べません",
    );

export const createReviewInputSchema = z.strictObject({
  storeId: z.uuid(),
  employmentStatus: z.enum(employmentStatuses),
  occupation: z.enum(occupations),
  workDuration: z.enum(workDurations),
  atmosphereTags: uniqueTags(atmosphereTags),
  staffTags: uniqueTags(staffTags),
  managerPresence: z.enum(managerPresences),
  ratings: z.strictObject({
    atmosphere: z.number().int().min(1).max(5),
    training: z.number().int().min(1).max(5),
    workload: z.number().int().min(1).max(5),
    flexibility: z.number().int().min(1).max(5),
  }),
  recommendation: z.enum(recommendations),
  summary: z
    .string()
    .trim()
    .refine(
      (value) =>
        Array.from(value).length >= 30 && Array.from(value).length <= 300,
      "30〜300文字で入力してください",
    ),
  agreed: z.literal(true),
  guidelineVersion: z.literal(GUIDELINE_VERSION),
});

export type CreateReviewInput = z.infer<typeof createReviewInputSchema>;

export function reviewScore(ratings: CreateReviewInput["ratings"]) {
  return ratingCodes.reduce((sum, code) => sum + ratings[code], 0) / 4;
}

export function authorBadge(
  review: Pick<CreateReviewInput, "employmentStatus" | "occupation">,
) {
  return `${review.employmentStatus === "CURRENT" ? "現役スタッフ" : "退職したスタッフ"} / ${labels.occupation[review.occupation]}`;
}

export function fuzzyPublishedAt(date: Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const value = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const day = Number(value("day"));
  return `${value("year")}年${value("month")}月${day <= 10 ? "上旬" : day <= 20 ? "中旬" : "下旬"}`;
}
