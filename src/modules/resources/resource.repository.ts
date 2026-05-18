import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { Prisma, ResourceStatus, RelationType } from "@/prisma-client";

export class ResourceRepository {
  async findById(id: string, tenantId: string | null = null) {
    return prisma.resource.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: resourceWithRelations,
    });
  }

  async findBySlug(slug: string, authorId: string, tenantId: string | null = null) {
    return prisma.resource.findFirst({
      where: {
        slug,
        authorId,
        tenantId,
        deletedAt: null,
      },
      include: resourceWithRelations,
    });
  }

  async findAll(params: {
    tenantId: string | null;
    authorId?: string;
    type?: string;
    status?: ResourceStatus;
    search?: string;
    limit?: number;
    skip?: number;
  }) {
    const { tenantId, authorId, type, status, search, limit = 20, skip = 0 } = params;

    const whereClause: Prisma.ResourceWhereInput = {
      tenantId,
      deletedAt: null,
    };

    if (authorId) whereClause.authorId = authorId;
    if (type) whereClause.type = type as any;
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    return prisma.resource.findMany({
      where: whereClause,
      include: resourceWithRelations,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });
  }

  async create(authorId: string, type: any, tenantId: string | null = null) {
    return prisma.$transaction(async (tx) => {
      const resource = await tx.resource.create({
        data: {
          authorId,
          type,
          tenantId,
          status: ResourceStatus.DRAFT,
        },
        include: resourceWithRelations,
      });

      // Initialize empty metric containers concurrently
      await tx.resourceMetrics.create({
        data: {
          resourceId: resource.id,
        },
      });

      return resource;
    });
  }

  async update(id: string, data: Prisma.ResourceUpdateInput) {
    return prisma.resource.update({
      where: { id },
      data,
      include: resourceWithRelations,
    });
  }

  async publish(id: string, publishedContentJson: Prisma.InputJsonValue) {
    return prisma.resource.update({
      where: { id },
      data: {
        status: ResourceStatus.PUBLISHED,
        publishedAt: new Date(),
        publishedContentJson,
      },
      include: resourceWithRelations,
    });
  }

  async deleteSoft(id: string) {
    return prisma.resource.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // GRAPH ENGINE: Create a direct dependency line between nodes
  async createRelation(fromId: string, toId: string, type: RelationType, metadata?: Prisma.InputJsonValue) {
    return prisma.relation.create({
      data: {
        fromId,
        toId,
        type,
        metadata: metadata || undefined,
      },
    });
  }

  async deleteRelation(fromId: string, toId: string, type: RelationType) {
    return prisma.relation.delete({
      where: {
        fromId_toId_type: { fromId, toId, type },
      },
    });
  }

  async getOutgoingRelations(resourceId: string) {
    return prisma.relation.findMany({
      where: { fromId: resourceId },
      include: { to: true },
    });
  }

  // GRAPH INTEGRITY CHECK: Recursive query using application memory 
  // to find if a cycle path would exist from `startId` back to `targetId`
  async pathExists(startId: string, targetId: string, visited: Set<string> = new Set()): Promise<boolean> {
    if (startId === targetId) return true;
    if (visited.has(startId)) return false;

    visited.add(startId);

    const connections = await prisma.relation.findMany({
      where: { fromId: startId },
      select: { toId: true },
    });

    for (const connection of connections) {
      const found = await this.pathExists(connection.toId, targetId, visited);
      if (found) return true;
    }

    return false;
  }
}
