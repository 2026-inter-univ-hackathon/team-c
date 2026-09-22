/** 日を上旬（1〜10日）・中旬（11〜20日）・下旬（21日以降）に丸める。 */
function roundDayToPeriod(day: number): "上旬" | "中旬" | "下旬" {
  if (day <= 10) return "上旬";
  if (day <= 20) return "中旬";
  return "下旬";
}

/** 投稿者特定を防ぐため、日付を「年月+上旬/中旬/下旬」に丸めて表示する。 */
export function formatFuzzyDate(date: string | Date): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date(date));
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return `${year}年${month}月${roundDayToPeriod(day)}`;
}
