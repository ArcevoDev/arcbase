import { CollectionRepository } from "@/modules/collections/collection.repository";
import { ApiError } from "@/lib/errors/api-error";
import { CreateCollectionInput } from "@/modules/collections/collection.dto";
import { prisma } from "@/lib/prisma/prisma";
import crypto from "crypto";

export const CollectionService = {
  async getUserCollections(userId: string) {
    return CollectionRepository.findByAuthor(userId);
  },

  async createCollection(userId: string, input: CreateCollectionInput) {
    const baseSlug = input.title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    const shortId = crypto.randomBytes(4).toString("hex");
    const uniqueSlug = `${baseSlug}-${shortId}`;

    return CollectionRepository.create({
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      slug: uniqueSlug,
      authorId: userId,
    });
  },

  async addResourceToFolder(
    userId: string,
    collectionId: string,
    resourceId: string,
    order: number,
  ) {
    const collection = await CollectionRepository.findById(collectionId);
    if (!collection || collection.deletedAt) {
      throw ApiError.notFound("Target curation collection no longer exists");
    }
    if (collection.authorId !== userId) {
      throw ApiError.forbidden("You do not have permission to modify this collection");
    }

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId, deletedAt: null },
    });
    if (!resource) throw ApiError.notFound("Target resource could not be found or has been removed");

    const existingLink = await prisma.collectionResource.findUnique({
      where: { collectionId_resourceId: { collectionId, resourceId } },
    });
    if (existingLink) {
      throw ApiError.badRequest("This resource is already linked inside this collection");
    }

    return CollectionRepository.linkResource(collectionId, resourceId, order);
  },

  async removeResourceFromFolder(
    userId: string,
    collectionId: string,
    resourceId: string,
  ) {
    const collection = await CollectionRepository.findById(collectionId);
    if (!collection || collection.deletedAt) {
      throw ApiError.notFound("Target collection not found");
    }
    if (collection.authorId !== userId) {
      throw ApiError.forbidden("You do not have permission to modify this collection");
    }

    // Direct error interception ensures handling missing item relationships cleanly
    try {
      return await CollectionRepository.unlinkResource(collectionId, resourceId);
    } catch {
      throw ApiError.badRequest("Target resource reference links do not exist inside this folder matching parameters");
    }
  },
};
