"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  CheckSquare,
  Settings,
  Rocket,
  PlusCircle,
  X,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/hooks/use-ui-store";
import { useAuth } from "@/hooks/use-auth";

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    name: "Board",
    href: "/board",
    icon: Rocket,
  },
  {
    name: "All Issues",
    href: "/issues",
    icon: ListTodo,
  },
  {
    name: "My Issues",
    href: "/my-issues",
    icon: CheckSquare,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { openNewIssueModal, isSidebarOpen, setSidebarOpen } = useUIStore();
  const { data: user, logout, isLoggingOut } = useAuth();

  // Close sidebar on navigation change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-zinc-800 bg-zinc-950 transition-transform duration-300 md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-6">
            <h1 className="text-xl font-bold text-zinc-50">Mission Control</h1>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-zinc-400"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Action Button */}
          <div className="px-3 pt-4">
            <Button
              onClick={openNewIssueModal}
              className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusCircle className="h-4 w-4" />
              New Issue
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-50"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-zinc-800 p-4">
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-zinc-900 disabled:opacity-50 group"
              title="Click to logout"
              data-testid="logout-button"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-50 uppercase group-hover:bg-zinc-700">
                {user?.name?.[0] || "U"}
              </div>
              <div className="flex flex-1 flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-zinc-50 group-hover:text-blue-400">
                  {user?.name || "Loading..."}
                </span>
                <span className="truncate text-xs text-zinc-400">
                  Log out
                </span>
              </div>
              <LogOut className="h-4 w-4 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
