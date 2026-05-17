export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { getSession } from "@/modules/auth/get-session";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await getSession(req);

  const parent = await prisma.resource.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!parent) {
    throw ApiError.notFound("The specified parent folder or resource does not exist");
  }

  const isAuthor = session?.userId === parent.authorId;
  const filterConditions: any = {
    parentId: resourceId,
    deletedAt: null,
  };

  if (!isAuthor) {
    filterConditions.status = "PUBLISHED";
    filterConditions.visibility = "PUBLIC";
  }

  const subResources = await prisma.resource.findMany({
    where: filterConditions,
    orderBy: { createdAt: "asc" },
    include: resourceWithRelations,
  });

  return NextResponse.json(subResources.map(toSafeResourceDTO), { status: 200 });
});
