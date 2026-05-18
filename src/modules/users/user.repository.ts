import { prisma } from "@/lib/prisma/prisma";
import { Prisma } from "@/prisma-client";

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  async findByUsername(username: string) {
    return prisma.user.findFirst({
      where: { username, deletedAt: null },
    });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data: {
        ...data,
        email: data.email.toLowerCase(),
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateProfileData(
    id: string,
    data: {
      displayName?: string | null;
      avatarUrl?: string | null;
      bio?: string | null;
    },
  ) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  async findAllActiveDirectoryUsers() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async administrativeSystemOverride(
    id: string,
    updates: { archivedAt: Date | null; deletedAt: Date | null },
  ) {
    return prisma.user.update({
      where: { id },
      data: updates,
    });
  }

  async findUserNestedResources(userId: string, requestorId: string | null) {
    const isOwner = userId === requestorId;
    return prisma.resource.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
        // Blocks non-owners from discovering PRIVATE resources
        visibility: isOwner ? undefined : { in: ["PUBLIC", "UNLISTED"] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        status: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findUserNestedCollections(userId: string, requestorId: string | null) {
    const isOwner = userId === requestorId;
    return prisma.collection.findMany({
      where: {
        authorId: userId,
        deletedAt: null,
        visibility: isOwner ? undefined : { in: ["PUBLIC", "UNLISTED"] },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        visibility: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findUserNestedSaved(userId: string) {
    return prisma.savedResource.findMany({
      where: { userId },
      include: {
        resource: {
          select: {
            id: true,
            title: true,
            slug: true,
            type: true,
            status: true,
            visibility: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPortfolioCounters(userId: string) {
    const [resourcesCount, collectionsCount, savedCount] =
      await prisma.$transaction([
        prisma.resource.count({ where: { authorId: userId, deletedAt: null } }),
        prisma.collection.count({
          where: { authorId: userId, deletedAt: null },
        }),
        prisma.savedResource.count({ where: { userId } }),
      ]);

    return {
      totalContributions: resourcesCount,
      collectionsCreatedCount: collectionsCount,
      savedResourcesCount: savedCount,
    };
  }

  async fetchChronologicalTelemetryEvents(
    userId: string,
    lookbackDays: number = 365,
  ) {
    const pastBoundaryDate = new Date();
    pastBoundaryDate.setDate(pastBoundaryDate.getDate() - lookbackDays);

    return prisma.resourceUsage.findMany({
      where: { userId, createdAt: { gte: pastBoundaryDate } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });
  }
}
