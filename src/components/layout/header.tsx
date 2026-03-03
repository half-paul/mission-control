"use client";

import { useEffect } from "react";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/hooks/use-ui-store";

export function Header() {
  const { toggleSidebar, openCommandPalette } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950/95 px-4 md:px-6 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-zinc-400 hover:text-zinc-50"
        onClick={toggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <div className="flex flex-1 items-center gap-4">
        {/* Search Trigger */}
        <div 
          className="relative flex-1 max-w-md group cursor-pointer"
          onClick={openCommandPalette}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 group-hover:text-zinc-300 transition-colors" />
          <div className="flex h-9 w-full items-center rounded-md border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 text-sm text-zinc-500 group-hover:border-zinc-700 transition-all">
            Search issues, actions...
          </div>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-medium text-zinc-600 group-hover:text-zinc-500 transition-colors">
            <kbd className="rounded border border-zinc-800 px-1.5 font-sans bg-zinc-950">⌘K</kbd>
          </div>
        </div>
      </div>

      {/* Right side - simplified */}
      <div className="hidden md:flex items-center gap-4">
        <div className="text-xs text-zinc-500 italic">
          Press <kbd className="mx-1 rounded border border-zinc-800 px-1 font-sans">G</kbd> then <kbd className="mx-1 rounded border border-zinc-800 px-1 font-sans">I</kbd> for All Issues
        </div>
      </div>
    </header>
  );
}
