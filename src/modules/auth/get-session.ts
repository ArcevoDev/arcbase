import { NextRequest } from "next/server";
import { verifyToken } from "./jwt";
import { getTokenFromCookies } from "./auth-cookie";
import type { SessionUser } from "./require-auth";

export async function getSession(req: NextRequest): Promise<SessionUser | null> {
  const token = getTokenFromCookies(req);
  if (!token) return null;
  return await verifyToken(token);
}
