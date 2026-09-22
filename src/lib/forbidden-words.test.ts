import { describe, expect, it } from "vitest";
import { containsForbiddenWord } from "./forbidden-words";

describe("containsForbiddenWord", () => {
  it.each([
    "バカ",
    "アホ",
    "無能",
    "死ね",
    "女のくせに",
    "男のくせに",
    "外国人だから",
  ])("flags guideline NG example %s", (word) => {
    expect(containsForbiddenWord(`これは${word}という文章です`)).toBe(true);
  });

  it("does not flag ordinary text", () => {
    expect(
      containsForbiddenWord(
        "忙しい時間帯はありますが、先輩がすぐに助けてくれました。",
      ),
    ).toBe(false);
  });

  it.each([
    "忙しい時間帯ばかりでした",
    "バカンスに行くほど休みが取りやすいです",
  ])(
    "does not flag benign compound words that contain a short forbidden word as a substring: %s",
    (text) => {
      expect(containsForbiddenWord(text)).toBe(false);
    },
  );

  it("flags half-width katakana that normalizes to a forbidden word", () => {
    expect(containsForbiddenWord("ﾊﾞｶって言われた")).toBe(true);
  });

  it("flags a forbidden word split by a half-width space", () => {
    expect(containsForbiddenWord("バ カって言われた")).toBe(true);
  });

  it("flags a forbidden word split by a full-width space", () => {
    expect(containsForbiddenWord("バ　カって言われた")).toBe(true);
  });

  it("flags a forbidden word written with combining voiced sound marks", () => {
    // "ハ" (U+30CF) + combining voiced sound mark (U+3099) + "カ" normalizes to "バカ".
    expect(containsForbiddenWord("バカって言われた")).toBe(true);
  });
});
