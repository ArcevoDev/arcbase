import type { DbClient } from "@/core/flows/flow-context";
import type { Prisma }   from "@prisma-client";

export class CollectionRepository {
  constructor(private db: DbClient) {}

  async findById(id: string, tenantId?: string | null) {
    return this.db.collection.findFirst({
      where:   { id, tenantId, deletedAt: null },
      include: { author: true, resources: { include: { resource: true }, orderBy: { orderIndex: "asc" } } },
    });
  }

  async findBySlug(slug: string, authorId: string, tenantId?: string | null) {
    return this.db.collection.findFirst({ where: { slug, authorId, tenantId, deletedAt: null } });
  }

  async create(data: Prisma.CollectionCreateInput) {
    return this.db.collection.create({ data });
  }

  async update(id: string, data: Prisma.CollectionUpdateInput) {
    return this.db.collection.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return this.db.collection.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async getMaxOrderIndex(collectionId: string): Promise<number> {
    const last = await this.db.collectionResource.findFirst({
      where:   { collectionId },
      orderBy: { orderIndex: "desc" },
    });
    return last?.orderIndex ?? -1;
  }
}
