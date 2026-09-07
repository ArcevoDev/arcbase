/**
 * UserMenu component using @arcevo/facet-auth
 *
 * Wraps the facet-auth UserButton component for authenticated
 * user dropdown in the header/navbar.
 */

"use client";

import { UserButton, ArcProvider } from "@arcevo/facet-auth";
import { getClientSideClient } from "@/lib/facet";

/**
 * User dropdown menu for authenticated users
 */
export function FacetUserMenu() {
  return (
    <ArcProvider client={getClientSideClient()}>
      <UserButton
        appearance={{
          className: "w-full",
        }}
      />
    </ArcProvider>
  );
}
