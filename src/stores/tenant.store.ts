/**
 * Tenant store for arcbase
 *
 * Wraps @arcevo/facet-store's useTenantStore for multi-tenant
 * workspace/subscription management.
 */

import {
  useTenantStore,
  type TenantState,
} from "@arcevo/facet-store";
import type { Tenant } from "@arcevo/facet-sdk";

// Re-export the store hook
export { useTenantStore };

// Re-export types
export type { TenantState };

/**
 * Selectors for common tenant state slices
 */
export const tenantSelectors = {
  activeTenant: (state: TenantState) => state.activeTenant as Tenant | null,
  tenants: (state: TenantState) => state.tenants as Tenant[],
  isLoading: (state: TenantState) => state.isLoading,
};

/**
 * Convenience hooks for specific slices
 */
export const useActiveTenant = () => useTenantStore(tenantSelectors.activeTenant);
export const useTenants = () => useTenantStore(tenantSelectors.tenants);
export const useTenantLoading = () => useTenantStore(tenantSelectors.isLoading);

/**
 * Store actions for external use
 */
export const tenantActions = {
  setActiveTenant: (tenant: Tenant) => {
    useTenantStore.getState().setActiveTenant(tenant);
  },
  setTenants: (tenants: Tenant[]) => {
    useTenantStore.getState().setTenants(tenants);
  },
  setLoading: (loading: boolean) => {
    useTenantStore.getState().setLoading(loading);
  },
  reset: () => {
    useTenantStore.getState().reset();
  },
};