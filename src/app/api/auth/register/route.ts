import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { registerSchema } from "@/modules/auth/auth.dto";
import { AuthService } from "@/modules/auth/auth.service";
import { toSafeUserDTO } from "@/modules/auth/auth.dto";
import { signToken } from "@/modules/auth/jwt";

export const POST = handleApiRoute(async (req: NextRequest) => {
  const body = await req.json();
  
  const parsedInput = registerSchema.safeParse(body);
  if (!parsedInput.success) {
    throw ApiError.badRequest(parsedInput.error.issues[0].message);
  }

  const newUser = await AuthService.register(parsedInput.data);
  const safeUser = toSafeUserDTO(newUser);

  if (!safeUser) {
    throw ApiError.internal("Failed to map user profile sequence");
  }

  const token = await signToken({
    userId: safeUser.id,
    email: safeUser.email,
    hasCompletedOnboarding: safeUser.hasCompletedOnboarding,
  });

  const response = NextResponse.json({
    success: true,
    message: "Account created successfully",
    data: safeUser,
  });

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return response;
});
