import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service";

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  const user = await userService.getUserProfile(session.userId);
  return NextResponse.json({ success: true, data: user });
});
