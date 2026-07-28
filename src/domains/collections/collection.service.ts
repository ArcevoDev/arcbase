import type { DbClient } from "@/core/flows/flow-context";
import { CollectionRepository } from "./collection.repository";
import { ApiError } from "@/lib/errors/api-error";

export class CollectionService {
  private repo: CollectionRepository;
  constructor(db: DbClient) { this.repo = new CollectionRepository(db); }

  async assertOwnership(collectionId: string, userId: string, tenantId?: string | null) {
    const c = await this.repo.findById(collectionId, tenantId);
    if (!c) throw ApiError.notFound("Collection not found");
    if (c.authorId !== userId) throw ApiError.forbidden("You do not own this collection");
    return c;
  }
}
