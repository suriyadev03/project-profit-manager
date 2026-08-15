"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import clsx from "clsx";

export interface BottomTab {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}

/** Native-app-style fixed bottom tab bar, mobile only. */
export default function BottomTabBar({ tabs }: { tabs: BottomTab[] }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      aria-label="Project sections"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium transition",
                tab.active ? "text-brand-700" : "text-gray-400"
              )}
            >
              <Icon className={clsx("h-5 w-5", tab.active && "fill-brand-100")} strokeWidth={tab.active ? 2.4 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
