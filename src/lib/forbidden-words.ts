/** ガイドライン「口コミ投稿ガイドライン（禁止事項）」のNG例に基づく禁止ワード。 */
export const FORBIDDEN_WORDS = [
  // 誹謗中傷・人格攻撃
  "バカ",
  "ばか",
  "アホ",
  "あほ",
  "無能",
  "死ね",
  "クズ",
  "くず",
  // 差別的表現
  "女のくせに",
  "男のくせに",
  "外国人だから",
] as const;

/**
 * 短い禁止語は「ばかり」「バカンス」のような無害な複合語にも部分一致してしまう。
 * その語が含まれていても誤検知として除外するパターンをここで定義する。
 */
const FORBIDDEN_WORD_EXCLUSIONS: Partial<
  Record<(typeof FORBIDDEN_WORDS)[number], RegExp[]>
> = {
  ばか: [/ばかり/g],
  バカ: [/バカンス/g],
};

/** 判定前に全角/半角スペースを除去し、Unicode正規化（NFKC）を行う。 */
function normalizeForMatch(text: string): string {
  return text.normalize("NFKC").replace(/[\s\u3000]/g, "");
}

/** 除外パターンに該当する部分を取り除いた上で、禁止語が残るかを判定する。 */
function matchesForbiddenWord(
  normalizedText: string,
  word: (typeof FORBIDDEN_WORDS)[number],
): boolean {
  if (!normalizedText.includes(word)) return false;

  const exclusions = FORBIDDEN_WORD_EXCLUSIONS[word];
  if (!exclusions || exclusions.length === 0) return true;

  const withoutExclusions = exclusions.reduce(
    (text, pattern) => text.replace(pattern, ""),
    normalizedText,
  );
  return withoutExclusions.includes(word);
}

/** 投稿文に禁止ワードが含まれているかを判定する。 */
export function containsForbiddenWord(text: string): boolean {
  const normalized = normalizeForMatch(text);
  return FORBIDDEN_WORDS.some((word) => matchesForbiddenWord(normalized, word));
}

export const FORBIDDEN_WORD_MESSAGE =
  "投稿内容にガイドラインで禁止されている表現が含まれています";
