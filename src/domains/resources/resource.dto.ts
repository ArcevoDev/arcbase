import { z } from "zod";
import {
  ResourceTypeRenderer,
  ResourceStatus,
  Visibility,
  RelationType,
  UsageEvent,
  CommentStatus,
} from "@/prisma-client";

const resourceStatusValues = Object.values(ResourceStatus) as [
  ResourceStatus,
  ...ResourceStatus[],
];
const visibilityValues = Object.values(Visibility) as [
  Visibility,
  ...Visibility[],
];
const relationTypeValues = Object.values(RelationType) as [
  RelationType,
  ...RelationType[],
];
const resourceTypeValues = Object.values(ResourceTypeRenderer) as [
  ResourceTypeRenderer,
  ...ResourceTypeRenderer[],
];
const usageEventValues = Object.values(UsageEvent) as [
  UsageEvent,
  ...UsageEvent[],
];
const commentStatusValues = Object.values(CommentStatus) as [
  CommentStatus,
  ...CommentStatus[],
];

export const resourceStatusZod = z.enum(resourceStatusValues);
export const visibilityZod = z.enum(visibilityValues);
export const relationTypeZod = z.enum(relationTypeValues);
export const resourceTypeZod = z.enum(resourceTypeValues);
export const usageEventZod = z.enum(usageEventValues);
export const commentStatusZod = z.enum(commentStatusValues);

export const createResourceSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(500).optional().nullable(),
    type: resourceTypeZod,
    parentId: z.string().uuid("Invalid parent ID format").optional().nullable(),
    category: z.string().optional().nullable(),
    language: z.string().default("en"),
    draftContentJson: z.record(z.string(), z.any()).optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
    tagIds: z.array(z.string().uuid()).optional().default([]),
  })
  .strict();

export const updateResourceSchema = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9-_]+$/)
      .optional()
      .nullable(),
    title: z.string().min(1).max(200).optional().nullable(),
    description: z.string().max(1000).optional().nullable(),
    excerpt: z.string().max(300).optional().nullable(),
    draftContentJson: z.record(z.string(), z.any()).optional().nullable(),
    content: z.string().optional().nullable(),
    status: resourceStatusZod.optional(),
    visibility: visibilityZod.optional(),
    category: z.string().optional().nullable(),
    language: z.string().max(10).optional(),
    thumbnailUrl: z.string().url().or(z.literal("")).optional().nullable(),
    coverImageUrl: z.string().url().or(z.literal("")).optional().nullable(),
    fileUrl: z.string().url().or(z.literal("")).optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
    wordCount: z.number().int().nonnegative().optional().nullable(),
    estimatedTime: z.number().int().nonnegative().optional().nullable(),
    tagIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

export const createRelationSchema = z
  .object({
    type: relationTypeZod,
    toId: z.string().uuid("Target resource ID must be a valid UUID"),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export const listResourcesSchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    type: resourceTypeZod.optional(),
    status: resourceStatusZod.optional(),
    visibility: visibilityZod.optional(),
    parentId: z.string().uuid().optional().nullable(),
    category: z.string().optional(),
    tags: z
      .string()
      .transform((val) =>
        val
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      )
      .optional(),
    sortBy: z
      .enum(["createdAt", "updatedAt", "title", "wordCount"])
      .default("createdAt"),
    order: z.enum(["asc", "desc"]).default("desc"),
  })
  .strict();

export const trackUsageSchema = z
  .object({
    event: usageEventZod,
    sessionId: z.string().optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export const createCommentSchema = z
  .object({
    content: z.string().min(1, "Comment content cannot be empty").max(2000),
    parentId: z.string().uuid().optional().nullable(),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export const bulkActionSchema = z
  .object({
    ids: z
      .array(z.string().uuid())
      .min(1, "At least one target resource ID is required"),
    status: resourceStatusZod.optional(),
    tagIds: z.array(z.string().uuid()).optional(),
    action: z.enum([
      "UPDATE_STATUS",
      "ATTACH_TAGS",
      "DETACH_TAGS",
      "DELETE_SOFT",
    ]),
  })
  .strict();

export type CreateResourceInput = z.infer<typeof createResourceSchema>;
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;
export type CreateRelationInput = z.infer<typeof createRelationSchema>;
export type ListResourcesInput = z.infer<typeof listResourcesSchema>;
export type TrackUsageInput = z.infer<typeof trackUsageSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;

// Extended DTO Formatter interfaces
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

export interface SafeCommentDTO {
  id: string;
  content: string;
  status: CommentStatus;
  metadata: any | null;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  resourceId: string;
  parentId: string | null;
  author?: SafeAuthorDTO | null;
}

export interface SafeResourceDTO {
  id: string;
  slug: string | null;
  title: string | null;
  description: string | null;
  excerpt: string | null;
  type: ResourceTypeRenderer;
  status: ResourceStatus;
  visibility: Visibility;
  parentId: string | null;
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
  author?: SafeAuthorDTO | null;
  tags?: SafeTagDTO[];
  metrics?: SafeMetricsDTO | null;
  _count?: SafeResourceCountDTO;
}

export function toSafeResourceDTO(resource: any): SafeResourceDTO {
  if (!resource)
    throw new Error(
      "Mapping Error: Cannot format a null or undefined resource payload",
    );

  const safeResource: SafeResourceDTO = {
    id: resource.id,
    slug: resource.slug ?? null,
    title: resource.title ?? null,
    description: resource.description ?? null,
    excerpt: resource.excerpt ?? null,
    type: resource.type,
    status: resource.status,
    visibility: resource.visibility,
    parentId: resource.parentId ?? null,
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
    createdAt:
      typeof resource.createdAt === "string"
        ? resource.createdAt
        : resource.createdAt.toISOString(),
    updatedAt:
      typeof resource.updatedAt === "string"
        ? resource.updatedAt
        : resource.updatedAt.toISOString(),
    publishedAt: resource.publishedAt
      ? typeof resource.publishedAt === "string"
        ? resource.publishedAt
        : resource.publishedAt.toISOString()
      : null,
  };

  if (resource.author) {
    safeResource.author = {
      id: resource.author.id,
      username: resource.author.username,
      displayName: resource.author.displayName ?? null,
      avatarUrl: resource.author.avatarUrl ?? null,
    };
  }

  // Handle the customized Many-to-Many join table mapping schema adjustment
  if (Array.isArray(resource.resourceTags)) {
    safeResource.tags = resource.resourceTags.map((rt: any) => ({
      id: rt.tag.id,
      name: rt.tag.name,
      slug: rt.tag.slug,
    }));
  } else if (Array.isArray(resource.tags)) {
    safeResource.tags = resource.tags.map((tag: any) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    }));
  }

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

  if (resource._count) {
    safeResource._count = {
      children: resource._count.children ?? 0,
      comments: resource._count.comments ?? 0,
      versions: resource._count.versions ?? 0,
    };
  }

  return safeResource;
}

export function toSafeCommentDTO(comment: any): SafeCommentDTO {
  return {
    id: comment.id,
    content: comment.content,
    status: comment.status,
    metadata: comment.metadata ?? null,
    createdAt:
      typeof comment.createdAt === "string"
        ? comment.createdAt
        : comment.createdAt.toISOString(),
    updatedAt:
      typeof comment.updatedAt === "string"
        ? comment.updatedAt
        : comment.updatedAt.toISOString(),
    authorId: comment.authorId,
    resourceId: comment.resourceId,
    parentId: comment.parentId ?? null,
    author: comment.author
      ? {
          id: comment.author.id,
          username: comment.author.username,
          displayName: comment.author.displayName ?? null,
          avatarUrl: comment.author.avatarUrl ?? null,
        }
      : undefined,
  };
}
