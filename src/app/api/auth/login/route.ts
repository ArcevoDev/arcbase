import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { AuthService } from "@/modules/auth/auth.service";
import { loginSchema } from "@/modules/auth/auth.dto";
import { setAuthCookie } from "@/modules/auth/auth-cookie";
import { ApiError } from "@/lib/errors/api-error";

const authService = new AuthService();

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(parsed.error.issues[0].message);
  }

  const { user, token } = await authService.login(parsed.data);

  const response = NextResponse.json({ success: true, data: user });
  setAuthCookie(response, token);
  return response;
});
