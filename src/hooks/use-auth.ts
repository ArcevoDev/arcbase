"use client";

import { useContext, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext } from "@/context/auth-context";

export function useAuth() {
  const context = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  if (context === undefined) {
    throw new Error("useAuth must be invoked within an active <AuthProvider /> parent wrapper");
  }

  useEffect(() => {
    if (context.isLoading) return;

    const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");
    const isOnboardingPage = pathname.startsWith("/onboarding");
    const isProtectedPage = 
      pathname.startsWith("/dashboard") || 
      pathname.startsWith("/resources") || 
      pathname.startsWith("/collections") ||
      pathname.startsWith("/profile");

    if (context.user) {
      // User is authenticated
      if (!context.user.hasCompletedOnboarding) {
        // Enforce onboarding completion checkpoint
        if (!isOnboardingPage) {
          router.replace("/onboarding");
        }
      } else {
        // User finished onboarding, block access to auth or setup routes
        if (isAuthPage || isOnboardingPage) {
          router.replace("/dashboard");
        }
      }
    } else {
      // Unauthenticated state routing rules
      if (isProtectedPage || isOnboardingPage) {
        router.replace("/login");
      }
    }
  }, [context.user, context.isLoading, pathname, router]);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout runtime context sync exception:", error);
    } finally {
      context.clearSessionState();
      router.push("/login");
    }
  };

  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    refreshSession: context.refreshSession,
    logout,
  };
}
