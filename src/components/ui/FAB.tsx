"use client";

import { LucideIcon, Plus } from "lucide-react";
import clsx from "clsx";

interface FABProps {
  onClick: () => void;
  icon?: LucideIcon;
  label?: string;
  /** Set true when a bottom tab bar is present so the FAB sits above it instead of the screen edge. */
  aboveTabBar?: boolean;
}

/** Mobile-only floating action button — the primary "Add" action, native-app style. */
export default function FAB({ onClick, icon: Icon = Plus, label = "Add", aboveTabBar = true }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={clsx(
        "fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-700 active:scale-95 sm:hidden",
        aboveTabBar ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]"
      )}
    >
      <Icon className="h-6 w-6" />
    </button>
  );
}
