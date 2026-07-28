import type { DbClient } from "@/core/flows/flow-context";
import { ResourceRepository } from "./resource.repository";
import { ApiError } from "@/lib/errors/api-error";

export class ResourceService {
  private repo: ResourceRepository;
  constructor(private db: DbClient) {
    this.repo = new ResourceRepository(db);
  }

  async assertOwnership(resourceId: string, userId: string, tenantId?: string | null) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource)            throw ApiError.notFound("Resource not found");
    if (resource.authorId !== userId) throw ApiError.forbidden("You do not own this resource");
    return resource;
  }

  async assertExists(resourceId: string, tenantId?: string | null) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource) throw ApiError.notFound("Resource not found");
    return resource;
  }
}
