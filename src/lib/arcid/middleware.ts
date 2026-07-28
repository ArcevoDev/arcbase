import { NextRequest, NextResponse } from "next/server";
import { verifyArcIDToken } from "./jwt";
import { prisma } from "@/core/db";
import type { User } from "@prisma-client";

export interface AuthContext {
  identityId: string;
  tenantId: string | null;
  scope: string[];
  user: User | null;    // null for M2M tokens or first-login
}

/**
 * Extracts and verifies the arc-id JWT from the request.
 * Loads the arcbase User record matching the identityId.
 *
 * Returns null if no valid token is present (unauthenticated).
 * Throws on malformed / expired tokens (let the error boundary handle it).
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const payload = await verifyArcIDToken(authHeader.slice(7));

  const user = await prisma.user.findUnique({
    where: { identityId: payload.sub },
  });

  return {
    identityId: payload.sub,
    tenantId: payload.tid ?? null,
    scope: (payload.scope ?? "").split(" ").filter(Boolean),
    user,
  };
}

/**
 * Route handler wrapper — enforces authentication.
 * Injects AuthContext into the handler.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx) => {
 *     return NextResponse.json({ userId: ctx.user?.id })
 *   })
 */
type AuthedHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }
    return handler(req, ctx);
  };
}

/**
 * Like withAuth but also ensures the arcbase User record exists.
 * If the identity has no User record yet (first login after registration),
 * it creates one automatically.
 */
export function withUser(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!ctx.user) {
      // First login — provision arcbase User from arc-id identity
      // Username defaults to the identity ID prefix until user sets one
      ctx.user = await prisma.user.create({
        data: {
          identityId: ctx.identityId,
          username: `user_${ctx.identityId.slice(0, 8)}`,
          tenantId: ctx.tenantId,
        },
      });
    }

    return handler(req, ctx);
  };
}

/**
 * Scope guard — ensures the token has a specific OAuth scope.
 */
export function withScope(requiredScope: string, handler: AuthedHandler) {
  return withAuth(async (req, ctx) => {
    if (!ctx.scope.includes(requiredScope)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: `Scope '${requiredScope}' required` },
        { status: 403 }
      );
    }
    return handler(req, ctx);
  });
}
