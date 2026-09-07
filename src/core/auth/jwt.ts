import { jwtVerify, type JWTPayload } from "jose";

const secret = () => new TextEncoder().encode(process.env.ARCID_JWT_SECRET!);
const ISSUER = process.env.ARCID_ISSUER ?? "arcid";

export interface ArcIDTokenPayload extends JWTPayload {
  sub:    string;    // arc-id Identity.id
  jti:    string;
  scope:  string;    // space-separated
  aud:    string[];
  tid?:   string;    // tenantId
}

/**
 * Verifies an arc-id access token locally (no network call).
 * Throws jose errors on failure — caught by error boundary.
 */
export async function verifyArcIDToken(token: string): Promise<ArcIDTokenPayload> {
  const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER });
  return payload as ArcIDTokenPayload;
}

export async function extractIdentityId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const p = await verifyArcIDToken(authHeader.slice(7));
    return p.sub;
  } catch {
    return null;
  }
}

export function scopeArray(payload: ArcIDTokenPayload): string[] {
  return (payload.scope ?? "").split(" ").filter(Boolean);
}
