import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { clearAuthCookie } from "@/modules/auth/auth-cookie";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearAuthCookie(response);
  return response;
});
