import { prisma } from "@/lib/prisma/prisma";

export const AnalyticsRepository = {
  async getRawMetricsForUser(userId: string) {
    return prisma.resourceMetrics.findMany({
      where: { resource: { authorId: userId, deletedAt: null } },
      select: { id: true, views: true, opens: true, likes: true, downloads: true }
    });
  },

  async updateEngagementScore(metricId: string, score: number) {
    return prisma.resourceMetrics.update({
      where: { id: metricId },
      data: { engagementScore: score }
    });
  },

  async getDashboardSummary(userId: string) {
    return prisma.$transaction([
      prisma.resource.count({ where: { authorId: userId, deletedAt: null } }),
      prisma.resourceMetrics.aggregate({
        where: { resource: { authorId: userId } },
        _sum: { views: true, opens: true, likes: true }
      }),
      prisma.resourceMetrics.aggregate({
        where: { resource: { authorId: userId } },
        _sum: { downloads: true }
      }),
      prisma.resourceMetrics.findMany({
        where: { resource: { authorId: userId, deletedAt: null } },
        orderBy: { views: "desc" },
        take: 5,
        include: { resource: { select: { title: true, slug: true, type: true } } }
      })
    ]);
  }
};
