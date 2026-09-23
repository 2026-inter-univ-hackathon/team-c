export const demoCompany = {
  name: "株式会社こもれびフーズ",
  representative: "採用・店舗運営チーム",
} as const;

export const demoStores = [
  {
    id: "40000000-0000-4000-8000-000000000001",
    name: "【デモ】こもれびカフェ 早稲田1号店",
    category: "カフェ",
    location: "東京都 新宿区",
    averageRating: 4.1,
    reviewCount: 5,
    status: "安定",
    focus: "繁忙時間の役割分担",
  },
  {
    id: "40000000-0000-4000-8000-000000000002",
    name: "【デモ】まちかどマート 池袋1号店",
    category: "コンビニ",
    location: "東京都 豊島区",
    averageRating: 3.6,
    reviewCount: 5,
    status: "要フォロー",
    focus: "新人研修と夕方の業務負荷",
  },
  {
    id: "40000000-0000-4000-8000-000000000003",
    name: "【デモ】ひなた学習室 赤羽1号店",
    category: "教育・塾",
    location: "東京都 北区",
    averageRating: 4.3,
    reviewCount: 5,
    status: "安定",
    focus: "授業前後の相談体制",
  },
] as const;

export const demoDimensions = [
  { code: "atmosphere", label: "職場の雰囲気", score: 4.2 },
  { code: "training", label: "教育・フォロー体制", score: 3.8 },
  { code: "workload", label: "業務のゆとり", score: 3.4 },
  { code: "flexibility", label: "シフトの融通度", score: 4.1 },
] as const;

export const demoReviews = [
  {
    id: "demo-review-1",
    storeName: demoStores[0].name,
    score: 4.5,
    date: "2026年8月下旬",
    summary:
      "ランチのピークは忙しいものの、役割分担がはっきりしていました。テスト期間のシフトは早めに伝えると調整しやすかったです。",
  },
  {
    id: "demo-review-2",
    storeName: demoStores[1].name,
    score: 3.5,
    date: "2026年7月中旬",
    summary:
      "夕方は宅配の受付が増えます。最初は覚えることが多かったですが、先輩へ質問しやすい雰囲気でした。",
  },
  {
    id: "demo-review-3",
    storeName: demoStores[2].name,
    score: 4.3,
    date: "2026年6月上旬",
    summary:
      "授業前に教材を確認する時間があり、分からないことは社員へ相談できました。説明の振り返りもできて安心でした。",
  },
  {
    id: "demo-review-4",
    storeName: demoStores[0].name,
    score: 4.0,
    date: "2026年5月下旬",
    summary:
      "週末は急に混みますが、困ったときは近くのスタッフが声をかけてくれます。新人にも役割が分かりやすかったです。",
  },
] as const;

export const demoInsights = [
  {
    label: "強み",
    title: "シフト相談のしやすさ",
    description:
      "テスト期間や予定変更を早めに相談できる点が、複数店舗で評価されています。求人情報でも具体的に伝えられます。",
  },
  {
    label: "改善余地",
    title: "繁忙時間の業務負荷",
    description:
      "4指標の中では「業務のゆとり」が最も低い傾向です。ピーク前の役割確認と新人フォローが優先候補です。",
  },
  {
    label: "注視店舗",
    title: "まちかどマート 池袋1号店",
    description:
      "夕方業務と研修に関する声が重なっています。現場確認と初週の教育手順の見直しを提案します。",
  },
] as const;

export const demoActions = [
  {
    priority: "優先度 高",
    title: "新人の初週チェックリストを統一",
    store: "まちかどマート 池袋1号店",
    reason: "「覚えることが多い」「夕方に業務が重なる」という声への対応",
  },
  {
    priority: "優先度 中",
    title: "ピーク前の役割確認を5分実施",
    store: "こもれびカフェ 早稲田1号店",
    reason: "忙しい時間帯でも役割分担が機能している強みを定着させる",
  },
] as const;
