// src/app/api/auth/me/route.ts
//
// Returns the authenticated user's full SafeUserDTO. This is the primary
// hydration endpoint on app load — call it once to restore session state.
//
// Note: requireAuth (not requireOnboarded) is intentional here. A user who
// hasn't finished onboarding still needs to fetch their profile to know which
// onboarding step to resume. Using requireOnboarded would 403 them before they
// can reach the onboarding flow.
import { NextRequest, NextResponse } from "next/server";
import { handleApiRoute } from "@/lib/errors";
import { requireAuth } from "@/core/auth";
import { AuthService } from "@/domains/auth/auth.service";
import { prisma } from "@/core/db";

const authService = new AuthService();

export const GET = handleApiRoute(async (req: NextRequest) => {
  const session = await requireAuth(req);
  const user = await authService.getProfile(prisma, session.userId);
  return NextResponse.json({ success: true, data: user });
});