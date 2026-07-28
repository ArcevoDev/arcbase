// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute, ApiError } from "@/lib/errors";
import { requireOnboarded } from "@/core/auth";
import { flowExecutor } from "@/core/flows/flow-executor";
import { adminActionFlow } from "@/domains/users/flows/admin-action.flow";
import { UserService } from "@/domains/users/user.service";
import { prisma } from "@/core/db";

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const data = await userService.getUserDirectoryListing(prisma);
  return NextResponse.json({ success: true, data });
});

export const PATCH = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);

  const requester = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!requester || requester.role !== "ADMIN") {
    throw ApiError.forbidden("Administrative authorization required");
  }

  const body = await req.json();
  const { targetUserId, ...actionPayload } = body;
  if (!targetUserId) {
    throw ApiError.badRequest("Missing required field: targetUserId");
  }

  const result = await flowExecutor.run(
    adminActionFlow,
    { targetUserId, isArchived: actionPayload.isArchived, isDeleted: actionPayload.isDeleted },
    { userId: session.userId, identityId: session.identityId, tenantId: session.tenantId },
  );

  return NextResponse.json({ success: true, data: result });
});
