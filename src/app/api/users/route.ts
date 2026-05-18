import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { requireOnboarded } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service";
import { adminUpdateUserSchema } from "@/modules/users/user.dto";
import { ApiError } from "@/lib/errors/api-error";

const userService = new UserService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  await requireOnboarded(req);
  const data = await userService.getUserDirectoryListing();
  return NextResponse.json({ success: true, data });
});

export const PATCH = handleApiRoute(async (req: NextRequest) => {
  const session = await requireOnboarded(req);

  // Hard identity check for administration overrides
  // (Replace with your exact user role extraction logic from your JWT schema payload if different)
  if ((session as any).role !== "ADMIN") {
    throw ApiError.forbidden(
      "Access Denied: Administrative security authorization clear level required",
    );
  }

  const body = await req.json();
  const { targetUserId, ...actionPayload } = body;

  if (!targetUserId)
    throw ApiError.badRequest(
      "Missing parameters targetUserId string field reference",
    );

  const parsed = adminUpdateUserSchema.safeParse(actionPayload);
  if (!parsed.success)
    throw ApiError.badRequest(parsed.error.issues[0].message);

  await userService.processAdminAction(targetUserId, parsed.data);
  return NextResponse.json({
    success: true,
    message: "Administrative policy override completed successfully.",
  });
});
