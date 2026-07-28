import { z } from "zod";
export const SearchDto = z.object({
  q:        z.string().min(1).max(200),
  type:     z.enum(["resources","users","collections","all"]).default("all"),
  tenantId: z.string().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(50).default(10),
});
export type SearchInput = z.infer<typeof SearchDto>;
