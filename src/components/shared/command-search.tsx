"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, Folder, Sparkles, HelpCircle } from "lucide-react";
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { toast } from "sonner";

export default function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ resources: any[]; collections: any[] }>({
    resources: [],
    collections: [],
  });
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ resources: [], collections: [] });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch {
        toast.error("Failed to query indexed matrix resources");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const navigateTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div className="flex items-center px-3 border-b border-gray-100">
        <Search className="w-4 h-4 text-gray-400 shrink-0 mx-2" />
        <CommandInput
          placeholder="Search collections, workflows, nodes... (Ctrl+K)"
          value={query}
          onValueChange={setQuery}
        />
      </div>
      <CommandList>
        {loading && <div className="text-center text-xs py-6 text-gray-400">Querying ArcBase infrastructure...</div>}
        
        {results.resources.length > 0 && (
          <CommandGroup heading="Knowledge Resources">
            {results.resources.map((r) => (
              <CommandItem key={r.id} onSelect={() => navigateTo(`/resources/${r.id}`)}>
                <FileText className="w-4 h-4 text-gray-400" />
                <span>{r.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.collections.length > 0 && (
          <CommandGroup heading="Curated Collections">
            {results.collections.map((c) => (
              <CommandItem key={c.id} onSelect={() => navigateTo(`/collections/${c.id}`)}>
                <Folder className="w-4 h-4 text-indigo-400" />
                <span>{c.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Quick Operations">
          <CommandItem onSelect={() => navigateTo("/resources/new")}>
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Forge New Knowledge Resource Node</span>
          </CommandItem>
          <CommandItem onSelect={() => navigateTo("/help")}>
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <span>Access System Operations Documentation</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
