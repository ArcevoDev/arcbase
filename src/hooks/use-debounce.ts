"use client";

import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, operationalDelayMs = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const executionTimer = setTimeout(() => {
      setDebouncedValue(value);
    }, operationalDelayMs);

    return () => clearTimeout(executionTimer);
  }, [value, operationalDelayMs]);

  return debouncedValue;
}
