/**
 * SignUp page component using @arcevo/facet-auth
 *
 * Wraps the facet-auth SignUp component with arcbase-specific
 * configuration and styling.
 */

"use client";

import { SignUp, ArcProvider } from "@arcevo/facet-auth";
import { getClientSideClient } from "@/lib/facet";
import Link from "next/link";

/**
 * SignUp page with facet-auth SignUp component
 */
export function FacetSignUpPage() {
  return (
    <ArcProvider client={getClientSideClient()}>
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: SignUp form */}
        <div className="flex items-center justify-center p-8 bg-background order-2 lg:order-1">
          <div className="w-full max-w-sm mx-auto">
            <SignUp
              appearance={{
                className: "w-full",
              }}
            />
          </div>
        </div>

        {/* Right Column: Branding */}
        <div className="hidden lg:flex bg-neutral-900 flex-col justify-between p-12 relative text-white order-1 lg:order-2">
          <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:30px_30px]" />
          <div className="flex justify-between items-center w-full z-10">
            <Link href="/" className="text-xl font-black tracking-tight">
              ARCBASE.
            </Link>
            <span className="text-[10px] font-mono tracking-widest bg-white/10 px-2 py-0.5 rounded">
              CLUSTER_MODE_ACTIVE
            </span>
          </div>
          <div className="max-w-md z-10 space-y-4">
            <div className="h-1 bg-gradient-to-r from-primary to-purple-500 w-20 rounded" />
            <h2 className="text-3xl font-black tracking-tight leading-tight">
              Native Hard-Locked Isolation Policies.
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every account registration handles immediate database indexing
              parameters, preparing separate tenant namespaces for secure graph
              structural layouts.
            </p>
          </div>
          <p className="text-xs text-neutral-500 z-10">
            Enterprise Relational Storage Layer Configured
          </p>
        </div>
      </div>
    </ArcProvider>
  );
}
