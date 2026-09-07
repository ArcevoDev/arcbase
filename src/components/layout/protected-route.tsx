"use client";

import { useAuth } from "@/hooks/use-auth"; // Your custom hook
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && !user.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  return <>{children}</>;
}
