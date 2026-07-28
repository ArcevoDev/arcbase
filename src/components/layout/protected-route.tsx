"use client";

import { useAuth } from "@/hooks/use-auth"; // Your custom hook
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.hasCompletedOnboarding) {
      router.push("/onboarding");
    }
  }, [user, isLoading, router]);

  if (isLoading) return <div>Loading...</div>;
  return <>{children}</>;
}
