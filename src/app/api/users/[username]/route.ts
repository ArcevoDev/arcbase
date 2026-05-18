import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service";

const userService = new UserService();

export const GET = handleApiRoute(
  async (req: NextRequest, { params }: { params: { username: string } }) => {
    await requireOnboarded(req);
    const data = await userService.getPublicProfile(params.username);
    return NextResponse.json({ success: true, data });
  },
);
