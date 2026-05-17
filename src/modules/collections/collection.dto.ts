import { z } from "zod";
import { VisibilityEnum } from "../resources/resource.dto";

export const createCollectionSchema = z
  .object({
    title: z.string().min(3).max(100).trim(),
    description: z.string().max(1000).trim().nullable().optional(),
    visibility: VisibilityEnum.default("PUBLIC"),
    metadata: z.any().nullable().optional(),
  })
  .strict();

export const updateCollectionSchema = createCollectionSchema.partial().strict();

export interface CollectionDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: string;
  authorId: string;
  createdAt: string;
}

export function toCollectionDTO(col: any): CollectionDTO {
  return {
    id: col.id,
    slug: col.slug,
    title: col.title,
    description: col.description,
    visibility: col.visibility,
    authorId: col.authorId,
    createdAt: col.createdAt.toISOString(),
  };
}
