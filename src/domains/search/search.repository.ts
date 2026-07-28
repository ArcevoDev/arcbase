import type { DbClient }  from "@/core/flows/flow-context";
import type { SearchInput } from "./search.dto";

export class SearchRepository {
  constructor(private db: DbClient) {}

  async searchResources(q: string, input: SearchInput) {
    return this.db.resource.findMany({
      where: {
        deletedAt: null, status: "PUBLISHED", visibility: "PUBLIC",
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
        OR: [
          { title:       { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { excerpt:     { contains: q, mode: "insensitive" } },
        ],
      },
      include: { author: true, metrics: true },
      orderBy: { publishedAt: "desc" },
      skip:    (input.page - 1) * input.limit,
      take:    input.limit,
    });
  }

  async searchUsers(q: string, input: SearchInput) {
    return this.db.user.findMany({
      where: {
        deletedAt: null,
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
        OR: [
          { username:    { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { bio:         { contains: q, mode: "insensitive" } },
        ],
      },
      skip: (input.page - 1) * input.limit,
      take: input.limit,
    });
  }

  async searchCollections(q: string, input: SearchInput) {
    return this.db.collection.findMany({
      where: {
        deletedAt: null, visibility: "PUBLIC",
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
        OR: [
          { title:       { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      include: { author: true },
      skip:    (input.page - 1) * input.limit,
      take:    input.limit,
    });
  }
}
