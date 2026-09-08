/**
 * SignIn page component using @arcevo/facet-auth
 *
 * Wraps the facet-auth SignIn component with arcbase-specific
 * configuration and styling.
 */

"use client";

import { SignIn, ArcProvider } from "@arcevo/facet-auth";
import { getClientSideClient } from "@/lib/facet";
import { defaultPreset } from "@arcevo/facet-auth";
import Link from "next/link";

/**
 * SignIn page with facet-auth SignIn component
 */
export function FacetSignInPage() {
  return (
    <ArcProvider client={getClientSideClient()}>
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Branding */}
        <div className="hidden lg:flex bg-neutral-950 flex-col justify-between p-12 relative text-white">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [bg-size:20px_20px]" />
          <Link href="/" className="text-xl font-black tracking-tight z-10">
            ARCBASE.
          </Link>
          <div className="max-w-md z-10 space-y-4">
            <blockquote className="text-xl font-medium tracking-tight text-neutral-300">
              &ldquo;The direct connection between structural node records and spatial
              knowledge graph telemetry changed our global partition efficiency
              metrics entirely.&rdquo;
            </blockquote>
            <div>
              <p className="text-sm font-bold">Dr. Evelyn Vance</p>
              <p className="text-xs text-neutral-500">
                Principal Graph Modeler, NeuraLink Systems
              </p>
            </div>
          </div>
          <p className="text-xs text-neutral-600 z-10">
            Protected Tenant Architecture V0.1.0
          </p>
        </div>

        {/* Right Column: SignIn form */}
        <div className="flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-sm mx-auto">
            <SignIn
              appearance={{
                className: "w-full",
              }}
            />
          </div>
        </div>
      </div>
    </ArcProvider>
  );
}
