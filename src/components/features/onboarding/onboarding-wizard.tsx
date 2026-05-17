"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ProgressTracker } from "@/components/shared/progress-tracker";
import { StepRoleDescriptive } from "./step-role-descriptive";
import { StepIntent } from "./step-intent";
import { StepSeedCollection } from "./step-seed-collection";
import { useAuth } from "@/hooks/use-auth";

export function OnboardingWizard() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingJson, setOnboardingJson] = useState({
    occupation: "",
    intents: [] as string[], // Migrated from string to string list array
    primaryCollectionName: "",
  });

  const handleStepSave = async (payload: Partial<typeof onboardingJson>) => {
    const nextState = { ...onboardingJson, ...payload };
    setOnboardingJson(nextState);

    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/users/profile", {
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hasCompletedOnboarding: true,
          // Flatten array to a comma-separated string if your backend DTO expects a string primitive
          intent: nextState.intents.join(", "),
          occupation: nextState.occupation,
          primaryCollectionName: nextState.primaryCollectionName,
        }),
      });

      if (!response.ok) throw new Error("Database profile mutation verification failure.");

      toast.success("Environment configured successfully!");
      await refreshSession();
      router.refresh();
      router.push("/dashboard");
    } catch {
      toast.error("Failed to save profile metadata variations.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <ProgressTracker currentStep={step} totalSteps={3} title="ArcBase System Setup" />
      <div className="bg-white dark:bg-gray-950 border border-gray-200/60 dark:border-gray-800/80 shadow-xl rounded-2xl p-8">
        {step === 1 && <StepRoleDescriptive onNext={handleStepSave} />}
        {step === 2 && <StepIntent onNext={handleStepSave} initialIntents={onboardingJson.intents} />}
        {step === 3 && <StepSeedCollection onNext={handleStepSave} isLoading={isLoading} />}
      </div>
    </div>
  );
}
