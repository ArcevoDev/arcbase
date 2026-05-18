import { TagRepository } from "./tag.repository";
import { CreateTagInput } from "./tag.dto";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";

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

  async getAllTags(tenantId: string | null = null) {
    return this.repo.listAll(tenantId);
  }

  async createTag(input: CreateTagInput, tenantId: string | null = null) {
    const slug = this.generateSlug(input.name);

    const existing = await this.repo.findBySlug(slug, tenantId);
    if (existing) {
      throw ApiError.badRequest(
        `Tag term [${input.name}] has already been indexed inside this namespace boundary`,
      );
    }

    return this.repo.create({
      name: input.name,
      slug,
      tenantId,
    });
  }

  async getResourceTags(resourceId: string) {
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!resourceExists)
      throw ApiError.notFound("Target resource asset missing");

    return this.repo.findTagsByResource(resourceId);
  }

  async linkTagsToResource(resourceId: string, tagIds: string[]) {
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!resourceExists)
      throw ApiError.notFound("Target resource asset missing");

    // Enforce index verification to make sure target IDs exist
    const validTagsCount = await prisma.tag.count({
      where: { id: { in: tagIds } },
    });

    if (validTagsCount !== tagIds.length) {
      throw ApiError.badRequest(
        "One or more provided Tag IDs do not exist in the master index database",
      );
    }

    await this.repo.attachTagsToResource(resourceId, tagIds);
  }

  async unlinkTagsFromResource(resourceId: string, tagIds: string[]) {
    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
      select: { id: true },
    });
    if (!resourceExists)
      throw ApiError.notFound("Target resource asset missing");

    await this.repo.detachTagsFromResource(resourceId, tagIds);
  }
}
