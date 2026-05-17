import { NextRequest } from "next/server";
import { ApiError } from "@/lib/errors/api-error";
import { verifyToken } from "./jwt";
import { getTokenFromCookies } from "./auth-cookie";

export interface SessionUser {
  userId: string;
  email: string;
}

export async function requireAuth(req: NextRequest): Promise<SessionUser> {
  const token = getTokenFromCookies(req);
  if (!token) throw ApiError.unauthorized("Authentication token required");

  const payload = await verifyToken(token);
  if (!payload) throw ApiError.unauthorized("Session expired. Please log in again.");

  return { userId: payload.userId, email: payload.email.toLowerCase() };
}
