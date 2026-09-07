import { prisma } from "@/core/db";
import type { DbClient } from "@/core/flows/flow-context";
import { TagRepository } from "./tag.repository";
import type { CreateTagInput } from "./tag.dto";

export class TagService {
  repo: TagRepository;
  constructor(db: DbClient = prisma) { this.repo = new TagRepository(db); }

  async getAllTags(tenantId?: string | null) {
    return this.repo.findAll(tenantId);
  }

  async createTag(input: CreateTagInput, tenantId?: string | null) {
    return this.repo.upsert(input.name, tenantId ?? undefined);
  }
}
