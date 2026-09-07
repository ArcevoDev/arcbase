import { NextRequest }       from "next/server";
import { verifyArcIDToken }  from "./jwt";
import { getAccessTokenFromCookie } from "./auth-cookie";
import { prisma }            from "@/core/db/prisma";
import type { User }         from "@prisma-client";

export interface AuthSession {
  identityId: string;
  tenantId:   string | null;
  scope:      string[];
  user:       User | null;
userId:     string | undefined; // convenience: session.user?.id
}

/**
 * AuthSession for routes that have passed onboarding. The arcbase User
 * record is guaranteed to exist, so user and userId are always concrete.
 */
export interface OnboardedSession extends AuthSession {
  user:   User;
  userId: string;
}

/**
 * Extracts and verifies the arc-id JWT from either:
 *  1. Authorization: Bearer <token> header (API calls)
 *  2. arcid_at HttpOnly cookie (browser navigation)
 *
 * Returns null if no valid token is present.
 */
export async function getSession(req: NextRequest): Promise<AuthSession | null> {
  // Try Authorization header first (API clients, mobile apps)
  let token: string | null = null;
  const authHeader = req.headers.get("authorization");

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    // Fall back to cookie (browser)
    token = await getAccessTokenFromCookie();
  }

  if (!token) return null;

  try {
    const payload = await verifyArcIDToken(token);
    const user    = await prisma.user.findUnique({
      where: { identityId: payload.sub },
    });

    return {
      identityId: payload.sub,
      tenantId:   payload.tid ?? null,
      scope:      (payload.scope ?? "").split(" ").filter(Boolean),
      userId:     user?.id,
      user,
    };
  } catch {
    return null;
  }
}
