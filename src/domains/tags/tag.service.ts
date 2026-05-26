// domains/tags/tag.service.ts
//
// TagService owns the lifecycle of Tag records — creation, listing, lookup.
// It does NOT manage resource-tag associations. Those operations belong to
// ResourceService (attachTags / detachTags / getResourceTags), which carry
// tenantId through the full pipeline and participate in FlowExecutor transactions.
//
// Removed from original:
//   linkTagsToResource   → ResourceService.attachTags
//   unlinkTagsFromResource → ResourceService.detachTags
//   getResourceTags      → ResourceService.getResourceTags

import { TagRepository } from "./tag.repository";
import { CreateTagInput, SafeTagDTO, toSafeTagDTO } from "./tag.dto";
import { ApiError } from "@/lib/errors/api-error";

export class TagService {
  private repo: TagRepository;

  constructor() {
    this.repo = new TagRepository();
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s\-_.]/g, "")
      .replace(/[\s_]+/g, "-");
  }

  async getAllTags(tenantId: string | null = null): Promise<SafeTagDTO[]> {
    const tags = await this.repo.listAll(tenantId);
    return tags.map(toSafeTagDTO);
  }

  async getTagById(id: string): Promise<SafeTagDTO> {
    const tag = await this.repo.findById(id);
    if (!tag) throw ApiError.notFound("Tag not found");
    return toSafeTagDTO(tag);
  }

  async createTag(
    input: CreateTagInput,
    tenantId: string | null = null,
  ): Promise<SafeTagDTO> {
    const slug = this.generateSlug(input.name);

    // Unique constraint: [tenantId, slug] — check before hitting the DB unique error
    const existingBySlug = await this.repo.findBySlug(slug, tenantId);
    if (existingBySlug) {
      throw ApiError.conflict(
        `Tag "${input.name}" already exists in this namespace`,
      );
    }

    const tag = await this.repo.create({ name: input.name, slug, tenantId });
    return toSafeTagDTO(tag);
  }
}
