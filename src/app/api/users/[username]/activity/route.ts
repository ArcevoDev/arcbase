export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { prisma } from "@/lib/prisma/prisma";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { username } = await context.params;

  const targetUser = await prisma.user.findFirst({ 
    where: { username: decodeURIComponent(username), deletedAt: null } 
  });
  if (!targetUser) throw ApiError.notFound("User not found");

  const activityFeed = await prisma.resourceUsage.findMany({
    where: { userId: targetUser.id },
    take: 30,
    orderBy: { createdAt: "desc" },
    include: {
      resource: {
        select: { id: true, title: true, slug: true, type: true }
      }
    }
  });

  return NextResponse.json(activityFeed, { status: 200 });
});
