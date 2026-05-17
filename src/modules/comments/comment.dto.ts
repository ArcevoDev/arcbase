import { z } from "zod";

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .min(1, "Comment content cannot be empty")
      .max(1000, "Comment cannot exceed 1000 characters")
      .trim(),
  })
  .strict();

export const updateCommentSchema = createCommentSchema;

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export interface SafeCommentDTO {
  id: string;
  content: string;
  createdAt: Date;
  deletedAt: Date | null;
  resourceId: string;
  parentId: string | null;
  author: {
    id: string;
    username: string;
  };
  replyCount: number;
}

export function toSafeCommentDTO(comment: any): SafeCommentDTO {
  if (!comment) return null as any;
  return {
    id: comment.id,
    content: comment.deletedAt
      ? "This comment was deleted by the author"
      : comment.content,
    createdAt: comment.createdAt,
    deletedAt: comment.deletedAt ?? null,
    resourceId: comment.resourceId,
    parentId: comment.parentId ?? null,
    author: {
      id: comment.author?.id,
      username: comment.author?.username || "Anonymous",
    },
    replyCount: comment._count?.replies ?? 0,
  };
}
