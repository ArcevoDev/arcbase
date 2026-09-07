import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { ResourceRepository } from "./resource.repository";
import type { ListResourcesInput } from "./resource.dto";
import { ApiError } from "@/lib/errors/api-error";

export class ResourceService {
  private repo: ResourceRepository;
  constructor(private db: DbClient = prisma) {
    this.repo = new ResourceRepository(db);
  }

  async listResources(tenantId: string | null, filters: ListResourcesInput) {
    return this.repo.findMany({ ...filters, tenantId: tenantId ?? undefined });
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
