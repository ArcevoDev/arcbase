import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteMetadata } from "@/lib/metadata";
import { AuthProvider } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

// Optimize and configure Google Font utilities with native CSS variable fallback structures
const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={cn("h-full scroll-smooth", fontSans.variable, fontMono.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-50 font-sans antialiased text-gray-900 selection:bg-indigo-500 selection:text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
