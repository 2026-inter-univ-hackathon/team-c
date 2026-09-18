import { z } from "zod";

const optionalNumberInput = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.coerce.number().finite().optional(),
);

export const publicListInputSchema = z
  .object({
    limit: optionalNumberInput,
    offset: optionalNumberInput,
  })
  .strip()
  .optional()
  .default({});

export const publicStoreIdInputSchema = z
  .object({
    storeId: z.uuid(),
  })
  .strip();

export const publicStoreReviewsInputSchema = publicStoreIdInputSchema
  .extend({
    limit: optionalNumberInput,
    offset: optionalNumberInput,
  })
  .strip();

export type PublicListInput = z.input<typeof publicListInputSchema>;
export type ParsedPublicListInput = z.output<typeof publicListInputSchema>;
export type PublicStoreIdInput = z.input<typeof publicStoreIdInputSchema>;
export type PublicStoreReviewsInput = z.input<
  typeof publicStoreReviewsInputSchema
>;
