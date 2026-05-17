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
  const conditions: any = {
    authorId: targetUser.id,
    deletedAt: null
  };

  if (!isOwner) {
    conditions.status = "PUBLISHED";
    conditions.visibility = "PUBLIC";
  }

  const posts = await prisma.resource.findMany({
    where: conditions,
    orderBy: { createdAt: "desc" },
    include: resourceWithRelations
  });

  return NextResponse.json(posts.map(toSafeResourceDTO), { status: 200 });
});
