"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FolderKanban } from "lucide-react";
import clsx from "clsx";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [{ href: "/projects", label: "Projects", icon: FolderKanban }];

  return (
    <>
      {/* Mobile: simple sticky app header, native-app style. No drawer menu —
          there's only one top-level destination, and in-project navigation
          lives in the bottom tab bar (see ProjectLayout). */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur lg:hidden">
        <Link href="/projects" className="flex items-center gap-2 font-semibold text-gray-900">
          <LayoutDashboard className="h-5 w-5 text-brand-600" />
          Profit Manager
        </Link>
      </div>

      {/* Desktop / tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-6 font-semibold text-gray-900">
          <LayoutDashboard className="h-5 w-5 text-brand-600" />
          Profit Manager
        </div>
        <nav className="space-y-1 px-3 py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
