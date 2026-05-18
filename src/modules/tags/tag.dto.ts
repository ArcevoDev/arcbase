import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string()
    .min(2, "Tag name must be at least 2 characters")
    .max(50, "Tag name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9\s\-_:\/.]+$/, "Tag name contains invalid alphanumeric characters"),
}).strict();

export const associateTagsSchema = z.object({
  tagIds: z.array(z.string().uuid("Each Tag ID must be a valid UUID")).min(1, "Provide at least one Tag ID"),
}).strict();

export type CreateTagInput = z.infer<typeof createTagSchema>;

export interface SafeTagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export function toSafeTagDTO(tag: any): SafeTagDTO {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt: tag.createdAt.toISOString(),
  };
}