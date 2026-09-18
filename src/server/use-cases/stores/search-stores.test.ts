import { expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import { searchPublicStores } from "../../repositories/search-stores";
import { searchStoresUseCase } from "./search-stores";
vi.mock("../../repositories/search-stores", () => ({
  searchPublicStores: vi.fn(),
  getStoreFilters: vi.fn(),
}));
it("rejects invalid input before any database search", async () => {
  await expect(
    searchStoresUseCase({} as Db, { ids: ["invalid"], page: Infinity }),
  ).rejects.toThrow();
  expect(searchPublicStores).not.toHaveBeenCalled();
});
