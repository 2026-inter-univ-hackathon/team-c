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
});
