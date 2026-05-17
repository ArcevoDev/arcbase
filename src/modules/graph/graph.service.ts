import { GraphRepository } from "./graph.repository";
import { prisma } from "@/lib/prisma/prisma";
import { toSafeResourceDTO } from "../resources/resource.dto";

export const GraphService = {
  async getSmartRecommendations(resourceId: string) {
    // 1. Fetch current node details to extract tag arrays context
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { tags: { select: { id: true } } }
    });

    const tagIds = resource?.tags.map(t => t.id) || [];

    // 2. Fetch parallel recommendations routes from the repository concurrently
    const [tagRelated, directPrereqs] = await Promise.all([
      GraphRepository.findRelatedByTags(resourceId, tagIds),
      GraphRepository.findPrerequisites(resourceId)
    ]);

    // 3. Flatten and extract graph payloads safely
    const prerequisites = directPrereqs.map(rel => toSafeResourceDTO(rel.from));
    const related = tagRelated.map(res => toSafeResourceDTO(res));

    // 4. Sort results dynamically by their active engagement score metric
    const sortedSuggestions = [...related].sort((a: any, b: any) => {
      const scoreA = a.metrics?.engagementScore || 0;
      const scoreB = b.metrics?.engagementScore || 0;
      return scoreB - scoreA; // Highest popularity rating bubbles to the top
    });

    return { prerequisites, suggestions: sortedSuggestions.slice(0, 5) };
  }
};
