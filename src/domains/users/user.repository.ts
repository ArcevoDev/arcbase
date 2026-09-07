import type { DbClient } from "@/core/flows/flow-context";
import type { Prisma }   from "@prisma-client";

export class UserRepository {
  constructor(private db: DbClient) {}

  async findById(id: string)          { return this.db.user.findFirst({ where: { id, deletedAt: null } }); }
  async findByIdentityId(id: string)  { return this.db.user.findFirst({ where: { identityId: id, deletedAt: null } }); }
  async findByUsername(username: string) { return this.db.user.findFirst({ where: { username, deletedAt: null } }); }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return this.db.user.update({ where: { id }, data });
  }

  async findMany(params: { tenantId?: string | null; page: number; limit: number }) {
    const where = { deletedAt: null, ...(params.tenantId ? { tenantId: params.tenantId } : {}) };
    const [items, total] = await Promise.all([
      this.db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (params.page - 1) * params.limit, take: params.limit }),
      this.db.user.count({ where }),
    ]);
    return { items, total };
  }
}
