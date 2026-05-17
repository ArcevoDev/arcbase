"use client";

import React from "react";
import { Terminal } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-950 p-8 rounded-2xl border border-gray-200/60 dark:border-gray-800/80 shadow-xl">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white mt-2">
            ArcBase Engine
          </h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
            Next-gen decentralized data management matrix
          </p>
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
