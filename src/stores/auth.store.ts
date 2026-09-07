/**
 * Auth store for arcbase
 *
 * Wraps @arcevo/facet-store's useAuthStore with typed selectors
 * and convenience functions for common operations.
 *
 * Note: Keep auth-context.tsx during migration. This store can be
 * used alongside it for new facet-auth integration.
 */

import {
  useAuthStore,
  createZustandTokenStorage,
  type AuthState,
  type TokenStorage,
  type TokenRefresher,
} from "@arcevo/facet-store";
import type { User } from "@arcevo/facet-sdk";

// Re-export the store hook
export { useAuthStore };

// Re-export types
export type { AuthState, TokenStorage, TokenRefresher };

/**
 * Selectors for common auth state slices
 */
export const authSelectors = {
  user: (state: AuthState) => state.user as User | null,
  accessToken: (state: AuthState) => state.accessToken,
  refreshToken: (state: AuthState) => state.refreshToken,
  isAuthenticated: (state: AuthState) => state.isAuthenticated,
  isLoading: (state: AuthState) => state.isLoading,
};

/**
 * Convenience hooks for specific slices
 */
export const useUser = () => useAuthStore(authSelectors.user);
export const useIsAuthenticated = () => useAuthStore(authSelectors.isAuthenticated);
export const useAuthLoading = () => useAuthStore(authSelectors.isLoading);
export const useAccessToken = () => useAuthStore(authSelectors.accessToken);

/**
 * Creates a token storage bridge for the auth store.
 * Use this to wire up automatic token refresh with AuthSdk.
 *
 * @example
 * ```typescript
 * import { createSdks } from "@/lib/facet";
 * import { createAuthTokenStorage } from "@/stores/auth.store";
 *
 * const { auth } = createSdks();
 * const tokenStorage = createAuthTokenStorage(auth);
 * ```
 */
export function createAuthTokenStorage(sdk: TokenRefresher): TokenStorage {
  return createZustandTokenStorage({ authStore: useAuthStore, sdk });
}

/**
 * Store actions for external use
 */
export const authActions = {
  setAuth: (user: User, accessToken: string, refreshToken?: string) => {
    useAuthStore.getState().setAuth(user, accessToken, refreshToken ?? "");
  },
  setUser: (user: User) => {
    useAuthStore.getState().setUser(user);
  },
  setTokens: (accessToken: string, refreshToken?: string) => {
    useAuthStore.getState().setTokens(accessToken, refreshToken ?? "");
  },
  clearAuth: () => {
    useAuthStore.getState().clearAuth();
  },
  setLoading: (loading: boolean) => {
    useAuthStore.getState().setLoading(loading);
  },
};