import type { DbClient } from "@/core/flows/flow-context";

export class TagRepository {
  constructor(private db: DbClient) {}

  async findAll(tenantId?: string | null) {
    return this.db.tag.findMany({
      where:   { tenantId },
      include: { _count: { select: { resources: true } } },
      orderBy: { name: "asc" },
    });
  }

  async upsert(name: string, tenantId?: string | null) {
    const slug = name.toLowerCase().replace(/s+/g, "-");
    return this.db.tag.upsert({
      where:  { tenantId_slug: { tenantId: tenantId ?? null, slug } },
      create: { name, slug, tenantId: tenantId ?? null },
      update: {},
    });
  }
}
