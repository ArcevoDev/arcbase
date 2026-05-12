"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";

export default function CommandSearch({ resources }: { resources: any[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search ArcBase..." />
      <CommandList>
        {resources.map((r) => (
          <CommandItem
            key={r.id}
            onSelect={() => router.push(`/resources/${r.id}`)}
          >
            {r.title}
          </CommandItem>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
