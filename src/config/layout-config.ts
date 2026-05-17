export type HeaderStyle = "minimal" | "global" | "wizard" | "dashboard";

export interface NavigationConfig {
  showNavbar: boolean;
  showSidebar: boolean;
  headerStyle: HeaderStyle;
  allowMobileDrawer: boolean;
  contentMaxWidth: "max-w-7xl" | "max-w-4xl" | "max-w-xl" | "max-w-md" | "w-full";
}

export const layoutRoutingMatrix: Record<string, NavigationConfig> = {
  "/login": { showNavbar: false, showSidebar: false, headerStyle: "minimal", allowMobileDrawer: false, contentMaxWidth: "max-w-md" },
  "/register": { showNavbar: false, showSidebar: false, headerStyle: "minimal", allowMobileDrawer: false, contentMaxWidth: "max-w-md" },
  "/onboarding": { showNavbar: false, showSidebar: false, headerStyle: "wizard", allowMobileDrawer: false, contentMaxWidth: "max-w-xl" },
  "/dashboard": { showNavbar: false, showSidebar: true, headerStyle: "dashboard", allowMobileDrawer: true, contentMaxWidth: "w-full" },
  "/resources": { showNavbar: false, showSidebar: true, headerStyle: "dashboard", allowMobileDrawer: true, contentMaxWidth: "w-full" },
  "/collections": { showNavbar: false, showSidebar: true, headerStyle: "dashboard", allowMobileDrawer: true, contentMaxWidth: "w-full" },
};

export function getLayoutConfig(pathname: string): NavigationConfig {
  const matchedKey = Object.keys(layoutRoutingMatrix).find(
    (key) => pathname === key || pathname.startsWith(`${key}/`)
  );
  return (
    layoutRoutingMatrix[matchedKey || ""] ?? {
      showNavbar: true,
      showSidebar: false,
      headerStyle: "global",
      allowMobileDrawer: true,
      contentMaxWidth: "max-w-7xl",
    }
  );
}
