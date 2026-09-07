/**
 * ArcIdClient factory for arcbase
 *
 * Creates an ArcIdClient instance configured for arc-id integration.
 * This client is used by facet-store for token refresh and by
 * facet-auth for authentication operations.
 */

import { ArcIdClient } from "@arcevo/facet-sdk";

// Client-side base URL (exposed to browser)
const CLIENT_BASE_URL =
  process.env.NEXT_PUBLIC_ARCID_API_URL ?? "http://localhost:4000";

// Server-side base URL (internal only)
const SERVER_BASE_URL = process.env.ARCID_API_URL ?? "http://localhost:4000";

/**
 * Creates an ArcIdClient for client-side (browser) use.
 * Use this for components that need to call arc-id directly.
 */
export function createClientSideClient(): ArcIdClient {
  return new ArcIdClient({
    baseUrl: CLIENT_BASE_URL,
    clientId: process.env.NEXT_PUBLIC_ARCID_CLIENT_ID,
  });
}

/**
 * Creates an ArcIdClient for server-side use.
 * Use this in API routes and server components.
 */
export function createServerSideClient(accessToken?: string): ArcIdClient {
  const client = new ArcIdClient({
    baseUrl: SERVER_BASE_URL,
    clientId: process.env.ARCID_CLIENT_ID,
  });

  if (accessToken) {
    client.setAccessToken(accessToken);
  }

  return client;
}

/**
 * Singleton client for client-side use.
 * Created once and reused across components.
 */
let clientSideClient: ArcIdClient | null = null;

export function getClientSideClient(): ArcIdClient {
  if (!clientSideClient) {
    clientSideClient = createClientSideClient();
  }
  return clientSideClient;
}