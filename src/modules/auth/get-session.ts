import { NextRequest } from "next/server";
import { verifyToken, JwtPayload } from "./jwt";
import { getTokenFromCookies } from "./auth-cookie";

export async function getSession(req: NextRequest): Promise<JwtPayload | null> {
  const token = getTokenFromCookies(req);
  if (!token) return null;
  return await verifyToken(token);
}
