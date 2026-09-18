import { describe, expect, it } from "vitest";
import { parseFavorites } from "./favorites";
const id = "40000000-0000-4000-8000-000000000001";
describe("local favorites", () => {
  it.each([null, "broken", "{}", "null", '[1,null,"<script>","../../x"]'])(
    "tolerates corrupt storage %s",
    (value) => {
      expect(parseFavorites(value)).toEqual([]);
    },
  );
  it("deduplicates valid IDs and ignores extra data", () => {
    expect(
      parseFavorites(JSON.stringify([id, id, 123, { id }, "bad"])),
    ).toEqual([id]);
  });
  it("bounds the number of saved stores", () => {
    const ids = Array.from(
      { length: 120 },
      (_, i) => "40000000-0000-4000-8000-" + String(i).padStart(12, "0"),
    );
    expect(parseFavorites(JSON.stringify(ids))).toHaveLength(100);
  });
});
