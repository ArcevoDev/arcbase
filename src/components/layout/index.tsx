// src/components/layout/index.tsx
import React from "react";
import Link from "next/link";
import { Navbar } from "../shared/Navbar";
import { Footer } from "../shared/Footer";
import { Sidebar } from "../shared/Sidebar";

// Re-export facet-layout wrappers
export { FacetDashboardLayout, FacetMarketingLayout } from "./FacetLayout";

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background selection:bg-primary/20">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full bg-background flex flex-col justify-between overflow-x-hidden selection:bg-primary/20">
      <main className="flex-1 w-full h-full flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background selection:bg-primary/20">
      <header className="fixed top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md h-16 flex items-center px-6 justify-between">
        <Link href="/dashboard" className="text-lg font-black tracking-tight">
          ARCBASE<span className="text-primary">.CONSOLE</span>
        </Link>
        <Link
          href="/api/auth/logout"
          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
        >
          Terminate Session
        </Link>
      </header>
      <div className="flex h-full pt-16">
        <Sidebar />
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 lg:pl-72 min-h-[calc(100vh-4rem)]">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
