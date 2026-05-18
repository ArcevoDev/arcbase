import { NextRequest } from "next/server";
import { ApiError } from "@/lib/errors/api-error";
import { verifyToken } from "./jwt";
import { getTokenFromCookies } from "./auth-cookie";
import { UserRepository } from "../users/user.repository";
import { ONBOARDING_CONFIG } from "./auth.dto";

export interface SessionUser {
  userId: string;
  email: string;
}

const userRepo = new UserRepository();

/**
 * Validates the user's session token.
 * Allows users to access the platform even if their onboarding is incomplete.
 */
export async function requireAuth(req: NextRequest): Promise<SessionUser> {
  const token = getTokenFromCookies(req);
  if (!token) {
    throw ApiError.unauthorized("Authentication token payload required");
  }

  const payload = await verifyToken(token);
  if (!payload) {
    throw ApiError.unauthorized("Session validation expired. Please log in again.");
  }

  return payload;
}

/**
 * Verifies that the user has completed all onboarding steps.
 * Blocks incomplete profiles from accessing core features.
 */
export async function requireOnboarded(req: NextRequest): Promise<SessionUser> {
  const session = await requireAuth(req);

  const activeUserRecord = await userRepo.findById(session.userId);
  if (!activeUserRecord) {
    throw ApiError.unauthorized("User account record validation failed");
  }

  if (activeUserRecord.onboardingStep < ONBOARDING_CONFIG.TOTAL_STEPS) {
    throw ApiError.forbidden(
      `Access denied. Onboarding completion criteria unfulfilled (${activeUserRecord.onboardingStep}/${ONBOARDING_CONFIG.TOTAL_STEPS} steps completed).`
    );
  }

  return session;
}