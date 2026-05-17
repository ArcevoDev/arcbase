export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

// GET /api/search/resources?q=keyword&type=ARTICLE -> Targeted Asset Search
export const GET = handleApiRoute(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";
  const typeFilter = searchParams.get("type") || undefined;
  const categoryFilter = searchParams.get("category") || undefined;

  // Formulate dynamic search arrays safely
  const searchConditions: any = {
    deletedAt: null,
    status: "PUBLISHED",
    visibility: "PUBLIC",
  };

  if (typeFilter) searchConditions.type = typeFilter;
  if (categoryFilter) searchConditions.category = categoryFilter;

  // Execute high-speed cross-field string containment vectors if query string text is provided
  if (query) {
    searchConditions.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
      { excerpt: { contains: query, mode: "insensitive" } },
      { category: { contains: query, mode: "insensitive" } },
      { tags: { some: { name: { contains: query, mode: "insensitive" } } } }
    ];
  }

  const matches = await prisma.resource.findMany({
    where: searchConditions,
    take: 20, // Strict threshold boundary cap to optimize network processing weight
    orderBy: { createdAt: "desc" },
    include: resourceWithRelations,
  });

  return NextResponse.json(matches.map(toSafeResourceDTO), { status: 200 });
});
