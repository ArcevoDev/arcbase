"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/useful/api-client";

interface Identity {
  id:            string;
  email:         string | null;
  name:          string | null;
  emailVerified: boolean;
  metadata:      Record<string, unknown> | null;
}

interface User {
  id:          string;
  identityId:  string;
  username:    string;
  displayName: string | null;
  avatarUrl:   string | null;
  role:        string;
}

interface AuthState {
  user:       User | null;
  identity:   Identity | null;
  loading:    boolean;
  isLoggedIn: boolean;
}

interface AuthContextValue extends AuthState {
  login:   (email: string, password: string) => Promise<{ requiresMfa: boolean; sessionId?: string }>;
  logout:  () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, identity: null, loading: true, isLoggedIn: false,
  });

  const refresh = useCallback(async () => {
    try {
      const [me, identity] = await Promise.all([
        apiClient.get<User>("/api/users/me/profile"),
        apiClient.get<Identity>("/api/auth/me"),
      ]);
      setState({ user: me, identity, loading: false, isLoggedIn: true });
    } catch {
      setState({ user: null, identity: null, loading: false, isLoggedIn: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post<{
      requiresMfa: boolean; sessionId?: string;
      accessToken?: string; refreshToken?: string;
    }>("/api/auth/login", { email, password });

    if (!res.requiresMfa) await refresh();
    return { requiresMfa: res.requiresMfa, sessionId: res.sessionId };
  };

  const logout = async () => {
    await apiClient.post("/api/auth/logout", {});
    setState({ user: null, identity: null, loading: false, isLoggedIn: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
