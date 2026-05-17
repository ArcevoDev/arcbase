import { NextRequest } from "next/server";

export function getTokenFromCookies(req: NextRequest): string | undefined {
  return req.cookies.get("token")?.value;
}
