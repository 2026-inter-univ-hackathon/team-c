import { describe, expect, it } from "vitest";
import { appInfo } from "./app-info";

describe("appInfo", () => {
  it("keeps the product name visible on the first screen", () => {
    expect(appInfo.name).toBe("バイトのホンネ");
  });
});
