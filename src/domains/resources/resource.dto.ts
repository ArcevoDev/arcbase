import { z } from "zod";

export const CreateResourceDto = z.object({
  title:               z.string().min(1).max(500).optional(),
  description:         z.string().max(2000).optional(),
  excerpt:             z.string().max(500).optional(),
  type:                z.enum(["ARTICLE","NOTE","MODULE","VIDEO","IMAGE","FILE","LINK","AI_OUTPUT"]),
  visibility:          z.enum(["PUBLIC","PRIVATE","UNLISTED"]).default("PUBLIC"),
  category:            z.string().optional(),
  language:            z.string().default("en"),
  slug:                z.string().optional(),
  draftContentJson:    z.record(z.string(), z.any()).optional(),
  metadata:            z.record(z.string(), z.any()).optional(),
  parentId:            z.string().optional(),
  thumbnailUrl:        z.string().url().optional(),
  coverImageUrl:       z.string().url().optional(),
  fileUrl:             z.string().url().optional(),
  tags:                z.array(z.string()).optional(),
});

export const UpdateResourceDto = CreateResourceDto.partial();

export const PublishResourceDto = z.object({
  publishedContentJson: z.record(z.string(), z.any()).optional(),
});

export const ConnectResourcesDto = z.object({
  targetId: z.string(),
  type:     z.enum(["RELATED","REFERENCES","DEPENDS_ON","PREREQUISITE","NEXT","PREVIOUS"]),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const ListResourcesDto = z.object({
  type:       z.enum(["ARTICLE","NOTE","MODULE","VIDEO","IMAGE","FILE","LINK","AI_OUTPUT"]).optional(),
  status:     z.enum(["DRAFT","PUBLISHED","ARCHIVED","DELETED"]).optional(),
  visibility: z.enum(["PUBLIC","PRIVATE","UNLISTED"]).optional(),
  authorId:   z.string().optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(100).default(20),
  tenantId:   z.string().optional(),
});

export type CreateResourceInput  = z.infer<typeof CreateResourceDto>;
export type UpdateResourceInput  = z.infer<typeof UpdateResourceDto>;
export type ConnectResourcesInput = z.infer<typeof ConnectResourcesDto>;
export type ListResourcesInput   = z.infer<typeof ListResourcesDto>;

// Aliases for route compatibility
export const listResourcesSchema = ListResourcesDto;
export const createResourceSchema = CreateResourceDto;
export const updateResourceSchema = UpdateResourceDto;

// Presenters
export function toSafeResourceDTO(resource: {
  id: string; slug: string | null; title: string; description: string | null;
  excerpt: string | null; coverImageUrl: string | null; thumbnailUrl: string | null;
  category: string | null; visibility: string; contentType: string;
  version: number; viewCount: number; saveCount: number;
  createdAt: Date; updatedAt: Date;
}) {
  return {
    id: resource.id, slug: resource.slug, title: resource.title,
    description: resource.description, excerpt: resource.excerpt,
    coverImageUrl: resource.coverImageUrl, thumbnailUrl: resource.thumbnailUrl,
    category: resource.category, visibility: resource.visibility,
    contentType: resource.contentType, version: resource.version,
    viewCount: resource.viewCount, saveCount: resource.saveCount,
    createdAt: resource.createdAt.toISOString(), updatedAt: resource.updatedAt.toISOString(),
  };
}
