import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "token";

export const cookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 24-Hour Session Lifetime Window
};

export function getTokenFromCookies(req: NextRequest): string | undefined {
  return req.cookies.get(COOKIE_NAME)?.value;
}

export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    ...cookieOptions,
    value: token,
  });
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    ...cookieOptions,
    value: "",
    maxAge: 0,
  });
}
