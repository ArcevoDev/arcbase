// domains/tags/tag.repository.ts
//
// Tags are pure reference / taxonomy data. This repository owns ONLY tag records.
// Resource-tag associations (ResourceTag join table) are intentionally NOT here —
// they belong to ResourceRepository, which is tenant-aware and transaction-aware.
// Keeping both here would create two code paths for the same operation, which
// already caused the tags.connect bug we fixed earlier.
//
// What lives here:  create tag, find tag, list tags, slug uniqueness check
// What does NOT:    attachTagsToResource, detachTagsFromResource, findTagsByResource
//                   → use ResourceRepository / ResourceService for those

import { prisma } from "@/lib/prisma/prisma";

export class TagRepository {
  async findById(id: string) {
    return prisma.tag.findUnique({ where: { id } });
  }

  async findBySlug(slug: string, tenantId: string | null = null) {
    return prisma.tag.findFirst({
      where: { slug, tenantId },
    });
  }

  async findByName(name: string, tenantId: string | null = null) {
    return prisma.tag.findFirst({
      where: { name, tenantId },
    });
  }

  async listAll(tenantId: string | null = null) {
    return prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: "asc" },
    });
  }

  async create(data: { name: string; slug: string; tenantId: string | null }) {
    return prisma.tag.create({ data });
  }
}
