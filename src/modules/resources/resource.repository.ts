import { prisma } from "@/lib/prisma/prisma";

export const ResourceRepository = {
  async create(data: any, tagConnections: any) {
    return prisma.resource.create({
      data: {
        ...data,
        metrics: {
          create: { views: 0, opens: 0, downloads: 0, shares: 0, likes: 0, bookmarks: 0, engagementScore: 0.0 },
        },
        tags: tagConnections,
      },
      include: {
        tags: true,
        metrics: true,
      },
    });
  },

  async findById(id: string) {
    return prisma.resource.findUnique({
      where: { id },
      include: { tags: true, metrics: true },
    });
  },

  async findBySlugAndAuthor(authorId: string, slug: string) {
    return prisma.resource.findUnique({
      where: { authorId_slug: { authorId, slug } },
    });
  },
};
