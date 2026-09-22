/** 日を上旬（1〜10日）・中旬（11〜20日）・下旬（21日以降）に丸める。 */
function roundDayToPeriod(day: number): "上旬" | "中旬" | "下旬" {
  if (day <= 10) return "上旬";
  if (day <= 20) return "中旬";
  return "下旬";
}

function tokyoDateParts(date: string | Date) {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Tokyo",
  }).formatToParts(new Date(date));
  return {
    year: parts.find((part) => part.type === "year")?.value,
    month: parts.find((part) => part.type === "month")?.value,
    day: Number(parts.find((part) => part.type === "day")?.value),
  };
}

/** 投稿者特定を防ぐため、日付を「年月+上旬/中旬/下旬」に丸めて表示する。 */
export function formatFuzzyDate(date: string | Date): string {
  const { year, month, day } = tokyoDateParts(date);
  return `${year}年${month}月${roundDayToPeriod(day)}`;
}

/** 口コミが少ない職場向けに、日付を「年月」までに丸めて表示する。 */
export function formatFuzzyMonth(date: string | Date): string {
  const { year, month } = tokyoDateParts(date);
  return `${year}年${month}月`;
}
