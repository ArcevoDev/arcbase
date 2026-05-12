"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="font-semibold text-lg">
          ArcBase
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex w-64">
            <Input placeholder="Search resources (Ctrl + K)" />
          </div>

          <Link href="/resources">
            <Button variant="ghost">Resources</Button>
          </Link>

          <Link href="/resources/new">
            <Button>New Resource</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
