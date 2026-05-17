"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

// CRITICAL FIX: Ensure this is explicitly named and exported as default
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    apiClient("/api/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        setError(true);
        router.push("/login");
      });
  }, [router]);

  async function handleLogoutAction() {
    setIsLoggingOut(true);
    try {
      await apiClient("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      alert("Operational failure clearing authentication session parameters");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (error)
    return (
      <p style={{ textAlign: "center", marginTop: "100px" }}>
        Verification check failed. Relocating...
      </p>
    );
  if (!user)
    return (
      <p style={{ textAlign: "center", marginTop: "100px" }}>
        Verifying active session profile context...
      </p>
    );

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "100px auto",
        padding: "40px",
        fontFamily: "sans-serif",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        background: "#fff",
      }}
    >
      <h1 style={{ fontSize: "28px", margin: "0 0 16px 0", color: "#111827" }}>
        ArcBase Dashboard
      </h1>
      <p style={{ fontSize: "16px", color: "#4b5563" }}>
        Welcome back,{" "}
        <strong style={{ color: "#111827" }}>@{user.username}</strong>!
      </p>
      <p style={{ fontSize: "14px", color: "#6b7280" }}>
        Active tracking context email: <code>{user.email}</code>
      </p>

      <button
        onClick={handleLogoutAction}
        disabled={isLoggingOut}
        style={{
          marginTop: "24px",
          padding: "10px 20px",
          background: "#dc2626",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          fontWeight: "bold",
          cursor: "pointer",
          opacity: isLoggingOut ? 0.7 : 1,
        }}
      >
        {isLoggingOut ? "Disconnecting..." : "Logout"}
      </button>
    </div>
  );
}
