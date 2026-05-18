import { ResourceRepository } from "./resource.repository";
import { CreateResourceInput, UpdateResourceInput, CreateRelationInput } from "./resource.dto";
import { ApiError } from "@/lib/errors/api-error";
import { RelationType } from "@/prisma-client";

export class ResourceService {
  private repo: ResourceRepository;

  constructor() {
    this.repo = new ResourceRepository();
  }

  async createDraft(authorId: string, input: CreateResourceInput) {
    // Gracefully handle dynamic Ghost Tenant isolation bounds
    const tenantId = input.tenantId ?? null;
    return this.repo.create(authorId, input.type, tenantId);
  }

  async getResource(resourceId: string, tenantId: string | null = null) {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource) {
      throw ApiError.notFound("Resource not found or belongs to a different domain segment");
    }
    return resource;
  }

  async getResources(params: {
    tenantId: string | null;
    authorId?: string;
    type?: string;
    status?: any;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    return this.repo.findAll(params);
  }

  async updateResource(resourceId: string, authorId: string, input: UpdateResourceInput, tenantId: string | null = null) {
    const resource = await this.getResource(resourceId, tenantId);
    
    // Authorization Check: Ensure authors own their draft space
    if (resource.authorId !== authorId) {
      throw ApiError.forbidden("You do not have permission to update this resource");
    }

    const updatePayload: any = { ...input };

    // Prevent Unique Constraint failures during creation by coercing empty strings to NULL
    if (input.slug === "") {
      updatePayload.slug = null;
    } else if (input.slug) {
      // Force unique check under author context
      const existing = await this.repo.findBySlug(input.slug, authorId, tenantId);
      if (existing && existing.id !== resourceId) {
        throw ApiError.badRequest("You have already used this slug on another resource asset");
      }
    }

    return this.repo.update(resourceId, updatePayload);
  }

  async publishResource(resourceId: string, authorId: string, tenantId: string | null = null) {
    const resource = await this.getResource(resourceId, tenantId);

    if (resource.authorId !== authorId) {
      throw ApiError.forbidden("You do not have permission to publish this resource");
    }

    // Require title and slug before allowing publishing lifecycle transition
    if (!resource.title || !resource.slug) {
      throw ApiError.badRequest("Cannot publish resource. A Title and Unique Slug are required.");
    }

    // Live Editing Fork: Hydrate live container directly from current working draft
    const liveContentJson = resource.draftContentJson || {};

    return this.repo.publish(resourceId, liveContentJson);
  }

  async archiveResource(resourceId: string, authorId: string, tenantId: string | null = null) {
    const resource = await this.getResource(resourceId, tenantId);

    if (resource.authorId !== authorId) {
      throw ApiError.forbidden("You do not have permission to archive this resource");
    }

    return this.repo.update(resourceId, { status: "ARCHIVED", archivedAt: new Date() });
  }

  async deleteResource(resourceId: string, authorId: string, tenantId: string | null = null) {
    const resource = await this.getResource(resourceId, tenantId);

    if (resource.authorId !== authorId) {
      throw ApiError.forbidden("You do not have permission to delete this resource");
    }

    return this.repo.deleteSoft(resourceId);
  }

  // GRAPH EDGES: Form dependency lines safely using cycle detection mechanisms
  async connectResources(fromId: string, authorId: string, input: CreateRelationInput, tenantId: string | null = null) {
    const source = await this.getResource(fromId, tenantId);
    const target = await this.getResource(input.toId, tenantId);

    if (source.authorId !== authorId) {
      throw ApiError.forbidden("You must be the owner of the source resource to form dependencies");
    }

    if (fromId === input.toId) {
      throw ApiError.badRequest("Self-referential circular relations are structurally prohibited");
    }

    // DAG CYCLE PREVENTION BLOCK
    // If user wants to insert (A -> B), we must check if there is an existing path from B -> A.
    // If a path from target to source already exists, adding from source to target would create a recursive loop.
    const wouldCreateCycle = await this.repo.pathExists(input.toId, fromId);
    if (wouldCreateCycle) {
      throw ApiError.badRequest(
        `Circular Dependency Trap Blocked: Node [${target.title || target.id}] already depends on Node [${source.title || source.id}] through a nested relationship.`
      );
    }

    return this.repo.createRelation(fromId, input.toId, input.type as RelationType, input.metadata || undefined);
  }

  async disconnectResources(fromId: string, toId: string, type: RelationType, authorId: string, tenantId: string | null = null) {
    const source = await this.getResource(fromId, tenantId);
    
    if (source.authorId !== authorId) {
      throw ApiError.forbidden("You do not have permission to edit relationships for this resource");
    }

    return this.repo.deleteRelation(fromId, toId, type);
  }

  async getResourceNetwork(resourceId: string, tenantId: string | null = null) {
    await this.getResource(resourceId, tenantId);
    return this.repo.getOutgoingRelations(resourceId);
  }
}
