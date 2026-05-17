export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { getSession } from "@/modules/auth/get-session";
import { prisma } from "@/lib/prisma/prisma";
import { resourceWithRelations } from "@/lib/prisma/prisma-helpers";
import { toSafeResourceDTO } from "@/modules/resources/resource.dto";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { username } = await context.params;
  const session = await getSession(req);

  const targetUser = await prisma.user.findFirst({ 
    where: { username: decodeURIComponent(username), deletedAt: null } 
  });
  if (!targetUser) throw ApiError.notFound("User not found");

  const isOwner = session?.userId === targetUser.id;
  const visibilityConditions: any = { deletedAt: null };

  if (!isOwner) {
    visibilityConditions.visibility = "PUBLIC";
    visibilityConditions.status = "PUBLISHED";
  }

  const savedRecords = await prisma.savedResource.findMany({
    where: {
      userId: targetUser.id,
      resource: visibilityConditions
    },
    orderBy: { createdAt: "desc" },
    include: {
      resource: {
        include: resourceWithRelations
      }
    }
  });

  const safeResources = savedRecords.map(record => toSafeResourceDTO(record.resource));
  return NextResponse.json(safeResources, { status: 200 });
});
