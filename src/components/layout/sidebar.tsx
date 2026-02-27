"use client";

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
} from "lucide-react";

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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <h1 className="text-xl font-bold text-zinc-50">
            Mission Control
          </h1>
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
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-zinc-50">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-50">User</span>
              <span className="text-xs text-zinc-400">user@example.com</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
