export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { getSession } from "@/modules/auth/get-session"; // Added to dynamically adapt user viewing context
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

// GET /api/resources/[resourceId]/children -> Fetch nested sub-resources tree
export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await getSession(req);

  // 1. Verify that the parent resource exists and hasn't been soft deleted
  const parent = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!parent || parent.deletedAt) {
    throw ApiError.notFound("The specified parent folder or resource does not exist");
  }

  // 2. Formulate query filters dynamically based on user context
  const isAuthor = session?.userId === parent.authorId;
  const filterConditions: any = {
    parentId: resourceId,
    deletedAt: null,
  };

  // If the visitor is NOT the author, completely restrict draft children nodes from leaking
  if (!isAuthor) {
    filterConditions.status = "PUBLISHED";
    filterConditions.visibility = "PUBLIC";
  }

  // 3. Fetch all children rows
  const subResources = await prisma.resource.findMany({
    where: filterConditions,
    orderBy: { createdAt: "asc" }, // Keeps sub-pages sorted chronologically (Chapter 1 -> Chapter 2)
    include: resourceWithRelations,
  });

  return NextResponse.json(subResources.map(toSafeResourceDTO), { status: 200 });
});
