import { z } from "zod";
import {
  ResourceType,
  ResourceStatus,
  Visibility,
  RelationType,
} from "@/prisma-client";

// Zod Enum configurations mapped cleanly from DB Enums
const resourceTypeZod = z.enum(Object.values(ResourceType) as [string, ...string[]]);
const resourceStatusZod = z.enum(Object.values(ResourceStatus) as [string, ...string[]]);
const visibilityZod = z.enum(Object.values(Visibility) as [string, ...string[]]);
const relationTypeZod = z.enum(Object.values(RelationType) as [string, ...string[]]);

// REQUEST SCHEMAS (VALIDATIONS)
export const createResourceSchema = z
  .object({
    type: resourceTypeZod,
    tenantId: z.string().uuid().optional().nullable(),
  })
  .strict();

export const updateResourceSchema = z
  .object({
    slug: z
      .string()
      .min(3, "Slug must be at least 3 characters")
      .max(100, "Slug cannot exceed 100 characters")
      .regex(
        /^[a-z0-9-_]+$/,
        "Slugs must only contain lowercase letters, numbers, hyphens, and underscores"
      )
      .optional()
      .nullable(),
    title: z
      .string()
      .min(1, "Title cannot be empty")
      .max(200, "Title is too long")
      .optional()
      .nullable(),
    description: z
      .string()
      .max(1000, "Description is too long")
      .optional()
      .nullable(),
    excerpt: z.string().max(300, "Excerpt is too long").optional().nullable(),
    draftContentJson: z.record(z.string(), z.any()).optional().nullable(),
    content: z.string().optional().nullable(),
    status: resourceStatusZod.optional(),
    visibility: visibilityZod.optional(),
    category: z.string().optional().nullable(),
    language: z.string().max(10).optional(),
    thumbnailUrl: z
      .string()
      .url("Invalid thumbnail URL format")
      .optional()
      .nullable(),
    coverImageUrl: z
      .string()
      .url("Invalid cover image URL format")
      .optional()
      .nullable(),
    fileUrl: z.string().url("Invalid file URL format").optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
    wordCount: z.number().int().nonnegative().optional().nullable(),
    estimatedTime: z.number().int().nonnegative().optional().nullable(),
  })
  .strict();

export const createRelationSchema = z
  .object({
    type: relationTypeZod,
    toId: z.string().uuid("Target resource ID must be a valid UUID"),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type CreateRelationInput = z.infer<typeof createRelationSchema>;

// RESPONSE DTO CONTRACTS (MAPPERS)
export interface SafeAuthorDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface SafeTagDTO {
  id: string;
  name: string;
  slug: string;
}

export interface SafeMetricsDTO {
  views: number;
  opens: number;
  downloads: number;
  shares: number;
  likes: number;
  bookmarks: number;
  engagementScore: number;
}

export interface SafeResourceCountDTO {
  children: number;
  comments: number;
  versions: number;
}

export interface SafeResourceDTO {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  type: ResourceType;
  status: ResourceStatus;
  visibility: Visibility;
  draftContentJson: any | null;
  publishedContentJson: any | null;
  content: string | null;
  category: string | null;
  language: string | null;
  thumbnailUrl: string | null;
  coverImageUrl: string | null;
  fileUrl: string | null;
  metadata: any | null;
  wordCount: number | null;
  estimatedTime: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  
  // Relations mapped gracefully (only if fetched/defined)
  author?: SafeAuthorDTO | null;
  tags?: SafeTagDTO[];
  metrics?: SafeMetricsDTO | null;
  _count?: SafeResourceCountDTO;
}

/**
 * Transforms a raw, nested Prisma Resource model into a sanitized, safe API representation.
 * Explicitly structures relationships while leaving out internal system parameters (e.g. aiMetadata, tenantId, deletedAt).
 */
export function toSafeResourceDTO(resource: any): SafeResourceDTO | null {
  if (!resource) return null;

  const safeResource: SafeResourceDTO = {
    id: resource.id,
    slug: resource.slug ?? null,
    title: resource.title ?? null,
    description: resource.description ?? null,
    excerpt: resource.excerpt ?? null,
    type: resource.type,
    status: resource.status,
    visibility: resource.visibility,
    draftContentJson: resource.draftContentJson ?? null,
    publishedContentJson: resource.publishedContentJson ?? null,
    content: resource.content ?? null,
    category: resource.category ?? null,
    language: resource.language ?? null,
    thumbnailUrl: resource.thumbnailUrl ?? null,
    coverImageUrl: resource.coverImageUrl ?? null,
    fileUrl: resource.fileUrl ?? null,
    metadata: resource.metadata ?? null,
    wordCount: resource.wordCount ?? null,
    estimatedTime: resource.estimatedTime ?? null,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    publishedAt: resource.publishedAt ? resource.publishedAt.toISOString() : null,
  };

  // Hydrate Author details if available
  if (resource.author) {
    safeResource.author = {
      id: resource.author.id,
      username: resource.author.username,
      displayName: resource.author.displayName ?? null,
      avatarUrl: resource.author.avatarUrl ?? null,
    };
  }

  // Hydrate Tag entities if available
  if (Array.isArray(resource.tags)) {
    safeResource.tags = resource.tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }

  // Hydrate Analytics Metrics structure if available
  if (resource.metrics) {
    safeResource.metrics = {
      views: resource.metrics.views ?? 0,
      opens: resource.metrics.opens ?? 0,
      downloads: resource.metrics.downloads ?? 0,
      shares: resource.metrics.shares ?? 0,
      likes: resource.metrics.likes ?? 0,
      bookmarks: resource.metrics.bookmarks ?? 0,
      engagementScore: resource.metrics.engagementScore ?? 0,
    };
  }

  // Hydrate counts of children/comments if requested inside the Prisma select
  if (resource._count) {
    safeResource._count = {
      children: resource._count.children ?? 0,
      comments: resource._count.comments ?? 0,
      versions: resource._count.versions ?? 0,
    };
  }

  return safeResource;
}
