"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationErrors({});
    setGlobalError(null);
    setIsLoading(true);

    try {
      await apiClient("/api/auth/register", {
        method: "POST",
        bodyData: { username, email, password, confirmPassword },
      });
      router.push("/login");
    } catch (err: any) {
      if (err.details) {
        setValidationErrors(err.details);
      } else {
        setGlobalError(err.message ?? "Registration operation aborted by systemic constraint.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleRegisterSubmit} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Create Operator Identity</h2>
        <p className="text-xs text-gray-400 dark:text-gray-500">Initialize a node cluster profile token.</p>
      </div>

      {globalError && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 text-rose-800 dark:text-rose-400 p-3.5 rounded-xl text-xs font-medium flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{globalError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Username</label>
        <input
          type="text"
          required
          disabled={isLoading}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all disabled:opacity-60"
          placeholder="matrix_operator"
        />
        {validationErrors.username && (
          <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">{validationErrors.username[0]}</p>
        )}
      </div>

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
        {validationErrors.email && (
          <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">{validationErrors.email[0]}</p>
        )}
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
        {validationErrors.password && (
          <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">{validationErrors.password[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">Confirm Password</label>
        <input
          type="password"
          required
          disabled={isLoading}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3.5 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all disabled:opacity-60"
          placeholder="••••••••"
        />
        {validationErrors.confirmPassword && (
          <p className="text-rose-600 dark:text-rose-400 text-xs font-medium">{validationErrors.confirmPassword[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl text-sm font-bold mt-2 shadow-sm">
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Provisioning Core Keys...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Register Profile Node
          </>
        )}
      </Button>

      <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pt-2">
        Already registered?{" "}
        <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
          Establish Connection Link
        </Link>
      </p>
    </form>
  );
}
