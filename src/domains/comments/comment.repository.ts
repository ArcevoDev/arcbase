import type { DbClient } from "@/core/flows/flow-context";

export class CommentRepository {
  constructor(private db: DbClient) {}

  async findByResource(resourceId: string, parentId: string | null, page: number, limit: number) {
    const where = { resourceId, parentId: parentId ?? null, status: "ACTIVE" as const, deletedAt: null };
    const [items, total] = await Promise.all([
      this.db.comment.findMany({
        where,
        include: { author: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.db.comment.count({ where }),
    ]);
    return { items, total };
  }
}
