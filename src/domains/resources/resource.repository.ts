import {
  Prisma,
  ResourceStatus,
  Visibility,
  RelationType,
  CommentStatus,
  ResourceTypeRenderer,
} from "@/prisma-client";
import { prisma } from "@/lib/prisma/prisma";
import { DbClient } from "@/lib/db-client";

export const resourceWithRelations = {
  author: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  resourceTags: {
    include: { tag: true },
  },
  metrics: true,
  _count: {
    select: {
      children: true,
      comments: true,
      versions: true,
    },
  },
} satisfies Prisma.ResourceInclude;

type ListParams = {
  tenantId: string | null;
  authorId?: string;
  type?: string;
  status?: ResourceStatus;
  visibility?: Visibility;
  search?: string;
  parentId?: string | null;
  tags?: string[];
};

export class ResourceRepository {
  private db(tx?: DbClient) {
    return tx ?? prisma;
  }

  // Private helpers
  private buildWhereClause(params: ListParams): Prisma.ResourceWhereInput {
    const where: Prisma.ResourceWhereInput = {
      ...(params.tenantId !== null && { tenantId: params.tenantId }),
      deletedAt: null,
    };

    if (params.authorId) where.authorId = params.authorId;
    if (params.type) where.type = params.type as ResourceTypeRenderer;
    if (params.status) where.status = params.status;
    if (params.visibility) where.visibility = params.visibility;
    if (params.parentId !== undefined) where.parentId = params.parentId;

    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { content: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }

    if (params.tags && params.tags.length > 0) {
      where.resourceTags = {
        some: { tag: { slug: { in: params.tags } } },
      };
    }

    return where;
  }

  // Resource CRUD
  async findById(id: string, tenantId: string | null = null, tx?: DbClient) {
    return this.db(tx).resource.findFirst({
      where: { id, ...(tenantId !== null && { tenantId }), deletedAt: null },
      include: resourceWithRelations,
    });
  }

  async findManyByIds(
    ids: string[],
    tenantId: string | null = null,
    tx?: DbClient,
  ) {
    return this.db(tx).resource.findMany({
      where: {
        id: { in: ids },
        ...(tenantId !== null && { tenantId }),
        deletedAt: null,
      },
    });
  }

  async findBySlug(
    slug: string,
    authorId: string,
    tenantId: string | null = null,
    tx?: DbClient,
  ) {
    return this.db(tx).resource.findFirst({
      where: {
        slug,
        authorId,
        ...(tenantId !== null && { tenantId }),
        deletedAt: null,
      },
      include: resourceWithRelations,
    });
  }

  async findChildren(
    parentId: string,
    tenantId: string | null = null,
    options: { limit: number; cursor?: string },
    tx?: DbClient,
  ) {
    return this.db(tx).resource.findMany({
      where: {
        parentId,
        ...(tenantId !== null && { tenantId }),
        deletedAt: null,
      },
      include: resourceWithRelations,
      orderBy: { createdAt: "asc" },
      take: options.limit + 1, // fetch one extra to determine if there is a next page
      ...(options.cursor && { cursor: { id: options.cursor }, skip: 1 }),
    });
  }

  async findAll(
    params: ListParams & {
      limit?: number;
      skip?: number;
      sortBy?: string;
      order?: "asc" | "desc";
    },
    tx?: DbClient,
  ) {
    const {
      limit = 20,
      skip = 0,
      sortBy = "createdAt",
      order = "desc",
      ...rest
    } = params;
    return this.db(tx).resource.findMany({
      where: this.buildWhereClause(rest),
      include: resourceWithRelations,
      orderBy: { [sortBy]: order },
      take: limit,
      skip,
    });
  }

  async countAll(params: ListParams, tx?: DbClient) {
    return this.db(tx).resource.count({ where: this.buildWhereClause(params) });
  }

  async create(data: Prisma.ResourceCreateInput, tx?: DbClient) {
    return this.db(tx).resource.create({
      data,
      include: resourceWithRelations,
    });
  }

  async initializeMetrics(resourceId: string, tx?: DbClient) {
    return this.db(tx).resourceMetrics.create({ data: { resourceId } });
  }

  async update(
    id: string,
    tenantId: string | null,
    data: Prisma.ResourceUpdateInput,
    tx?: DbClient,
  ) {
    return this.db(tx).resource.update({
      where: { id, ...(tenantId !== null && { tenantId }) },
      data,
      include: resourceWithRelations,
    });
  }

  async deleteSoft(id: string, tenantId: string | null, tx?: DbClient) {
    return this.db(tx).resource.update({
      where: { id, ...(tenantId !== null && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    tenantId: string | null,
    status: ResourceStatus,
    tx?: DbClient,
  ) {
    return this.db(tx).resource.updateMany({
      where: { id: { in: ids }, ...(tenantId !== null && { tenantId }) },
      data: { status, updatedAt: new Date() },
    });
  }

  async bulkDeleteSoft(ids: string[], tenantId: string | null, tx?: DbClient) {
    return this.db(tx).resource.updateMany({
      where: { id: { in: ids }, ...(tenantId !== null && { tenantId }) },
      data: { deletedAt: new Date() },
    });
  }

  // Tag management
  async verifyTagsExist(
    tagIds: string[],
    tenantId: string | null,
    tx?: DbClient,
  ) {
    const records = await this.db(tx).tag.findMany({
      where: { id: { in: tagIds }, ...(tenantId !== null && { tenantId }) },
    });
    return records.length === tagIds.length;
  }

  async attachTagsToResource(
    resourceId: string,
    tenantId: string | null,
    tagIds: string[],
    tx?: DbClient,
  ) {
    const data = tagIds.map((tagId) => ({ resourceId, tagId, tenantId }));
    return this.db(tx).resourceTag.createMany({ data, skipDuplicates: true });
  }

  async detachTagsFromResource(
    resourceId: string,
    tagIds: string[],
    tx?: DbClient,
  ) {
    return this.db(tx).resourceTag.deleteMany({
      where: { resourceId, tagId: { in: tagIds } },
    });
  }

  async clearResourceTags(resourceId: string, tx?: DbClient) {
    return this.db(tx).resourceTag.deleteMany({ where: { resourceId } });
  }

  // Versioning
  async findHighestVersion(resourceId: string, tx?: DbClient) {
    return this.db(tx).resourceVersion.findFirst({
      where: { resourceId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });
  }

  async createVersion(
    resourceId: string,
    data: Prisma.ResourceVersionCreateInput,
    tx?: DbClient,
  ) {
    return this.db(tx).resourceVersion.create({ data });
  }

  async findVersions(resourceId: string, tx?: DbClient) {
    return this.db(tx).resourceVersion.findMany({
      where: { resourceId },
      orderBy: { versionNumber: "desc" },
      include: { author: { select: { id: true, username: true } } },
    });
  }

  async findVersionByNumber(
    resourceId: string,
    versionNumber: number,
    tx?: DbClient,
  ) {
    return this.db(tx).resourceVersion.findUnique({
      where: { resourceId_versionNumber: { resourceId, versionNumber } },
    });
  }

  // Comments
  async createComment(data: Prisma.CommentCreateInput, tx?: DbClient) {
    return this.db(tx).comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async findCommentById(id: string, tenantId: string | null, tx?: DbClient) {
    return this.db(tx).comment.findFirst({
      where: { id, ...(tenantId !== null && { tenantId }), deletedAt: null },
    });
  }

  async updateCommentStatus(id: string, status: CommentStatus, tx?: DbClient) {
    return this.db(tx).comment.update({
      where: { id },
      data: {
        status,
        ...(status === CommentStatus.DELETED && { deletedAt: new Date() }),
      },
    });
  }

  async findCommentsByResource(
    resourceId: string,
    tenantId: string | null,
    tx?: DbClient,
  ) {
    return this.db(tx).comment.findMany({
      where: {
        resourceId,
        ...(tenantId !== null && { tenantId }),
        deletedAt: null,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  // Telemetry
  async createUsageRecord(
    data: Prisma.ResourceUsageCreateInput,
    tx?: DbClient,
  ) {
    return this.db(tx).resourceUsage.create({ data });
  }

  async incrementMetric(
    resourceId: string,
    metricColumn: keyof Omit<
      Prisma.ResourceMetricsUpdateInput,
      "id" | "resource" | "resourceId"
    >,
    tx?: DbClient,
  ) {
    return this.db(tx).resourceMetrics.upsert({
      where: { resourceId },
      create: { resourceId, [metricColumn]: 1 },
      update: { [metricColumn]: { increment: 1 } },
    });
  }

  // Graph relations
  async createRelation(
    fromId: string,
    toId: string,
    type: RelationType,
    metadata?: Prisma.InputJsonValue,
    tx?: DbClient,
  ) {
    return this.db(tx).relation.create({
      data: { fromId, toId, type, metadata: metadata ?? undefined },
    });
  }

  async deleteRelation(
    fromId: string,
    toId: string,
    type: RelationType,
    tx?: DbClient,
  ) {
    return this.db(tx).relation.delete({
      where: { fromId_toId_type: { fromId, toId, type } },
    });
  }

  /**
   * Checks whether a directed path exists from `startId` to `targetId` using a
   * single recursive SQL CTE — replaces the original BFS which fired one DB
   * query per graph node (N+1 problem).
   *
   * The depth cap (200) prevents runaway traversal on pathological graphs and
   * also protects against any pre-existing cycles that snuck past the guard.
   */
  async pathExists(
    startId: string,
    targetId: string,
    tx?: DbClient,
  ): Promise<boolean> {
    if (startId === targetId) return true;

    const result = await this.db(tx).$queryRaw<Array<{ found: boolean }>>`
      WITH RECURSIVE traversal(node_id, depth) AS (
        SELECT "toId", 1
        FROM   "Relation"
        WHERE  "fromId" = ${startId}

        UNION

        SELECT r."toId", t.depth + 1
        FROM   "Relation" r
        INNER JOIN traversal t ON r."fromId" = t.node_id
        WHERE  t.depth < 200
      )
      SELECT EXISTS (
        SELECT 1 FROM traversal WHERE node_id = ${targetId}
      )::boolean AS found
    `;

    return result[0]?.found === true;
  }
}
