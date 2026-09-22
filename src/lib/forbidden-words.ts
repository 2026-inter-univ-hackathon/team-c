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

/** 投稿文に禁止ワードが含まれているかを判定する。 */
export function containsForbiddenWord(text: string): boolean {
  return FORBIDDEN_WORDS.some((word) => text.includes(word));
}

export const FORBIDDEN_WORD_MESSAGE =
  "投稿内容にガイドラインで禁止されている表現が含まれています";
