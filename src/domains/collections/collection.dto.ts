import { z } from "zod";

// ── Validators ──────────────────────────────────────────────────────────

export const CreateCollectionDto = z.object({
  title:       z.string().min(1).max(200),
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(1000).optional(),
  visibility:  z.enum(["PUBLIC","PRIVATE","UNLISTED"]).default("PUBLIC"),
  metadata:    z.record(z.string(), z.any()).optional(),
  parentId:    z.string().optional(),
});

export const UpdateCollectionDto = CreateCollectionDto.partial();

// Aliases for route compatibility
export const createCollectionSchema = CreateCollectionDto;
export const updateCollectionSchema = UpdateCollectionDto;

export type CreateCollectionInput = z.infer<typeof CreateCollectionDto>;
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionDto>;

export const reorderCollectionSchema = z.object({
  orderedItemIds: z.array(z.string()),
});

export const addResourceToCollectionSchema = z.object({
  resourceId: z.string(),
});
