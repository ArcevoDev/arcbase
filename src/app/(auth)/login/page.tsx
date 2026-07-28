// src/app/(auth)/login/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/useful/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Validation Breakdown: Provide all key strings.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiClient("/api/auth/login", {
        method: "POST",
        bodyData: formData,
      });
      toast.success("Identity established. Redirecting inside safe zone...");

      if (data.user?.onboardingStep < 3) {
        router.push("/onboarding");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      toast.error(
        err?.message ?? "Security authentication operational failure.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Splash Asset Container */}
      <div className="hidden lg:flex bg-neutral-950 flex-col justify-between p-12 relative text-white">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [bg-size:20px_20px]" />
        <Link href="/" className="text-xl font-black tracking-tight z-10">
          ARCBASE.
        </Link>
        <div className="max-w-md z-10 space-y-4">
          <blockquote className="text-xl font-medium tracking-tight text-neutral-300">
            "The direct connection between structural node records and spatial
            knowledge graph telemetry changed our global partition efficiency
            metrics entirely."
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

      {/* Right Column: Interaction Input Matrix */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">
              Access Node Registry
            </h1>
            <p className="text-xs text-muted-foreground">
              Input secure crypt-hashes to access active tenant instances.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Identity Email Identifier</Label>
              <Input
                id="email"
                type="email"
                required
                className="text-xs"
                placeholder="operator@tenant-domain.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Security Password Key</Label>
              </div>
              <Input
                id="password"
                type="password"
                required
                className="text-xs"
                value={formData.password}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, password: e.target.value }))
                }
              />
            </div>
            <Button
              type="submit"
              className="w-full font-bold text-xs"
              disabled={loading}
            >
              {loading
                ? "Decrypting Matrix Identity..."
                : "Establish Cryptographic Session"}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground">
            No active matrix node wrapper?{" "}
            <Link
              href="/register"
              className="font-bold underline text-foreground"
            >
              Register Namespace
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
