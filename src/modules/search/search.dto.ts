import { z } from "zod";
import { ResourceType } from "@/prisma-client";

export const searchFiltersSchema = z
  .object({
    q: z.string().optional().default(""),
    type: z
      .enum(Object.values(ResourceType) as [string, ...string[]])
      .optional(),
    tagId: z
      .string()
      .uuid("Provided filter Tag ID must be a valid UUID")
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, "Limit must be a numeric string")
      .optional()
      .default("20"),
    page: z
      .string()
      .regex(/^\d+$/, "Page must be a numeric string")
      .optional()
      .default("1"),
  })
  .strict();

export type SearchFiltersInput = z.infer<typeof searchFiltersSchema>;

export interface SearchResultItemDTO {
  id: string;
  title: string | null;
  excerpt: string | null;
  type: ResourceType;
  slug: string | null;
  createdAt: string;
  tags: Array<{ id: string; name: string; slug: string }>;
}

export function toSearchResultDTO(resource: any): SearchResultItemDTO {
  return {
    id: resource.id,
    title: resource.title,
    excerpt: resource.excerpt,
    type: resource.type,
    slug: resource.slug,
    createdAt: resource.createdAt.toISOString(),
    tags: resource.tags
      ? resource.tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
        }))
      : [],
  };
}
