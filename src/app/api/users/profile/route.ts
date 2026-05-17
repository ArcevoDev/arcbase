export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { UserService } from "@/modules/users/user.service"; // Imports business core service layer
import { updateProfileSchema } from "@/modules/users/user.dto"; // Uses central, updated validation contracts

// PUT /api/users/profile -> Process onboarding steps and profile mutations safely
export const PUT = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);

  let rawBody;
  try {
    rawBody = await req.json();
  } catch {
    throw ApiError.badRequest("Malformed JSON payload input configuration");
  }

  // Validate properties structure through the strict Zod shape contract matching onboarding fields
  const validationResult = updateProfileSchema.safeParse(rawBody);
  if (!validationResult.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: validationResult.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // Forward the payload safely down to the decoupled service layer to mutate user data parameters
  const updatedUserDto = await UserService.updateProfile(
    session.userId, 
    validationResult.data
  );

  return NextResponse.json(
    { message: "User onboarding configuration profile saved successfully", user: updatedUserDto },
    { status: 200 }
  );
});

// Proxy PATCH streams directly to the identical validator pipeline definition
export const PATCH = PUT;
