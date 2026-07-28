// src/app/(auth)/register/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/useful/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Form Validation Breach: Ensure parameters exist.");
      return;
    }
    setLoading(true);
    try {
      await apiClient("/api/auth/register", {
        method: "POST",
        bodyData: formData,
      });
      toast.success(
        "Identity container initialized. Advancing to Hard-Locked Onboarding...",
      );
      router.push("/onboarding");
    } catch (err: any) {
      toast.error(
        err?.message ?? "Error mapping registry records to engine database.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Interaction Input Matrix */}
      <div className="flex items-center justify-center p-8 bg-background order-2 lg:order-1">
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight">
              Register Node Cluster
            </h1>
            <p className="text-xs text-muted-foreground">
              Provision an isolated multi-tenant record block space.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username">Unique Handle Identifier</Label>
              <Input
                id="username"
                type="text"
                required
                placeholder="root_operator"
                className="text-xs font-mono"
                value={formData.username}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, username: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Operational Communications Mail</Label>
              <Input
                id="email"
                type="email"
                required
                placeholder="admin@cluster.io"
                className="text-xs"
                value={formData.email}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Security Access Key Matrix</Label>
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
                ? "Provisioning Database Space..."
                : "Commit Cluster Registration"}
            </Button>
          </form>
          <div className="text-center text-xs text-muted-foreground">
            Identity already logged within database?{" "}
            <Link href="/login" className="font-bold underline text-foreground">
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column: Splash Asset Container */}
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
  );
}
