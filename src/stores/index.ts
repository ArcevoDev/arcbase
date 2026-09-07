/**
 * Facet stores for arcbase
 *
 * Central export point for all facet-store integrations.
 */

// Auth store
export {
  useAuthStore,
  authSelectors,
  authActions,
  useUser,
  useIsAuthenticated,
  useAuthLoading,
  useAccessToken,
  createAuthTokenStorage,
} from "./auth.store";
export type { AuthState, TokenStorage, TokenRefresher } from "./auth.store";

// Tenant store
export {
  useTenantStore,
  tenantSelectors,
  tenantActions,
  useActiveTenant,
  useTenants,
  useTenantLoading,
} from "./tenant.store";
export type { TenantState } from "./tenant.store";