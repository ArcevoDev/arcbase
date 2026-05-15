import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { signToken } from "@/modules/auth/jwt"; // Fixed broken utility path
import { loginSchema, toSafeUserDTO } from "@/modules/auth/auth.dto";

export const POST = handleApiRoute(async (req: NextRequest) => {
  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON payload configuration");
  }

  const result = loginSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const { email, password } = result.data;
  const user = await AuthService.validateUser(email, password);
  
  // Sign time-ordered token metrics without tokenVersion noise
  const token = await signToken({ userId: user.id, email: user.email });

  const response = NextResponse.json(
    { message: "Login successful", user: toSafeUserDTO(user) },
    { status: 200 },
  );

  response.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  });

  return response;
});
