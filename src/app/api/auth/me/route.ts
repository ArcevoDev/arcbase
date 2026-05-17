import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors/handle-error";
import { ApiError } from "@/lib/errors/api-error";
import { requireAuth } from "@/modules/auth/require-auth";
import { UserRepository } from "@/modules/users/user.repository";
import { toSafeUserDTO } from "@/modules/auth/auth.dto";

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  
  const user = await UserRepository.findByEmail(session.email);
  if (!user) throw ApiError.notFound("User no longer exists in our systems");

  // Ensure that your safe user DTO model transfers user.hasCompletedOnboarding safely to the client side
  return NextResponse.json({ user: toSafeUserDTO(user) }, { status: 200 });
});
