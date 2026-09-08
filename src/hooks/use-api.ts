import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/useful/api-client";

// Dynamic Read Hook
export function useApiQuery<T>(
  queryKey: unknown[],
  url: string,
  enabled = true,
) {
  return useQuery<T>({
    queryKey,
    queryFn: () => apiClient(url) as Promise<T>,
    enabled,
  });
}

// Dynamic Write/Mutate Hook
export function useApiMutation<
  TResponse,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(
  url: string,
  method: "POST" | "PUT" | "DELETE" | "PATCH",
  invalidateKeys?: unknown[][],
) {
  const queryClient = useQueryClient();

  return useMutation<TResponse, Error, TVariables>({
    mutationFn: (bodyData) =>
      apiClient(url, {
        method,
        bodyData:
          method !== "DELETE" ? (bodyData as Record<string, unknown>) : undefined,
      }) as Promise<TResponse>,
    onSuccess: () => {
      if (invalidateKeys) {
        invalidateKeys.forEach((key) =>
          queryClient.invalidateQueries({ queryKey: key }),
        );
      }
    },
  });
}
