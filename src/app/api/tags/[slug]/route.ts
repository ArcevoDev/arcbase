export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ slug: string }>;
}

// GET /api/tags/[slug] -> Fetch resources bound to this explicit keyword tag
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { slug } = await context.params;

  if (!slug) throw ApiError.badRequest("Tag slug parameter context is required");

  const resources = await prisma.resource.findMany({
    where: {
      deletedAt: null,
      status: "PUBLISHED",
      visibility: "PUBLIC",
      tags: {
        some: {
          slug: slug.trim().toLowerCase()
        }
      }
    },
    include: resourceWithRelations,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json(resources.map(toSafeResourceDTO), { status: 200 });
});
