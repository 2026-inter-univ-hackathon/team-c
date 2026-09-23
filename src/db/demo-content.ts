import type {
  atmosphereTags,
  managerPresences,
  occupations,
  recommendations,
  staffTags,
} from "../schemas/review-flow";

type AtmosphereTag = (typeof atmosphereTags)[number];
type StaffTag = (typeof staffTags)[number];
type ManagerPresence = (typeof managerPresences)[number];
type Recommendation = (typeof recommendations)[number];
type Occupation = (typeof occupations)[number];

export type DemoCategoryCode = "cafe" | "convenience" | "education";

export type DemoReviewProfile = {
  summary: string;
  ratings: {
    atmosphere: number;
    training: number;
    workload: number;
    flexibility: number;
  };
  atmosphereTags: AtmosphereTag[];
  staffTags: StaffTag[];
  managerPresence: ManagerPresence;
  recommendation: Recommendation;
};

export const demoAreas = [
  ["東京都", "新宿区", "早稲田"],
  ["東京都", "新宿区", "高田馬場"],
  ["東京都", "豊島区", "池袋"],
  ["東京都", "武蔵野市", "吉祥寺"],
  ["東京都", "世田谷区", "下北沢"],
  ["東京都", "渋谷区", "渋谷"],
  ["神奈川県", "横浜市", "横浜"],
  ["神奈川県", "川崎市", "川崎"],
  ["埼玉県", "さいたま市", "大宮"],
  ["埼玉県", "さいたま市", "浦和"],
  ["千葉県", "船橋市", "船橋"],
  ["千葉県", "柏市", "柏"],
] as const;

export const demoStoreKinds = [
  { title: "こもれびカフェ", category: 1, code: "cafe" },
  { title: "まちかどマート", category: 2, code: "convenience" },
  { title: "ひなた学習室", category: 3, code: "education" },
  { title: "月灯りカフェ", category: 1, code: "cafe" },
  { title: "デイリーポケット", category: 2, code: "convenience" },
  { title: "みらい個別教室", category: 3, code: "education" },
  { title: "麦の音カフェ", category: 1, code: "cafe" },
  { title: "キャンパスミニ", category: 2, code: "convenience" },
  { title: "スタディポート", category: 3, code: "education" },
] as const satisfies readonly {
  title: string;
  category: 1 | 2 | 3;
  code: DemoCategoryCode;
}[];

const cafeProfiles: DemoReviewProfile[] = [
  {
    summary:
      "大学生スタッフが多く、初日から声をかけてもらえました。ランチ前後はレジとドリンク作りを同時に進めるので忙しいですが、役割分担がはっきりしています。テスト期間のシフトも早めに相談すれば調整できました。",
    ratings: { atmosphere: 5, training: 4, workload: 3, flexibility: 5 },
    atmosphereTags: ["FRIENDLY", "ENERGETIC"],
    staffTags: ["STUDENTS", "WIDE_AGES"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "メニューを覚えるまでは大変でしたが、写真付きの手順表と練習時間がありました。混雑中に分からないことがあっても先輩が短く指示してくれます。土日は忙しいため、落ち着いて覚えたい人は平日から始めると安心です。",
    ratings: { atmosphere: 4, training: 5, workload: 2, flexibility: 4 },
    atmosphereTags: ["FOCUSED", "ENERGETIC"],
    staffTags: ["STUDENTS", "FREELANCERS"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "朝の時間帯は常連のお客さんが多く、落ち着いた雰囲気です。開店準備はやることが多いものの、慣れると自分のペースで進められました。授業の開始時間に合わせて退勤時刻を相談できる点が働きやすかったです。",
    ratings: { atmosphere: 4, training: 4, workload: 4, flexibility: 5 },
    atmosphereTags: ["QUIET", "FRIENDLY"],
    staffTags: ["WIDE_AGES"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "夕方から閉店までは学生スタッフ中心で、声をかけ合いながら動いていました。閉店前は片付けと会計が重なって忙しくなります。希望シフトは通りやすいですが、週末に入れる人の方が歓迎される印象です。",
    ratings: { atmosphere: 4, training: 3, workload: 2, flexibility: 4 },
    atmosphereTags: ["FRIENDLY", "ENERGETIC"],
    staffTags: ["STUDENTS"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "DEPENDS",
  },
  {
    summary:
      "スタッフ同士は話しやすい一方、ピーク時は教えてもらう余裕が少なくなります。最初の数回は覚えることが多く、メモが欠かせませんでした。急なシフト変更は難しいので、学校行事の予定は早めに共有した方がよいです。",
    ratings: { atmosphere: 3, training: 3, workload: 2, flexibility: 2 },
    atmosphereTags: ["FOCUSED"],
    staffTags: ["STUDENTS", "FREELANCERS"],
    managerPresence: "RARELY_PRESENT",
    recommendation: "DEPENDS",
  },
];

const convenienceProfiles: DemoReviewProfile[] = [
  {
    summary:
      "夕方はレジ、品出し、宅配便の受付が重なりますが、担当を声に出して分けるので動きやすかったです。学生スタッフが多く、授業の話もしやすい雰囲気でした。試験前は早めに伝えれば勤務日数を減らせました。",
    ratings: { atmosphere: 5, training: 4, workload: 3, flexibility: 5 },
    atmosphereTags: ["FRIENDLY", "ENERGETIC"],
    staffTags: ["STUDENTS", "WIDE_AGES"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "早朝は納品が多く、短時間でもかなり体を動かします。作業順が決まっているので、慣れると時間が過ぎるのが早く感じました。レジ研修は横に先輩がついてくれ、独り立ち後も呼べばすぐ助けてもらえます。",
    ratings: { atmosphere: 4, training: 5, workload: 2, flexibility: 4 },
    atmosphereTags: ["FOCUSED"],
    staffTags: ["HOMEMAKERS", "FREELANCERS"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "宅配便や公共料金など覚える受付が多いですが、カウンター内の早見表を見ながら対応できました。分からないまま進めず、必ず先輩に確認するルールです。平日の昼は比較的落ち着いて練習できました。",
    ratings: { atmosphere: 4, training: 5, workload: 4, flexibility: 3 },
    atmosphereTags: ["QUIET", "FOCUSED"],
    staffTags: ["WIDE_AGES"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "シフトは曜日と時間を固定して入る人が多く、生活リズムを作りやすかったです。急な交代はスタッフ同士で相談する必要があります。夕食前後は混みますが、混雑が落ち着いた後に振り返りをしてもらえました。",
    ratings: { atmosphere: 4, training: 4, workload: 3, flexibility: 3 },
    atmosphereTags: ["FOCUSED", "FRIENDLY"],
    staffTags: ["WIDE_AGES"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "DEPENDS",
  },
  {
    summary:
      "深夜帯は少人数なので、自分から優先順位を考えて動く必要がありました。最初の研修は丁寧でしたが、一人で任される範囲が広がると忙しく感じます。静かな時間に集中して作業したい人には合うと思います。",
    ratings: { atmosphere: 3, training: 4, workload: 2, flexibility: 3 },
    atmosphereTags: ["QUIET", "FOCUSED"],
    staffTags: ["FREELANCERS"],
    managerPresence: "RARELY_PRESENT",
    recommendation: "DEPENDS",
  },
];

const educationProfiles: DemoReviewProfile[] = [
  {
    summary:
      "大学生の講師が多く、授業後に教え方を相談できました。生徒から難しい質問を受けたときは社員へ引き継げるので、分からないまま答える必要はありません。大学の試験期間も事前に伝えれば調整してもらえました。",
    ratings: { atmosphere: 5, training: 5, workload: 4, flexibility: 5 },
    atmosphereTags: ["FRIENDLY", "FOCUSED"],
    staffTags: ["STUDENTS"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "最初は先輩の授業見学から始まり、模擬授業で説明の仕方を練習しました。担当を持った後も教材選びを相談できます。準備時間は必要ですが、人に教えることが好きなら達成感のある仕事だと思います。",
    ratings: { atmosphere: 4, training: 5, workload: 3, flexibility: 4 },
    atmosphereTags: ["FOCUSED", "FRIENDLY"],
    staffTags: ["STUDENTS", "FREELANCERS"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "定期テスト前は質問が集中し、授業準備も増えるので忙しくなります。一方で、生徒の点数が上がったときに直接お礼を言ってもらえるのが嬉しかったです。繁忙期以外は落ち着いて教材研究ができました。",
    ratings: { atmosphere: 4, training: 4, workload: 2, flexibility: 4 },
    atmosphereTags: ["FOCUSED", "ENERGETIC"],
    staffTags: ["STUDENTS", "WIDE_AGES"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "担当曜日は基本的に固定ですが、実習や学校行事がある週は他の講師と交代できました。授業記録を毎回書く必要があり、退勤前は少し慌ただしいです。教室長には質問しやすく、一人で抱え込むことはありませんでした。",
    ratings: { atmosphere: 4, training: 4, workload: 3, flexibility: 4 },
    atmosphereTags: ["QUIET", "FRIENDLY"],
    staffTags: ["STUDENTS", "WIDE_AGES"],
    managerPresence: "USUALLY_PRESENT",
    recommendation: "YES",
  },
  {
    summary:
      "授業そのものより、事前準備と保護者向けの報告を書く時間を多く感じました。研修資料は揃っていますが、自分から確認する姿勢が必要です。急な休みは代講調整が難しいため、予定を早めに出せる人に向いています。",
    ratings: { atmosphere: 3, training: 4, workload: 2, flexibility: 2 },
    atmosphereTags: ["QUIET", "FOCUSED"],
    staffTags: ["STUDENTS", "FREELANCERS"],
    managerPresence: "SOMETIMES_PRESENT",
    recommendation: "DEPENDS",
  },
];

export const demoReviewProfiles = {
  cafe: cafeProfiles,
  convenience: convenienceProfiles,
  education: educationProfiles,
} satisfies Record<DemoCategoryCode, DemoReviewProfile[]>;

export const demoAuthors = [
  {
    occupation: "COLLEGE",
    employmentStatus: "CURRENT",
    workDuration: "AT_LEAST_YEAR",
  },
  {
    occupation: "HIGH_SCHOOL",
    employmentStatus: "CURRENT",
    workDuration: "MONTHS_3_TO_12",
  },
  {
    occupation: "FREELANCER",
    employmentStatus: "LEFT_RECENTLY",
    workDuration: "AT_LEAST_YEAR",
  },
  {
    occupation: "HOMEMAKER",
    employmentStatus: "CURRENT",
    workDuration: "MONTHS_3_TO_12",
  },
  {
    occupation: "OTHER",
    employmentStatus: "LEFT_LONG_AGO",
    workDuration: "UNDER_3_MONTHS",
  },
] as const satisfies readonly {
  occupation: Occupation;
  employmentStatus: "CURRENT" | "LEFT_RECENTLY" | "LEFT_LONG_AGO";
  workDuration: "UNDER_3_MONTHS" | "MONTHS_3_TO_12" | "AT_LEAST_YEAR";
}[];

export function demoReviewCountForStore(storeIndex: number): number {
  if (storeIndex < 0 || storeIndex >= 50) {
    throw new RangeError("Demo store index must be between 0 and 49");
  }
  if (storeIndex < 24) return 5;
  if (storeIndex < 40) return 4;
  return 3;
}

export function demoStoreAt(storeIndex: number) {
  if (storeIndex < 0 || storeIndex >= 50) {
    throw new RangeError("Demo store index must be between 0 and 49");
  }
  const area = demoAreas[storeIndex % demoAreas.length]!;
  const kind = demoStoreKinds[storeIndex % demoStoreKinds.length]!;
  const branchNumber = Math.floor(storeIndex / 36) + 1;
  return {
    area,
    kind,
    name: `【デモ】${kind.title} ${area[2]}${branchNumber}号店`,
  };
}

export function demoReviewProfileAt(
  categoryCode: DemoCategoryCode,
  storeIndex: number,
  reviewIndex: number,
): DemoReviewProfile {
  const profiles = demoReviewProfiles[categoryCode];
  return profiles[(storeIndex + reviewIndex) % profiles.length]!;
}
