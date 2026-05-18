import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service";
import { updateProfileSchema } from "@/modules/users/user.dto";
import { ApiError } from "@/lib/errors/api-error";

export const PATCH = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);

  const body = await req.json();
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const userService = new UserService();
  const updatedProfile = await userService.updateProfile(
    session.userId,
    parsed.data,
  );

  return NextResponse.json({
    success: true,
    message: "Identity portfolio updated successfully.",
    data: updatedProfile,
  });
});
