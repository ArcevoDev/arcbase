import { prisma } from "@/lib/prisma/prisma";
import { commentWithAuthor } from "@/lib/prisma/prisma-helpers";
import { CommentStatus } from "@/prisma-client";

export class CommentRepository {
  async findById(id: string) {
    return prisma.comment.findFirst({
      where: { id, status: { not: CommentStatus.DELETED } },
      include: commentWithAuthor,
    });
  }

  async findRootCommentsByResource(resourceId: string) {
    return prisma.comment.findMany({
      where: {
        resourceId,
        parentId: null, // Only fetch root nodes
        status: { not: CommentStatus.DELETED },
      },
      include: commentWithAuthor,
      orderBy: { createdAt: "desc" },
    });
  }

  async findRepliesByParent(parentId: string) {
    return prisma.comment.findMany({
      where: {
        parentId,
        status: { not: CommentStatus.DELETED },
      },
      include: commentWithAuthor,
      orderBy: { createdAt: "asc" }, // Replies read chronologically forward
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
      data: {
        status: CommentStatus.DELETED,
        deletedAt: new Date(),
      },
    });
  }
}
