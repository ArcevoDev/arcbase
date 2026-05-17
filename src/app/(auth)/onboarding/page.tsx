"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { OnboardingWizard } from "@/components/features/onboarding/onboarding-wizard";
import { Loader2 } from "lucide-react";

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user?.hasCompletedOnboarding) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs text-gray-400 font-mono">Syncing system authorization policies...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-6">
      <div className="w-full max-w-xl">
        <OnboardingWizard />
      </div>
    </div>
  );
}
