import { SearchRepository } from "./search.repository";
import { SearchFiltersInput } from "./search.dto";
import { ResourceType } from "@/prisma-client";

export class SearchService {
  private repo: SearchRepository;

  constructor() {
    this.repo = new SearchRepository();
  }

  async executeQuery(filters: SearchFiltersInput, tenantId: string | null = null) {
    const limit = parseInt(filters.limit, 10);
    const page = parseInt(filters.page, 10);
    const skip = (page - 1) * limit;

    const { totalItems, items } = await this.repo.queryResources({
      searchTerm: filters.q,
      type: filters.type as ResourceType | undefined,
      tagId: filters.tagId,
      limit,
      skip,
      tenantId,
    });

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  }
}
