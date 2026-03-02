"use client";

import { useEffect } from "react";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/hooks/use-ui-store";

export function Header() {
  const { openNewIssueModal, toggleSidebar } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        openNewIssueModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openNewIssueModal]);

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
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="search"
            placeholder="Search issues... (Cmd+K)"
            className="w-full pl-10 bg-zinc-900 border-zinc-800 text-zinc-50 placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <kbd className="pointer-events-none flex h-5 select-none items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-1.5 font-mono font-medium text-zinc-400">
            <span className="text-xs">⌘</span>K
          </kbd>
          <span>for New Issue</span>
        </div>
      </div>
    </header>
  );
}
