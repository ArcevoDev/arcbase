"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Terminal, ArrowRight, Shield, Cpu, Layers, Loader2 } from "lucide-react";

export default function RootLandingPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Handle auto-routing ONLY for users who are already logged in
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      if (!user.hasCompletedOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, isLoading, isAuthenticated, router]);

  // Keep a clean, non-intrusive loading interface while tracking token validation state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs font-mono text-gray-400 dark:text-gray-500">Synchronizing nexus payload...</p>
      </div>
    );
  }

  // Render the marketing lander if the guest is unauthenticated
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      
      {/* Structural Header Navigation */}
      <header className="border-b border-gray-200/60 dark:border-gray-900 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight font-mono">ArcBase</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-xl font-bold">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Core Segment */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
            Engine Core Version 2.4 Live
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-gray-900 dark:text-white">
            The decentralized matrix for <span className="text-indigo-600 dark:text-indigo-400">structured telemetry</span>
          </h1>
          
          <p className="mx-auto max-w-xl text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed">
            Provision infrastructure environments, stream relational file snapshots, and sync metrics configurations on a single low-latency control board.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="w-full sm:w-auto h-12 px-6 rounded-xl font-bold shadow-md shadow-indigo-600/10 gap-2 text-sm">
              <Link href="/register">
                Deploy Workspace <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto h-12 px-6 rounded-xl font-semibold border-gray-200 dark:border-gray-800 text-sm">
              <Link href="/login">Access Control Panel</Link>
            </Button>
          </div>
        </div>

        {/* Informative Value Proposition Grid */}
        <section className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 text-left">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-sm space-y-3">
            <div className="p-2.5 w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">High-Throughput Analytics</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Process operational node data updates dynamically without database pipeline execution delays.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-sm space-y-3">
            <div className="p-2.5 w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cryptographic Safety</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Enforce enterprise metadata state protection using system-wide identity encryption token keys.
            </p>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800/60 rounded-2xl shadow-sm space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="p-2.5 w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Isomorphic Structure</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Isolate collection storage buckets across runtime platforms without manual data architecture mapping.
            </p>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-200/60 dark:border-gray-900 mt-20 py-8 text-center text-xs text-gray-400 dark:text-gray-500 font-mono">
        &copy; {new Date().getFullYear()} ArcBase Labs Inc. All rights reserved.
      </footer>
    </div>
  );
}
