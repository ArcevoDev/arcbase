import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = "token";

// Define targeted routing route classes
const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/resources",
  "/collections",
  "/profile",
  "/onboarding",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // 1. Verify token authenticity
  let isAuthenticated = false;
  if (token && JWT_SECRET) {
    try {
      const secretBytes = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secretBytes);
      isAuthenticated = true;
    } catch {
      // Clean up corrupt, tampered, or expired tokens immediately
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // 2. Route Protection: Redirect unauthenticated users trying to hit secure spaces
  const isProtectedRoute = PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.url);
    // Track the intended destination for seamless post-login redirection
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Guest Routes Protection: Route logged-in users away from auth views (login/register)
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route);
  if (isAuthRoute && isAuthenticated) {
    // We send them directly to a layout-aware router route like /dashboard.
    // The dashboard layout will check the DB and route them to /onboarding if incomplete.
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

/**
 * Optimized path processing matcher engine.
 * Completely ignores static system assets, images, and API tracks.
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
