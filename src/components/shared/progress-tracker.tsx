"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ProgressTrackerProps {
  currentStep: number;
  totalSteps: number;
  title?: string;
  className?: string;
}

export function ProgressTracker({ currentStep, totalSteps, title, className }: ProgressTrackerProps) {
  const percentage = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

  return (
    <div className={cn("w-full space-y-2.5", className)}>
      <div className="flex justify-between items-center text-xs font-semibold tracking-wider text-gray-400 uppercase">
        <span>{title || "Step Progression"}</span>
        <span className="text-indigo-600 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
          {currentStep}/{totalSteps} ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200/40 relative">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
