import type { DbClient } from "@/core/flows/flow-context";

export class ReactionRepository {
  constructor(private db: DbClient) {}

  async findByUserAndResourceAndType(userId: string, resourceId: string, type: string) {
    return this.db.reaction.findUnique({
      where: { userId_resourceId_type: { userId, resourceId, type } },
    });
  }

  async findByResource(resourceId: string, tenantId?: string | null) {
    return this.db.reaction.findMany({
      where: { resourceId, ...(tenantId ? { tenantId } : {}) },
      include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
    });
  }

  async create(data: { userId: string; resourceId: string; type: string; tenantId?: string | null }) {
    return this.db.reaction.create({ data });
  }

  async delete(id: string) {
    return this.db.reaction.delete({ where: { id } });
  }
}