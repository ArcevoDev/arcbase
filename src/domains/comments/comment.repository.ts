// domains/comments/comment.repository.ts
// Updated: uses split include helpers from prisma-helpers.
// findRootCommentsByResource and findRepliesByParent use commentWithAuthor (lightweight).
// findById uses commentWithAuthorAndReplies (includes shallow reply preview).
import { prisma } from "@/lib/prisma/prisma";
import {
  commentWithAuthor,
  commentWithAuthorAndReplies,
} from "@/lib/prisma/prisma-helpers";
import { CommentStatus } from "@/prisma-client";

export class CommentRepository {
  // findById loads a shallow reply preview — useful for the standalone GET endpoint.
  async findById(id: string) {
    return prisma.comment.findFirst({
      where: { id, status: { not: CommentStatus.DELETED } },
      include: commentWithAuthorAndReplies,
    });
  }

  // Root comments only — NO replies loaded. Replies are fetched on demand via /replies.
  async findRootCommentsByResource(resourceId: string) {
    return prisma.comment.findMany({
      where: {
        resourceId,
        parentId: null,
        status: { not: CommentStatus.DELETED },
      },
      include: commentWithAuthor,
      orderBy: { createdAt: "desc" },
    });
  }

  // Replies — lightweight author include, chronological ascending.
  async findRepliesByParent(parentId: string) {
    return prisma.comment.findMany({
      where: {
        parentId,
        status: { not: CommentStatus.DELETED },
      },
      include: commentWithAuthor,
      orderBy: { createdAt: "asc" },
    });
  }

  async create(data: {
    content: string;
    authorId: string;
    resourceId: string;
    parentId?: string | null;
  }) {
    return prisma.comment.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        resourceId: data.resourceId,
        parentId: data.parentId ?? null,
        status: CommentStatus.ACTIVE,
      },
      include: commentWithAuthor,
    });
  }

  async update(id: string, data: { content?: string; status?: CommentStatus }) {
    return prisma.comment.update({
      where: { id },
      data,
      include: commentWithAuthor,
    });
  }

  async softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: { status: CommentStatus.DELETED, deletedAt: new Date() },
    });
  }
}
