"use client";

import { useTheme as useNextTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useTheme() {
  const { theme, setTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch bugs by ensuring execution happens client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return {
    theme: mounted ? theme : "system",
    resolvedTheme: mounted ? (resolvedTheme as "light" | "dark") : "light",
    isDark: mounted ? resolvedTheme === "dark" : false,
    toggleTheme,
    setTheme,
  };
}
