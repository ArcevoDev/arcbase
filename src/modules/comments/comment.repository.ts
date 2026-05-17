import { prisma } from "@/lib/prisma/prisma";

export const CommentRepository = {
  async findById(id: string) {
    return prisma.comment.findUnique({
      where: { id },
      include: {
        resource: { select: { authorId: true } },
        author: { select: { id: true, username: true } },
        _count: { select: { replies: true } }
      },
    });
  },

  async findRepliesForParent(parentId: string) {
    return prisma.comment.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { replies: true } }
      }
    });
  },

  async create(data: {
    content: string;
    resourceId: string;
    authorId: string;
    parentId: string | null;
  }) {
    return prisma.comment.create({
      data,
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { replies: true } }
      },
    });
  },

  async updateContent(id: string, content: string) {
    return prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        author: { select: { id: true, username: true } },
        _count: { select: { replies: true } }
      },
    });
  },

  async softDelete(id: string) {
    return prisma.comment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
};