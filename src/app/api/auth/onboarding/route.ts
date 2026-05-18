import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { updateOnboardingSchema } from "@/modules/auth/auth.dto";
import { UserService } from "@/modules/users/user.service";
import { ApiError } from "@/lib/errors/api-error";

const userService = new UserService();

export const PUT = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  const body = await req.json();

  const parsed = updateOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const updatedUser = await userService.processOnboardingStep(
    session.userId,
    parsed.data.step,
    parsed.data.data
  );

  return NextResponse.json({ success: true, data: updatedUser });
});
