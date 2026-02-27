"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="flex flex-1 items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search issues, projects... (Cmd+K)"
            className="w-full pl-10 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Right side - can add notifications, user menu later */}
      <div className="flex items-center gap-4">
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 font-mono text-xs font-medium text-zinc-400 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>
    </header>
  );
}
