import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-api-route";
import { ApiError } from "@/lib/errors/api-error";
import { loginSchema } from "@/modules/auth/auth.dto";
import { AuthService } from "@/modules/auth/auth.service";
import { toSafeUserDTO } from "@/modules/auth/auth.dto";
import { signToken } from "@/modules/auth/jwt";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();

  const parsedInput = loginSchema.safeParse(body);
  if (!parsedInput.success) {
    throw ApiError.badRequest("Invalid input parameters passed");
  }

  const user = await AuthService.validateUser(parsedInput.data.email, parsedInput.data.password);
  const safeUser = toSafeUserDTO(user);

  if (!safeUser) {
    throw ApiError.internal("Error parsing session data");
  }

  const token = await signToken({
    userId: safeUser.id,
    email: safeUser.email,
    hasCompletedOnboarding: safeUser.hasCompletedOnboarding,
  });

  const response = NextResponse.json({
    success: true,
    message: "Authentication successful",
    data: safeUser,
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  });

  return response;
});
