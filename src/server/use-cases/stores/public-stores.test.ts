import { describe, expect, it, vi } from "vitest";
import type { Db } from "../../../db/client";
import type { PublicStoreUseCaseDependencies } from "./public-stores";
import {
  getPublicStoreDetailUseCase,
  listPublicStoreReviewsUseCase,
  listPublicStoresUseCase,
} from "./public-stores";

const db = {} as Db;
const storeId = "40000000-0000-4000-8000-000000000001";

function createDependencies(): PublicStoreUseCaseDependencies {
  return {
    listPublicStores: vi.fn().mockResolvedValue([]),
    getPublicStoreById: vi.fn().mockResolvedValue(null),
    listPublicReviewsByStoreId: vi.fn().mockResolvedValue([]),
  };
}

describe("public store use cases", () => {
  it("passes parsed list options to the repository", async () => {
    const dependencies = createDependencies();

    await listPublicStoresUseCase(
      db,
      { limit: "10", offset: "5" },
      dependencies,
    );

    expect(dependencies.listPublicStores).toHaveBeenCalledWith(db, {
      limit: 10,
      offset: 5,
    });
  });

  it("validates store ids before loading store details", async () => {
    const dependencies = createDependencies();

    await expect(
      getPublicStoreDetailUseCase(db, { storeId: "not-a-uuid" }, dependencies),
    ).rejects.toThrow();
    expect(dependencies.getPublicStoreById).not.toHaveBeenCalled();
  });

  it("passes validated store review input to the repository", async () => {
    const dependencies = createDependencies();

    await listPublicStoreReviewsUseCase(
      db,
      { storeId, limit: 3, offset: "1" },
      dependencies,
    );

    expect(dependencies.listPublicReviewsByStoreId).toHaveBeenCalledWith(
      db,
      storeId,
      { limit: 3, offset: 1, viewerUserId: null },
    );
  });
});
