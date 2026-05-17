"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await apiClient("/api/auth/login", {
        method: "POST",
        bodyData: { email, password },
      });

      // Fetch user configuration state changes from context before routing
      await refreshSession();
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Authorization handshake validation failed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Account Access Link</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">Provide keys to verify access routing privileges.</p>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Email Address</label>
        <input
          type="email"
          required
          disabled={isLoading}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all disabled:opacity-60"
          placeholder="operator@arcbase.io"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Password</label>
        <input
          type="password"
          required
          disabled={isLoading}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all disabled:opacity-60"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl text-sm font-bold mt-2 shadow-sm">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Validating Credentials...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Authenticate Operator Session
          </>
        )}
      </Button>

      <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pt-2">
        Need a dynamic account?{" "}
        <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
          Instantiate a New Node
        </Link>
      </p>
    </form>
  );
}
