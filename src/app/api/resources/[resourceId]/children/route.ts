import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteParams {
  params: {
    resourceId: string;
  };
}

export const GET = handleApiRoute(async (req: NextRequest, { params }: RouteParams) => {
  await requireOnboarded(req);
  const tenantId = null; // Ghost Tenant placeholder for MVP
  const { resourceId } = params;

  // Direct, fast index scan tracking parent constraints
  const databaseChildren = await prisma.resource.findMany({
    where: {
      parentId: resourceId,
      tenantId,
      deletedAt: null,
    },
    include: resourceWithRelations,
    orderBy: { createdAt: "asc" },
  });

  const serializedChildren = databaseChildren.map((node) => toSafeResourceDTO(node));

  return NextResponse.json({
    success: true,
    count: serializedChildren.length,
    data: serializedChildren,
  });
});
