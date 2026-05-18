import { prisma } from "@/lib/prisma/prisma";
import { ResourceType, Prisma } from "@/prisma-client";

export interface ExecutionSearchQueryArgs {
  searchTerm: string;
  type?: ResourceType;
  tagId?: string;
  limit: number;
  skip: number;
  tenantId: string | null;
}

export class SearchRepository {
  async queryResources(args: ExecutionSearchQueryArgs) {
    // Build type-safe conditional matching clauses
    const whereClause: Prisma.ResourceWhereInput = {
      deletedAt: null,
      tenantId: args.tenantId,
    };

    if (args.type) {
      whereClause.type = args.type;
    }

    if (args.tagId) {
      whereClause.tags = {
        some: { id: args.tagId },
      };
    }

    if (args.searchTerm.trim().length > 0) {
      whereClause.OR = [
        { title: { contains: args.searchTerm, mode: "insensitive" } },
        { excerpt: { contains: args.searchTerm, mode: "insensitive" } },
        { content: { contains: args.searchTerm, mode: "insensitive" } },
      ];
    }

    // Execute concurrent count and select operations to optimize network overhead
    const [totalItems, items] = await prisma.$transaction([
      prisma.resource.count({ where: whereClause }),
      prisma.resource.findMany({
        where: whereClause,
        take: args.limit,
        skip: args.skip,
        orderBy: { createdAt: "desc" },
        include: {
          tags: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    return { totalItems, items };
  }
}
