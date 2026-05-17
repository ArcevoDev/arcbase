export interface FetchOptions extends RequestInit {
  bodyData?: Record<string, any>;
}

/**
 * Custom fetch client that automatically configures JSON headers
 * and ensures credential tokens pass along cleanly.
 */
export async function apiClient(endpoint: string, options: FetchOptions = {}) {
  const { bodyData, ...customConfig } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const config: RequestInit = {
    method: customConfig.method ?? "GET",
    headers: {
      ...headers,
      ...customConfig.headers,
    },
    credentials: "same-origin", // Crucial: Commands the browser to send along the token cookie container
    ...customConfig,
  };

  if (bodyData) {
    config.body = JSON.stringify(bodyData);
  }

  const response = await fetch(endpoint, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ?? "An unexpected network operational crash occurred",
    );
  }

  return data;
}
