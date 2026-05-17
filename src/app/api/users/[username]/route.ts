export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { UserService } from "@/modules/users/user.service";

interface RouteContext {
  params: Promise<{ username: string }>;
}

export const GET = handleApiRoute(async (req: NextRequest, context: RouteContext) => {
  const { username } = await context.params;
  const safeProfile = await UserService.getProfileByUsername(decodeURIComponent(username));

  return NextResponse.json(safeProfile, { status: 200 });
});
