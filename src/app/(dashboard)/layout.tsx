"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { getLayoutConfig } from "@/config/layout-config";
import { useMobile } from "@/hooks/use-mobile";
import CommandSearch from "@/components/shared/command-search";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderKanban, Library, Menu, X, Terminal, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export default function StructuralLayoutMatrix({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const config = getLayoutConfig(pathname);
  const isMobile = useMobile();
  const { toggleTheme, isDark } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navigationLinks = [
    { label: "Console Terminal", path: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Knowledge Nodes", path: "/resources", icon: <Library className="w-4 h-4" /> },
    { label: "Collection Repos", path: "/collections", icon: <FolderKanban className="w-4 h-4" /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 p-5 select-none">
      <div className="flex items-center gap-2.5 px-2 py-4 border-b border-gray-100 dark:border-gray-900 mb-6">
        <Terminal className="w-6 h-6 text-indigo-600" />
        <span className="font-extrabold tracking-tight text-base text-gray-900 dark:text-white">ArcBase Core</span>
      </div>

      <nav className="space-y-1 flex-1">
        {navigationLinks.map((link) => {
          const active = pathname === link.path || pathname.startsWith(`${link.path}/`);
          return (
            <Link
              key={link.path}
              href={link.path}
              onClick={() => setMobileSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-150 group",
                active
                  ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <div className={cn(active ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")}>
                {link.icon}
              </div>
              {link.label}
            </Link>
          );
        })}
      </nav>
      
      <div className="pt-4 border-t border-gray-100 dark:border-gray-900">
        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          <span>Toggle Core theme</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* DESKTOP SIDEBAR MOUNT */}
      {config.showSidebar && !isMobile && <aside className="w-64 fixed inset-y-0 left-0 z-20">{sidebarContent}</aside>}

      {/* MOBILE DRAWER VIEWPORT OVERLAY */}
      {config.showSidebar && isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="relative w-64 max-w-sm h-full animate-in slide-in-from-left duration-200">{sidebarContent}</div>
        </div>
      )}

      {/* PRIMARY MASTER SPACE SHELL CONTENT FRAME */}
      <div className={cn("flex-1 flex flex-col min-w-0", config.showSidebar && !isMobile ? "pl-64" : "")}>
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {config.showSidebar && isMobile && (
              <button
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-lg text-gray-500 focus:outline-none"
              >
                {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
            <span className="font-bold text-sm tracking-tight capitalize text-gray-900 dark:text-white">
              {pathname.split("/").pop() || "Ecosystem Portal"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border border-gray-200 bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-400 shadow-sm">
              <span className="text-xs">⌘</span>K
            </kbd>
          </div>
        </header>

        <main className="flex-1 flex justify-center p-4 md:p-8 overflow-y-auto">
          <div className={cn("w-full transition-all duration-300", config.contentMaxWidth)}>
            {children}
          </div>
        </main>
      </div>

      <CommandSearch />
    </div>
  );
}
