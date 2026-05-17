import { prisma } from "@/lib/prisma/prisma";

export const GraphRepository = {
  // Looks up items that share the exact same tag array keywords 
  async findRelatedByTags(resourceId: string, tagIds: string[]) {
    return prisma.resource.findMany({
      where: {
        id: { not: resourceId },
        deletedAt: null,
        status: "PUBLISHED",
        visibility: "PUBLIC",
        tags: { some: { id: { in: tagIds } } }
      },
      take: 5,
      include: { metrics: true }
    });
  },

  // Looks up direct prerequisite nodes declared in the Relation matrix graph table
  async findPrerequisites(resourceId: string) {
    return prisma.relation.findMany({
      where: { toId: resourceId, type: "PREREQUISITE" },
      include: { from: { include: { metrics: true } } }
    });
  }
};
