import { z } from "zod";
import { Visibility } from "@/prisma-client";

export const createCollectionSchema = z
  .object({
    title: z
      .string()
      .min(2, "Collection title must be at least 2 characters")
      .max(100),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .nullable(),
    visibility: z
      .enum(Object.values(Visibility) as [string, ...string[]])
      .optional()
      .default(Visibility.PUBLIC),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

export const addResourceToCollectionSchema = z
  .object({
    resourceId: z.string().uuid("Resource ID must be a valid UUID"),
  })
  .strict();

export const reorderCollectionSchema = z
  .object({
    orderedItemIds: z
      .array(z.string().uuid("Each CollectionResource ID must be a valid UUID"))
      .min(1, "Provide at least one ordered item ID"),
  })
  .strict();

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;

export interface SafeCollectionResourceDTO {
  id: string;
  resourceId: string;
  orderIndex: number;
  addedAt: string;
  resource?: {
    id: string;
    title: string | null;
    type: string;
  };
}

export interface SafeCollectionDTO {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  metadata: any;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  resources?: SafeCollectionResourceDTO[];
}

export function toSafeCollectionDTO(collection: any): SafeCollectionDTO {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description ?? null,
    visibility: collection.visibility,
    metadata: collection.metadata ?? {},
    authorId: collection.authorId,
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
    resources: collection.resources?.map((cr: any) => ({
      id: cr.id,
      resourceId: cr.resourceId,
      orderIndex: cr.orderIndex,
      addedAt: cr.addedAt.toISOString(),
      resource: cr.resource
        ? {
            id: cr.resource.id,
            title: cr.resource.title,
            type: cr.resource.type,
          }
        : undefined,
    })),
  };
}
