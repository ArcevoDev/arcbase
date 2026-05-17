import { prisma } from "@/lib/prisma/prisma";

export const CollectionRepository = {
  async create(authorId: string, slug: string, data: any) {
    return prisma.collection.create({
      data: {
        authorId,
        slug,
        title: data.title,
        description: data.description ?? null,
        visibility: data.visibility,
        metadata: data.metadata ?? null,
      },
    });
  },

  async addResource(
    collectionId: string,
    resourceId: string,
    orderIndex: number,
  ) {
    return prisma.collectionResource.create({
      data: {
        collectionId,
        resourceId,
        orderIndex,
      },
    });
  },

  async getCollectionWithElements(id: string) {
    return prisma.collection.findUnique({
      where: { id },
      include: {
        resources: {
          orderBy: { orderIndex: "asc" },
          include: { resource: true },
        },
      },
    });
  },
};
