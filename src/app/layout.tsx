import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { Providers } from "@/context/provider";
import { generateSiteMetadata } from "@/lib/useful/utils/metadata";
import { siteConfig } from "@/config/site";

// Import your Tailwind global configuration layer
import "@styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-display", // Used for headings
});

// Configure default high-performance metadata configurations for the entire platform
export const metadata: Metadata = generateSiteMetadata({
  title: siteConfig.tagline,
  description: siteConfig.description,
  path: "/",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${montserrat.variable} font-sans antialiased min-h-screen bg-background text-foreground selection:bg-primary/20`}
      >
        {/* Unified state providers container engine */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
