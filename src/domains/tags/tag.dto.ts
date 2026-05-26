// domains/tags/tag.dto.ts
// associateTagsSchema kept here for route-level input validation even though the
// actual association logic now lives in ResourceService. The schema is the right
// shape for validating the request body before delegating to the service.

import { z } from "zod";

export const createTagSchema = z
  .object({
    name: z
      .string()
      .min(2, "Tag name must be at least 2 characters")
      .max(50, "Tag name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z0-9\s\-_:\/.]+$/,
        "Tag name contains invalid characters",
      ),
  })
  .strict();

export const associateTagsSchema = z
  .object({
    tagIds: z
      .array(z.string().uuid("Each Tag ID must be a valid UUID"))
      .min(1, "Provide at least one Tag ID"),
  })
  .strict();

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type AssociateTagsInput = z.infer<typeof associateTagsSchema>;

export interface SafeTagDTO {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export function toSafeTagDTO(tag: {
  id: string;
  name: string;
  slug: string;
  createdAt: Date | string;
}): SafeTagDTO {
  return {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    createdAt:
      typeof tag.createdAt === "string"
        ? tag.createdAt
        : tag.createdAt.toISOString(),
  };
}
