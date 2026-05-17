import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/modules/auth/jwt";
import { getTokenFromCookies } from "@/modules/auth/auth-cookie";

const protectedRoutes = ["/dashboard", "/resources", "/collections", "/profile"];
const authRoutes = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = getTokenFromCookies(req);

  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));
  const isAuthPage = authRoutes.some(route => pathname.startsWith(route));
  const isOnboardingPage = pathname.startsWith("/onboarding");

  if (isProtected || isOnboardingPage) {
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("token"); // Clean up corrupt or expired tokens
      return response;
    }

    // Read onboarding status directly from the encrypted token payload
    const hasOnboarded = !!payload.hasCompletedOnboarding;

    // Force users to complete onboarding before accessing protected routes
    if (isProtected && !hasOnboarded) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }

    // Route fully onboarded users away from the setup wizard and into the dashboard
    if (isOnboardingPage && hasOnboarded) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (token && isAuthPage) {
    const payload = await verifyToken(token);
    if (payload) {
      const hasOnboarded = !!payload.hasCompletedOnboarding;
      return NextResponse.redirect(new URL(hasOnboarded ? "/dashboard" : "/onboarding", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Use your original optimized path processing matcher strategy
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
