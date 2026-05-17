import { z } from "zod";

export const ResourceTypeEnum = z.enum(["ARTICLE", "NOTE", "MODULE", "VIDEO", "IMAGE", "FILE", "LINK", "AI_OUTPUT"]);
export const VisibilityEnum = z.enum(["PUBLIC", "PRIVATE", "UNLISTED"]);
export const ResourceStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const createResourceSchema = z
  .object({
    title: z.string().min(3).max(255).trim().optional(),
    description: z.string().max(2400).trim().nullable().optional(),
    excerpt: z.string().max(500).trim().nullable().optional(),
    content: z.string().trim().nullable().optional(),
    contentJson: z.any().nullable().optional(),
    type: ResourceTypeEnum,
    status: ResourceStatusEnum.default("DRAFT"),
    visibility: VisibilityEnum.default("PUBLIC"),
    category: z.string().min(2).max(100).trim().nullable().optional(),
    language: z.string().max(10).trim().default("en"),
    thumbnailUrl: z.string().url().nullable().optional(),
    coverImageUrl: z.string().url().nullable().optional(),
    fileUrl: z.string().url().nullable().optional(),
    metadata: z.any().nullable().optional(),
    wordCount: z.number().int().nonnegative().nullable().optional(),
    estimatedTime: z.number().int().nonnegative().nullable().optional(),
    parentId: z.string().uuid().nullable().optional(),
    tags: z.array(z.string().trim().min(1)).optional().default([]),
  })
  .strict();

export const updateResourceSchema = createResourceSchema.partial().strict();

export interface SafeResourceDTO {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  type: string;
  status: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  parentId: string | null;
}

export function toSafeResourceDTO(resource: any): SafeResourceDTO {
  return {
    id: resource.id,
    slug: resource.slug,
    title: resource.title,
    description: resource.description,
    type: resource.type,
    status: resource.status,
    visibility: resource.visibility,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    authorId: resource.authorId,
    parentId: resource.parentId,
  };
}
