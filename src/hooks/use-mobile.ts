"use client";

import { useState, useEffect } from "react";

export function useMobile(breakpointWidth = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkViewportWidth = () => {
      setIsMobile(window.innerWidth < breakpointWidth);
    };

    // Initial runtime evaluation run
    checkViewportWidth();

    window.addEventListener("resize", checkViewportWidth, { passive: true });
    return () => window.removeEventListener("resize", checkViewportWidth);
  }, [breakpointWidth]);

  return isMobile;
}
