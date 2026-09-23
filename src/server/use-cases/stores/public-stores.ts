import type { Db } from "../../../db/client";
import {
  getPublicStoreById,
  listPublicReviewsByStoreId,
  listPublicStores,
} from "../../repositories";
import type {
  PublicListOptions,
  PublicReview,
  PublicStoreDetail,
  PublicStoreSummary,
} from "../../repositories";
import {
  publicListInputSchema,
  publicStoreIdInputSchema,
  publicStoreReviewsInputSchema,
  type PublicListInput,
  type PublicStoreIdInput,
  type PublicStoreReviewsInput,
} from "./schemas";

export type PublicStoreUseCaseDependencies = {
  listPublicStores: (
    db: Db,
    options?: PublicListOptions,
  ) => Promise<PublicStoreSummary[]>;
  getPublicStoreById: (
    db: Db,
    storeId: string,
  ) => Promise<PublicStoreDetail | null>;
  listPublicReviewsByStoreId: (
    db: Db,
    storeId: string,
    options?: PublicListOptions,
  ) => Promise<PublicReview[]>;
};

const defaultDependencies: PublicStoreUseCaseDependencies = {
  listPublicStores,
  getPublicStoreById,
  listPublicReviewsByStoreId,
};

export async function listPublicStoresUseCase(
  db: Db,
  input?: PublicListInput,
  dependencies: PublicStoreUseCaseDependencies = defaultDependencies,
): Promise<PublicStoreSummary[]> {
  const options = publicListInputSchema.parse(input);
  return dependencies.listPublicStores(db, options);
}

export async function getPublicStoreDetailUseCase(
  db: Db,
  input: PublicStoreIdInput,
  dependencies: PublicStoreUseCaseDependencies = defaultDependencies,
): Promise<PublicStoreDetail | null> {
  const { storeId } = publicStoreIdInputSchema.parse(input);
  return dependencies.getPublicStoreById(db, storeId);
}

export async function listPublicStoreReviewsUseCase(
  db: Db,
  input: PublicStoreReviewsInput,
  dependencies: PublicStoreUseCaseDependencies = defaultDependencies,
): Promise<PublicReview[]> {
  const { storeId, limit, offset, viewerUserId } =
    publicStoreReviewsInputSchema.parse(input);
  return dependencies.listPublicReviewsByStoreId(db, storeId, {
    limit,
    offset,
    viewerUserId: viewerUserId ?? null,
  });
}
