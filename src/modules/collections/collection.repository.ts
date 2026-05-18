import { prisma } from "@/lib/prisma/prisma";
import { Visibility } from "@/prisma-client";

export class CollectionRepository {
  async findById(id: string) {
    return prisma.collection.findFirst({
      where: { id, deletedAt: null },
      include: {
        resources: {
          orderBy: { orderIndex: "asc" },
          include: { resource: true },
        },
      },
    });
  }

  async findBySlug(
    authorId: string,
    slug: string,
    tenantId: string | null = null,
  ) {
    return prisma.collection.findFirst({
      where: { authorId, slug, tenantId, deletedAt: null },
    });
  }

  async listUserCollections(authorId: string, tenantId: string | null = null) {
    return prisma.collection.findMany({
      where: { authorId, tenantId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: {
    title: string;
    slug: string;
    description?: string | null;
    visibility: Visibility;
    authorId: string;
    tenantId: string | null;
    metadata?: any;
  }) {
    return prisma.collection.create({ data });
  }

  async update(
    id: string,
    data: {
      title?: string;
      slug?: string;
      description?: string | null;
      visibility?: Visibility;
      metadata?: any;
    },
  ) {
    return prisma.collection.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return prisma.collection.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async appendResource(collectionId: string, resourceId: string) {
    return prisma.$transaction(async (tx) => {
      const aggregate = await tx.collectionResource.aggregate({
        where: { collectionId },
        _max: { orderIndex: true },
      });

      const nextIndex = (aggregate._max.orderIndex ?? -1) + 1;

      return tx.collectionResource.create({
        data: {
          collectionId,
          resourceId,
          orderIndex: nextIndex,
        },
      });
    });
  }

  async removeResource(collectionId: string, resourceId: string) {
    return prisma.collectionResource.deleteMany({
      where: { collectionId, resourceId },
    });
  }

  async executeSequenceReorder(collectionId: string, orderedItemIds: string[]) {
    return prisma.$transaction(
      orderedItemIds.map((id, index) =>
        prisma.collectionResource.updateMany({
          where: { id, collectionId },
          data: { orderIndex: index },
        }),
      ),
    );
  }
}
