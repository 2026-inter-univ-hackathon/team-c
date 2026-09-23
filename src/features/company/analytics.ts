import { demoReviews, demoStores } from "./demo-data";

export const dimensions = [
  "職場の雰囲気",
  "教育・フォロー体制",
  "業務のゆとり",
  "シフトの融通度",
];
const months = ["2026-08", "2026-07", "2026-06", "2026-05"];
const scores = [
  [5, 4, 4, 5],
  [4, 3, 3, 4],
  [4, 5, 4, 4],
  [4, 4, 3, 5],
];
export const voices = demoReviews.map((review, index) => ({
  ...review,
  month: months[index],
  scores: scores[index],
  storeId: demoStores.find((store) => store.name === review.storeName)!.id,
}));
export function analyze(storeId = "all", period = "6") {
  const selected = voices.filter(
    (v) =>
      (storeId === "all" || v.storeId === storeId) &&
      v.month >= (period === "3" ? "2026-07" : "2026-04"),
  );
  const averages = dimensions.map((_, i) =>
    selected.length
      ? selected.reduce((sum, v) => sum + v.scores[i], 0) / selected.length
      : null,
  );
  const average = selected.length
    ? averages.reduce<number>((sum, value) => sum + (value ?? 0), 0) / 4
    : null;
  return { selected, averages, average };
}
