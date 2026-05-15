import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { registerSchema, toSafeUserDTO } from "@/modules/auth/auth.dto";

export const POST = handleApiRoute(async (req: NextRequest) => {
  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON payload configuration");
  }

  const result = registerSchema.safeParse(rawBody);
  if (!result.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Pass the entire object (including confirmPassword) to satisfy the Zod input contract type
  const user = await AuthService.register(result.data);
  return NextResponse.json(toSafeUserDTO(user), { status: 201 });
});
