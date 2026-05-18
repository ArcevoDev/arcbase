"use client";

import React, { createContext, useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { SafeUserDTO } from "@/modules/auth/auth.dto";
import { useRouter, usePathname } from "next/navigation";

interface AuthContextType {
  user: SafeUserDTO | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUserDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      const response = await apiClient("/api/auth/me");
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, [pathname]);

  const logout = async () => {
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Logout execution exception caught:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
