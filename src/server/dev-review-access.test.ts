import { describe, expect, it } from "vitest";
import { isDevReviewPostingEnabled } from "./dev-review-access";

const valid = {
  NODE_ENV: "development",
  DATABASE_URL: "postgres://localhost/team_c_dev",
  DEV_DATABASE_NAME: "team_c_dev",
  ENABLE_DEV_REVIEW_POSTING: "true",
};

describe("development review posting gate", () => {
  it("requires both explicit opt-in and a matching development database", () => {
    expect(isDevReviewPostingEnabled(valid)).toBe(true);
    expect(
      isDevReviewPostingEnabled({
        ...valid,
        ENABLE_DEV_REVIEW_POSTING: "false",
      }),
    ).toBe(false);
    expect(
      isDevReviewPostingEnabled({ ...valid, DEV_DATABASE_NAME: "another_dev" }),
    ).toBe(false);
    expect(
      isDevReviewPostingEnabled({
        ...valid,
        DATABASE_URL: "postgres://localhost/team_c",
      }),
    ).toBe(false);
  });
  it("rejects public environments even if the flag is set", () => {
    expect(
      isDevReviewPostingEnabled({ ...valid, NODE_ENV: "production" }),
    ).toBe(false);
  });
});
