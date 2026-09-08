/**
 * Pre-configured SDK instances for arcbase
 *
 * These SDKs are created from the ArcIdClient and provide
 * typed interfaces for different arc-id operations.
 */

import {
  AuthSdk,
  TenantSdk,
  IdentitySdk,
  PasskeySdk,
  VcSdk,
  OAuthSdk,
  BillingSdk,
  WebhooksSdk,
  AuditSdk,
} from "@arcevo/facet-sdk";
import { createServerSideClient, getClientSideClient } from "./client";

/**
 * Creates all SDK instances with server-side client.
 * Use in API routes and server-side code.
 */
export function createSdks(accessToken?: string) {
  const client = createServerSideClient(accessToken);

  return {
    auth: new AuthSdk(client),
    tenant: new TenantSdk(client),
    identity: new IdentitySdk(client),
    passkey: new PasskeySdk(client),
    vc: new VcSdk(client),
    oauth: new OAuthSdk(client),
    billing: new BillingSdk(client),
    webhooks: new WebhooksSdk(client),
    audit: new AuditSdk(client),
    client,
  };
}

/**
 * Type for SDK instances returned by createSdks()
 */
export type Sdks = ReturnType<typeof createSdks>;

// Singleton SDK instances for client-side use
let clientSdks: Sdks | null = null;

/**
 * Gets or creates singleton SDK instances for client-side use.
 * Only for use in client components, not server-side code.
 */
export function getClientSdks() {
  if (!clientSdks) {
    const client = getClientSideClient();

    clientSdks = {
      auth: new AuthSdk(client),
      tenant: new TenantSdk(client),
      identity: new IdentitySdk(client),
      passkey: new PasskeySdk(client),
      vc: new VcSdk(client),
      oauth: new OAuthSdk(client),
      billing: new BillingSdk(client),
      webhooks: new WebhooksSdk(client),
      audit: new AuditSdk(client),
      client,
    };
  }
  return clientSdks;
}

// Re-export types for convenience
export type { ArcIdClient } from "@arcevo/facet-sdk";