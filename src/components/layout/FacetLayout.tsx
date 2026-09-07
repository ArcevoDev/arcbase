"use client";

import React from "react";
import {
  ConsoleLayout,
  LandingLayout,
  resolveLayoutPreset,
} from "@arcevo/facet-layout";
import { siteConfig } from "@/config/site";

// Default layout preset for arcbase
const arcbaseLayoutPreset = resolveLayoutPreset("default", {
  brand: {
    name: siteConfig.name,
    logo: null,
  },
  navigation: [
    {
      title: "Workspace",
      items: siteConfig.dashboardNavItems.map((item) => ({
        label: item.label,
        href: item.href,
      })),
    },
  ],
});

/**
 * Dashboard layout using facet-layout's ConsoleLayout
 */
export function FacetDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConsoleLayout config={arcbaseLayoutPreset}>
      {children}
    </ConsoleLayout>
  );
}

/**
 * Marketing/landing page layout using facet-layout's LandingLayout
 */
export function FacetMarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingLayout
      hero={
        <section className="py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight">{siteConfig.name}</h1>
          <p className="text-xl text-muted-foreground mt-4 max-w-2xl mx-auto">
            {siteConfig.tagline}
          </p>
        </section>
      }
    >
      {children}
    </LandingLayout>
  );
}
