import { z } from "zod";
import { CommentStatus } from "@/prisma-client";

const commentStatusZod = z.enum(
  Object.values(CommentStatus) as [string, ...string[]],
);

export const createCommentSchema = z
  .object({
    content: z
      .string()
      .min(1, "Comment content cannot be empty")
      .max(2000, "Comment cannot exceed 2000 characters"),
  })
  .strict();

export const updateCommentSchema = z
  .object({
    content: z
      .string()
      .min(1, "Updated content cannot be empty")
      .max(2000, "Comment cannot exceed 2000 characters")
      .optional(),
    status: commentStatusZod.optional(),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export interface SafeCommentDTO {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  resourceId: string;
  parentId: string | null;
  author?: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export function toSafeCommentDTO(comment: any): SafeCommentDTO {
  return {
    id: comment.id,
    content:
      comment.status === CommentStatus.DELETED
        ? "[This comment has been removed]"
        : comment.content,
    status: comment.status,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
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
