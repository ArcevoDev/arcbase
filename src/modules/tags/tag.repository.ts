import { prisma } from "@/lib/prisma/prisma";

export class TagRepository {
  async findById(id: string) {
    return prisma.tag.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string, tenantId: string | null = null) {
    return prisma.tag.findFirst({
      where: { slug, tenantId },
    });
  }

  async listAll(tenantId: string | null = null) {
    return prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string; slug: string; tenantId: string | null }) {
    return prisma.tag.create({
      data,
    });
  }

  // Leverage Prisma's native implicit relation write mechanics
  async attachTagsToResource(resourceId: string, tagIds: string[]) {
    return prisma.resource.update({
      where: { id: resourceId },
      data: {
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
      },
    });
  }

  async detachTagsFromResource(resourceId: string, tagIds: string[]) {
    return prisma.resource.update({
      where: { id: resourceId },
      data: {
        tags: {
          disconnect: tagIds.map((id) => ({ id })),
        },
      },
    });
  }

  async findTagsByResource(resourceId: string) {
    const resourceWithTags = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: {
        tags: {
          orderBy: { name: "asc" },
        },
      },
    });
    return resourceWithTags?.tags || [];
  }
}
