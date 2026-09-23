import { z } from "zod";

export const storeSearchSchema = z.object({
  atmosphere: z.string().trim().max(200).default(""),
  q: z.string().trim().max(100).default(""),
  area: z.string().trim().max(100).default(""),
  category: z.string().max(80).default(""),
  minRating: z.coerce.number().min(0).max(5).default(0),
  sort: z.enum(["name", "rating", "reviews", "relevance"]).default("name"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
  ids: z.array(z.uuid()).max(100).optional(),
});
export type StoreSearch = z.infer<typeof storeSearchSchema>;
export const defaultSearch = storeSearchSchema.parse({});
export function parseSearchParams(raw: Record<string, unknown>): StoreSearch {
  // Saved IDs are local preferences, never accepted from the page URL.
  const result = storeSearchSchema.safeParse({ ...raw, ids: undefined });
  return result.success ? result.data : defaultSearch;
}
export const PAGE_SIZE = 12;
