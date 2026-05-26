import {
  ResourceStatus,
  CommentStatus,
  RelationType,
  Prisma,
} from "@/prisma-client";
import { ResourceRepository } from "./resource.repository";
import {
  CreateResourceInput,
  UpdateResourceInput,
  CreateCommentInput,
  CreateRelationInput,
  BulkActionInput,
  ListResourcesInput,
  toSafeResourceDTO,
  toSafeCommentDTO,
  SafeResourceDTO,
  SafeCommentDTO,
} from "./resource.dto";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";
import { DbClient } from "@/lib/db-client";

function treatJsonValue(
  val: Record<string, unknown> | null | undefined,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
  if (val === undefined) return undefined;
  if (val === null) return Prisma.DbNull;
  return val as Prisma.InputJsonValue;
}

export class ResourceService {
  private repo: ResourceRepository;

  constructor() {
    this.repo = new ResourceRepository();
  }

  private useTx<T>(
    tx: DbClient | undefined,
    op: (client: DbClient) => Promise<T>,
  ): Promise<T> {
    return tx ? op(tx) : prisma.$transaction((newTx) => op(newTx));
  }

  // Reads
  async getResource(
    id: string,
    tenantId: string | null,
    tx?: DbClient,
  ): Promise<SafeResourceDTO> {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(id, tenantId, client);
      if (!resource) throw ApiError.notFound("Resource not found");
      return toSafeResourceDTO(resource);
    });
  }

  async listResources(
    tenantId: string | null,
    filters: ListResourcesInput,
  ): Promise<{
    data: SafeResourceDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    const limit = filters.limit ?? 20;
    const skip = ((filters.page ?? 1) - 1) * limit;
    const queryParams = {
      tenantId,
      type: filters.type,
      status: filters.status,
      visibility: filters.visibility,
      parentId: filters.parentId,
      search: filters.search,
      tags: filters.tags,
      limit,
      skip,
      sortBy: filters.sortBy,
      order: filters.order,
    };
    const [records, count] = await Promise.all([
      this.repo.findAll(queryParams),
      this.repo.countAll(queryParams),
    ]);
    return {
      data: records.map(toSafeResourceDTO),
      total: count,
      page: filters.page ?? 1,
      limit,
    };
  }

  async getResourceChildren(
    parentId: string,
    tenantId: string | null,
    options: { limit: number; cursor?: string },
    tx?: DbClient,
  ): Promise<{ children: SafeResourceDTO[]; nextCursor: string | null }> {
    return this.useTx(tx, async (client) => {
      const records = await this.repo.findChildren(
        parentId,
        tenantId,
        options,
        client,
      );
      const hasNext = records.length > options.limit;
      const page = hasNext ? records.slice(0, options.limit) : records;
      return {
        children: page.map(toSafeResourceDTO),
        nextCursor: hasNext ? page[page.length - 1].id : null,
      };
    });
  }

  async listVersions(
    resourceId: string,
    tenantId: string | null,
    tx?: DbClient,
  ) {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, tenantId, client);
      if (!resource) throw ApiError.notFound("Resource not found");
      const versions = await this.repo.findVersions(resourceId, client);
      return versions.map((v) => ({
        id: v.id,
        versionNumber: v.versionNumber,
        titleSnapshot: v.titleSnapshot,
        changeSummary: v.changeSummary ?? null,
        createdAt: v.createdAt.toISOString(),
        author: v.author,
      }));
    });
  }

  async listSavedResources(
    userId: string,
    tenantId: string | null,
  ): Promise<SafeResourceDTO[]> {
    const saved = await prisma.savedResource.findMany({
      where: { userId },
      include: {
        resource: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
              },
            },
            resourceTags: { include: { tag: true } },
            metrics: true,
            _count: {
              select: { children: true, comments: true, versions: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return saved
      .map((s) => s.resource)
      .filter(
        (r) => !r.deletedAt && (tenantId === null || r.tenantId === tenantId),
      )
      .map(toSafeResourceDTO);
  }

  // Writes
  async createResource(
    authorId: string,
    tenantId: string | null,
    input: CreateResourceInput,
    tx?: DbClient,
  ): Promise<SafeResourceDTO> {
    return this.useTx(tx, async (client) => {
      if (input.tagIds && input.tagIds.length > 0) {
        const tagsExist = await this.repo.verifyTagsExist(
          input.tagIds,
          tenantId,
          client,
        );
        if (!tagsExist)
          throw ApiError.badRequest(
            "One or more tag IDs are invalid or belong to a different tenant",
          );
      }

      const { tagIds, parentId, ...coreInput } = input;
      const prismaCreateData: Prisma.ResourceCreateInput = {
        ...coreInput,
        author: { connect: { id: authorId } },
        tenantId,
        ...(parentId && { parent: { connect: { id: parentId } } }),
        draftContentJson:
          coreInput.draftContentJson === null
            ? Prisma.JsonNull
            : (coreInput.draftContentJson as Prisma.InputJsonValue),
        metadata:
          coreInput.metadata === null
            ? Prisma.JsonNull
            : (coreInput.metadata as Prisma.InputJsonValue),
      };

      const resource = await this.repo.create(prismaCreateData, client);
      await this.repo.initializeMetrics(resource.id, client);
      if (tagIds && tagIds.length > 0) {
        await this.repo.attachTagsToResource(
          resource.id,
          tenantId,
          tagIds,
          client,
        );
      }

      const complete = await this.repo.findById(resource.id, tenantId, client);
      return toSafeResourceDTO(complete);
    });
  }

  async updateResource(
    id: string,
    tenantId: string | null,
    userId: string,
    input: UpdateResourceInput,
    tx?: DbClient,
  ): Promise<SafeResourceDTO> {
    return this.useTx(tx, async (client) => {
      const existing = await this.repo.findById(id, tenantId, client);
      if (!existing)
        throw ApiError.notFound("Target resource could not be resolved");
      if (existing.authorId !== userId)
        throw ApiError.forbidden(
          "You do not have permission to modify this resource",
        );

      if (input.tagIds !== undefined) {
        if (input.tagIds.length > 0) {
          const tagsExist = await this.repo.verifyTagsExist(
            input.tagIds,
            tenantId,
            client,
          );
          if (!tagsExist)
            throw ApiError.badRequest("Invalid tag associations provided");
        }
        await this.repo.clearResourceTags(id, client);
        if (input.tagIds.length > 0) {
          await this.repo.attachTagsToResource(
            id,
            tenantId,
            input.tagIds,
            client,
          );
        }
      }

      if (
        input.content !== undefined &&
        input.content !== existing.content &&
        existing.content
      ) {
        const highestVer = await this.repo.findHighestVersion(id, client);
        const nextVerNum = (highestVer?.versionNumber ?? 0) + 1;
        await this.repo.createVersion(
          id,
          {
            versionNumber: nextVerNum,
            content: existing.content,
            titleSnapshot: existing.title ?? "Untitled Snapshot",
            metadataSnapshot: existing.metadata ?? undefined,
            author: { connect: { id: userId } },
            resource: { connect: { id } },
          },
          client,
        );
      }

      const { tagIds, ...prismaUpdateData } = input;
      const finalizedData: Prisma.ResourceUpdateInput = {
        ...prismaUpdateData,
        draftContentJson: treatJsonValue(prismaUpdateData.draftContentJson),
        metadata: treatJsonValue(prismaUpdateData.metadata),
      };

      const updated = await this.repo.update(
        id,
        tenantId,
        finalizedData,
        client,
      );
      return toSafeResourceDTO(updated);
    });
  }

  /**
   * FIX: publishResource now enforces the full publish contract:
   * - Resource must exist and requester must be the author
   * - Status must not already be PUBLISHED
   * - Title must be present and non-empty
   * - At least one of content or draftContentJson must exist
   * - publishedAt is stamped and draftContentJson is promoted to publishedContentJson atomically
   */
  async publishResource(
    id: string,
    userId: string,
    tenantId: string | null,
    tx?: DbClient,
  ): Promise<SafeResourceDTO> {
    return this.useTx(tx, async (client) => {
      const existing = await this.repo.findById(id, tenantId, client);
      if (!existing) throw ApiError.notFound("Resource not found");
      if (existing.authorId !== userId)
        throw ApiError.forbidden("Only the author can publish this resource");
      if (existing.status === ResourceStatus.PUBLISHED)
        throw ApiError.conflict("Resource is already published");
      if (!existing.title?.trim())
        throw ApiError.badRequest("Cannot publish: resource must have a title");
      if (!existing.content && !existing.draftContentJson) {
        throw ApiError.badRequest(
          "Cannot publish: resource has no content or draft to promote",
        );
      }

      const updated = await this.repo.update(
        id,
        tenantId,
        {
          status: ResourceStatus.PUBLISHED,
          publishedAt: new Date(),
          publishedContentJson: existing.draftContentJson ?? Prisma.JsonNull,
        },
        client,
      );

      return toSafeResourceDTO(updated);
    });
  }

  async deleteResource(
    id: string,
    userId: string,
    tenantId: string | null,
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      const existing = await this.repo.findById(id, tenantId, client);
      if (!existing) throw ApiError.notFound("Resource not found");
      if (existing.authorId !== userId)
        throw ApiError.forbidden(
          "You do not have permission to delete this resource",
        );
      await this.repo.deleteSoft(id, tenantId, client);
    });
  }

  async archiveResource(
    id: string,
    userId: string,
    tenantId: string | null,
    tx?: DbClient,
  ): Promise<SafeResourceDTO> {
    return this.useTx(tx, async (client) => {
      const existing = await this.repo.findById(id, tenantId, client);
      if (!existing) throw ApiError.notFound("Resource not found");
      if (existing.authorId !== userId)
        throw ApiError.forbidden(
          "You do not have permission to archive this resource",
        );
      const updated = await this.repo.update(
        id,
        tenantId,
        { status: ResourceStatus.ARCHIVED },
        client,
      );
      return toSafeResourceDTO(updated);
    });
  }

  async createVersion(
    resourceId: string,
    authorId: string,
    changeSummary: string,
    tenantId: string | null,
    tx?: DbClient,
  ) {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, tenantId, client);
      if (!resource) throw ApiError.notFound("Resource not found");
      const highestVer = await this.repo.findHighestVersion(resourceId, client);
      const nextVerNum = (highestVer?.versionNumber ?? 0) + 1;
      return this.repo.createVersion(
        resourceId,
        {
          versionNumber: nextVerNum,
          content: resource.content ?? "",
          titleSnapshot: resource.title ?? "Untitled Snapshot",
          metadataSnapshot: resource.metadata ?? undefined,
          changeSummary,
          author: { connect: { id: authorId } },
          resource: { connect: { id: resourceId } },
        },
        client,
      );
    });
  }

  // Bookmarks (SavedResource)
  async saveResource(
    resourceId: string,
    userId: string,
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, null, client);
      if (!resource) throw ApiError.notFound("Resource not found");
      await (tx ?? prisma).savedResource.upsert({
        where: { userId_resourceId: { userId, resourceId } },
        create: { userId, resourceId },
        update: {},
      });
    });
  }

  async unsaveResource(
    resourceId: string,
    userId: string,
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async () => {
      const deleted = await prisma.savedResource.deleteMany({
        where: { userId, resourceId },
      });
      if (deleted.count === 0)
        throw ApiError.notFound("Saved resource record not found");
    });
  }

  // Bulk
  async executeBulkAction(
    tenantId: string | null,
    input: BulkActionInput,
    tx?: DbClient,
  ): Promise<{ processedCount: number }> {
    return this.useTx(tx, async (client) => {
      switch (input.action) {
        case "UPDATE_STATUS": {
          if (!input.status)
            throw ApiError.badRequest("Missing status value for update action");
          const result = await this.repo.bulkUpdateStatus(
            input.ids,
            tenantId,
            input.status,
            client,
          );
          return { processedCount: result.count };
        }
        case "DELETE_SOFT": {
          const result = await this.repo.bulkDeleteSoft(
            input.ids,
            tenantId,
            client,
          );
          return { processedCount: result.count };
        }
        case "ATTACH_TAGS": {
          if (!input.tagIds?.length)
            throw ApiError.badRequest("Missing target tags");
          await Promise.all(
            input.ids.map((id) =>
              this.repo.attachTagsToResource(
                id,
                tenantId,
                input.tagIds!,
                client,
              ),
            ),
          );
          return { processedCount: input.ids.length };
        }
        case "DETACH_TAGS": {
          if (!input.tagIds?.length)
            throw ApiError.badRequest("Missing tags to detach");
          await Promise.all(
            input.ids.map((id) =>
              this.repo.detachTagsFromResource(id, input.tagIds!, client),
            ),
          );
          return { processedCount: input.ids.length };
        }
        default:
          throw ApiError.unprocessable("Unrecognized bulk action");
      }
    });
  }

  // Comments
  async addComment(
    resourceId: string,
    authorId: string,
    tenantId: string | null,
    input: CreateCommentInput,
    tx?: DbClient,
  ): Promise<SafeCommentDTO> {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, tenantId, client);
      if (!resource)
        throw ApiError.notFound("Cannot comment on an invalid resource");

      if (input.parentId) {
        const parent = await this.repo.findCommentById(
          input.parentId,
          tenantId,
          client,
        );
        if (!parent || parent.resourceId !== resourceId) {
          throw ApiError.conflict(
            "Parent comment does not belong to this resource",
          );
        }
      }

      const record = await this.repo.createComment(
        {
          content: input.content,
          status: CommentStatus.ACTIVE,
          metadata: input.metadata ?? undefined,
          author: { connect: { id: authorId } },
          resource: { connect: { id: resourceId } },
          ...(input.parentId && {
            parent: { connect: { id: input.parentId } },
          }),
        },
        client,
      );

      return toSafeCommentDTO(record);
    });
  }

  /**
   * FIX: Implements the dual-author moderation rule.
   * - Comment author can only self-delete (DELETED status only).
   * - Resource author (moderator) can apply any moderation status: HIDDEN, DELETED, ARCHIVED, SPAM.
   * - Neither role can set status back to ACTIVE through this method (that's an admin action).
   */
  async updateCommentStatus(
    commentId: string,
    resourceId: string,
    requesterId: string,
    tenantId: string | null,
    status: CommentStatus,
    tx?: DbClient,
  ): Promise<SafeCommentDTO> {
    return this.useTx(tx, async (client) => {
      const [comment, resource] = await Promise.all([
        this.repo.findCommentById(commentId, tenantId, client),
        this.repo.findById(resourceId, tenantId, client),
      ]);

      if (!comment) throw ApiError.notFound("Comment not found");
      if (!resource) throw ApiError.notFound("Resource not found");

      const isCommentAuthor = comment.authorId === requesterId;
      const isResourceAuthor = resource.authorId === requesterId;

      if (!isCommentAuthor && !isResourceAuthor) {
        throw ApiError.forbidden(
          "You do not have permission to moderate this comment",
        );
      }

      // Comment authors may only delete their own comment — not apply moderator flags
      if (
        isCommentAuthor &&
        !isResourceAuthor &&
        status !== CommentStatus.DELETED
      ) {
        throw ApiError.forbidden(
          "Comment authors can only delete their own comments",
        );
      }

      const updated = await this.repo.updateCommentStatus(
        commentId,
        status,
        client,
      );
      return toSafeCommentDTO(updated);
    });
  }

  // Graph relations
  async connectResources(
    fromId: string,
    tenantId: string | null,
    input: CreateRelationInput,
    tx?: DbClient,
  ) {
    return this.useTx(tx, async (client) => {
      const [source, target] = await Promise.all([
        this.repo.findById(fromId, tenantId, client),
        this.repo.findById(input.toId, tenantId, client),
      ]);
      if (!source || !target)
        throw ApiError.notFound(
          "One or both relation targets could not be verified",
        );
      const wouldLoop = await this.repo.pathExists(input.toId, fromId, client);
      if (wouldLoop)
        throw ApiError.conflict(
          "Establishing this relation would create a circular dependency",
        );
      return this.repo.createRelation(
        fromId,
        input.toId,
        input.type,
        input.metadata ?? undefined,
        client,
      );
    });
  }

  /**
   * FIX: Ownership check added — only the source resource author may sever its outgoing edges.
   * FIX: type is now required so we delete a specific typed edge, not all edges between two nodes.
   */
  async disconnectResources(
    fromId: string,
    toId: string,
    type: RelationType,
    userId: string,
    tenantId: string | null,
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      const source = await this.repo.findById(fromId, tenantId, client);
      if (!source) throw ApiError.notFound("Source resource not found");
      if (source.authorId !== userId) {
        throw ApiError.forbidden(
          "Only the source resource author can remove outgoing relations",
        );
      }
      await this.repo.deleteRelation(fromId, toId, type, client);
    });
  }

  // Telemetry
  async captureTelemetry(
    resourceId: string,
    actorId: string | null,
    tenantId: string | null,
    payload: {
      event: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
    },
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      await this.repo.createUsageRecord(
        {
          event: payload.event as never,
          sessionId: payload.sessionId,
          metadata: (payload.metadata as Prisma.InputJsonValue) ?? undefined,
          resource: { connect: { id: resourceId } },
          tenantId,
          ...(actorId && { user: { connect: { id: actorId } } }),
        },
        client,
      );
    });
  }

  // Tags
  async getResourceTags(
    resourceId: string,
    tenantId: string | null,
  ): Promise<Array<{ id: string; name: string; slug: string }>> {
    const resource = await this.repo.findById(resourceId, tenantId);
    if (!resource) throw ApiError.notFound("Resource not found");
    return resource.resourceTags.map((rt) => ({
      id: rt.tag.id,
      name: rt.tag.name,
      slug: rt.tag.slug,
    }));
  }

  /**
   * Attaches one or more tags to a resource within the same tenant.
   * Verifies resource existence, tag validity, and tenant scope before writing.
   */
  async attachTags(
    resourceId: string,
    tenantId: string | null,
    tagIds: string[],
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, tenantId, client);
      if (!resource) throw ApiError.notFound("Resource not found");

      const tagsExist = await this.repo.verifyTagsExist(tagIds, tenantId, client);
      if (!tagsExist) {
        throw ApiError.badRequest(
          "One or more tag IDs are invalid or belong to a different tenant",
        );
      }

      await this.repo.attachTagsToResource(resourceId, tenantId, tagIds, client);
    });
  }

  /**
   * Removes one or more tags from a resource.
   * Uses deleteMany — silently skips tag IDs not currently attached.
   */
  async detachTags(
    resourceId: string,
    tenantId: string | null,
    tagIds: string[],
    tx?: DbClient,
  ): Promise<void> {
    return this.useTx(tx, async (client) => {
      const resource = await this.repo.findById(resourceId, tenantId, client);
      if (!resource) throw ApiError.notFound("Resource not found");
      await this.repo.detachTagsFromResource(resourceId, tagIds, client);
    });
  }
}
