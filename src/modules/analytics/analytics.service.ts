import { AnalyticsRepository } from "./analytics.repository";

export const AnalyticsService = {
  async compileDashboard(userId: string) {
    // 1. Fetch raw rows
    const rawMetrics = await AnalyticsRepository.getRawMetricsForUser(userId);

    // 2. Compute engagement scoring weights mathematically inside an atomic background loop
    // Formula: Score = (Views * 1) + (Opens * 2) + (Likes * 5) + (Downloads * 10)
    if (rawMetrics.length > 0) {
      for (const metric of rawMetrics) {
        const calculatedScore = 
          (metric.views * 1) + 
          (metric.opens * 2) + 
          (metric.likes * 5) + 
          (metric.downloads * 10);
        
        await AnalyticsRepository.updateEngagementScore(metric.id, parseFloat(calculatedScore.toFixed(2)));
      }
    }

    // 3. Compile high-level aggregated data structures
    const [totalResources, totalViews, totalDownloads, engagementLeaders] = 
      await AnalyticsRepository.getDashboardSummary(userId);

    return {
      summary: {
        totalCreatedNodes: totalResources,
        totalViewsAccumulated: totalViews._sum.views || 0,
        totalOpensAccumulated: totalViews._sum.opens || 0,
        totalLikesAccumulated: totalViews._sum.likes || 0,
        totalDownloadsAccumulated: totalDownloads._sum.downloads || 0
      },
      topPerformingAssets: engagementLeaders.map(leader => ({
        resourceId: leader.resourceId,
        title: leader.resource.title,
        slug: leader.resource.slug,
        type: leader.resource.type,
        stats: {
          views: leader.views,
          likes: leader.likes,
          downloads: leader.downloads,
          engagementScore: leader.engagementScore
        }
      }))
    };
  }
};
