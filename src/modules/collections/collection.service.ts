import { CollectionRepository } from "./collection.repository";
import { CreateCollectionInput } from "./collection.dto";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";

export class CollectionService {
  private repo: CollectionRepository;

  constructor() {
    this.repo = new CollectionRepository();
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s\-_.]/g, "")
      .replace(/[\s_]+/g, "-");
  }

  async getUserCollections(userId: string, tenantId: string | null = null) {
    return this.repo.listUserCollections(userId, tenantId);
  }

  async getCollectionDetails(id: string) {
    const collection = await this.repo.findById(id);
    if (!collection)
      throw ApiError.notFound("Requested learning collection not found");
    return collection;
  }

  async createCollection(
    authorId: string,
    input: CreateCollectionInput,
    tenantId: string | null = null,
  ) {
    const slug = this.generateSlug(input.title);
    const existing = await this.repo.findBySlug(authorId, slug, tenantId);
    if (existing) {
      throw ApiError.badRequest(
        `You already have a collection with a variant of this name titled: [${input.title}]`,
      );
    }

    return this.repo.create({
      title: input.title,
      slug,
      description: input.description,
      visibility: input.visibility as any,
      metadata: input.metadata,
      authorId,
      tenantId,
    });
  }

  async addResource(
    collectionId: string,
    authorId: string,
    resourceId: string,
  ) {
    const collection = await this.repo.findById(collectionId);
    if (!collection) throw ApiError.notFound("Collection not found");
    if (collection.authorId !== authorId)
      throw ApiError.forbidden("Ownership mismatch protection triggered");

    const resourceExists = await prisma.resource.findFirst({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resourceExists)
      throw ApiError.notFound("Target resource missing or removed");

    const alreadyLinked = await prisma.collectionResource.findUnique({
      where: { collectionId_resourceId: { collectionId, resourceId } },
    });
    if (alreadyLinked) return alreadyLinked;

    return this.repo.appendResource(collectionId, resourceId);
  }

  async removeResource(
    collectionId: string,
    authorId: string,
    resourceId: string,
  ) {
    const collection = await this.repo.findById(collectionId);
    if (!collection) throw ApiError.notFound("Collection not found");
    if (collection.authorId !== authorId)
      throw ApiError.forbidden("Ownership mismatch protection triggered");

    await this.repo.removeResource(collectionId, resourceId);
  }

  async reorderCollectionItems(
    collectionId: string,
    authorId: string,
    orderedItemIds: string[],
  ) {
    const collection = await this.repo.findById(collectionId);
    if (!collection) throw ApiError.notFound("Collection not found");
    if (collection.authorId !== authorId)
      throw ApiError.forbidden("Ownership mismatch protection triggered");

    await this.repo.executeSequenceReorder(collectionId, orderedItemIds);
  }

  async deleteCollection(id: string, authorId: string) {
    const collection = await this.repo.findById(id);
    if (!collection) throw ApiError.notFound("Collection not found");
    if (collection.authorId !== authorId)
      throw ApiError.forbidden("Ownership mismatch protection triggered");

    await this.repo.softDelete(id);
  }
}
