"use client";

import React, { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { ICON_REGISTRY } from "@/lib/useful/utils/icon-registry";
import { useTheme } from "@/hooks/use-theme";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const MenuIcon = ICON_REGISTRY.menu;
  const CloseIcon = ICON_REGISTRY.close;
  const SunIcon = ICON_REGISTRY.idea;
  const MoonIcon = ICON_REGISTRY.power;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-200">
      {/* Structural Header Section */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary"
            >
              <span className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-black">
                A
              </span>
              {siteConfig.name}
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {siteConfig.mainNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle visual theme"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5 text-amber-400" />
              ) : (
                <MoonIcon className="h-5 w-5 text-slate-700" />
              )}
            </button>
            {siteConfig.authNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  item.label === "Register"
                    ? "px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 transition-colors"
                    : "px-4 py-2 text-sm font-medium rounded-lg hover:bg-muted text-foreground transition-colors"
                }
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Handheld Device Trigger Menu */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {isDark ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Handheld Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 pt-2 pb-4 space-y-1">
            {siteConfig.mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border mt-2 space-y-2">
              {siteConfig.authNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center px-3 py-2 rounded-lg text-base font-medium bg-muted"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Main Structural Yield View */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Structured Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. {siteConfig.tagline}
          </p>
        </div>
      </footer>
    </div>
  );
}
