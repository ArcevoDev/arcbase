import { jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.ARCID_JWT_SECRET!);

export interface ArcIDTokenPayload extends JWTPayload {
  sub: string;       // arc-id Identity.id
  jti: string;
  scope: string;
  aud: string[];
  tid?: string;      // tenantId
}

/**
 * Verifies an arc-id access token locally using the shared JWT_SECRET.
 * This avoids a network round-trip to arc-id on every request.
 * Use arcid.introspect() only when you need to check revocation status.
 */
export async function verifyArcIDToken(token: string): Promise<ArcIDTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: process.env.ARCID_ISSUER ?? "arcid",
  });
  return payload as ArcIDTokenPayload;
}

/**
 * Extracts the identityId from a Bearer token header without throwing.
 * Returns null on any failure — use for optional auth.
 */
export async function extractIdentityId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyArcIDToken(authHeader.slice(7));
    return payload.sub;
  } catch {
    return null;
  }
}
