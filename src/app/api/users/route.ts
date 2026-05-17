export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service";
import { updateProfileSchema } from "@/modules/users/user.dto";
import { getSession } from "@/modules/auth/get-session";
import { prisma } from "@/lib/prisma/prisma";
import { toPublicUserDTO } from "@/modules/users/user.dto";

export const PUT = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON input payload configuration");
  }

  const validationResult = updateProfileSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      { error: "Validation failed", details: validationResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const updatedUserDto = await UserService.updateProfile(session.userId, validationResult.data);
  return NextResponse.json(
    { message: "User onboarding configuration profile saved successfully", user: updatedUserDto },
    { status: 200 }
  );
});

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await getSession(req);
  
  // Real world implementation should evaluate an explicit token role instead of simple presence checks
  if (!session) {
    const totalUsersCount = await prisma.user.count({ where: { deletedAt: null } });
    return NextResponse.json({ success: true, totalCreators: totalUsersCount }, { status: 200 });
  }

  const allUsers = await prisma.user.findMany({
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json(allUsers.map(toPublicUserDTO).filter(Boolean), { status: 200 });
});
