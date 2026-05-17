export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ resourceId: string }>;
}

export const POST = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { resourceId } = await context.params;
  const session = await requireAuth(req);

  const resource = await prisma.resource.findFirst({ where: { id: resourceId, deletedAt: null } });
  if (!resource) throw ApiError.notFound("Resource not found");

  if (resource.authorId !== session.userId) {
    throw ApiError.forbidden("You do not have permission to archive this resource");
  }

  if (resource.status === "ARCHIVED") {
    throw ApiError.badRequest("This resource is already archived");
  }

  const updatedResource = await prisma.resource.update({
    where: { id: resourceId },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date(),
    },
    include: resourceWithRelations,
  });

  return NextResponse.json(
    {
      message: "Resource archived successfully",
      resource: toSafeResourceDTO(updatedResource),
    },
    { status: 200 }
  );
});
