"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import clsx from "clsx";
import { ArrowLeft, LayoutDashboard, Receipt, IndianRupee, Users, CalendarCheck } from "lucide-react";
import BottomTabBar from "@/components/ui/BottomTabBar";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const id = params?.id as string;

  const tabs = [
    { href: `/projects/${id}`, label: "Dashboard", icon: LayoutDashboard },
    { href: `/projects/${id}/expenses`, label: "Expenses", icon: Receipt },
    { href: `/projects/${id}/payments`, label: "Payments", icon: IndianRupee },
    { href: `/projects/${id}/employees`, label: "Employees", icon: Users },
    { href: `/projects/${id}/attendance`, label: "Attendance", icon: CalendarCheck },
  ];

  const tabsWithActive = tabs.map((tab) => ({
    ...tab,
    active: tab.href === `/projects/${id}` ? pathname === tab.href : !!pathname?.startsWith(tab.href),
  }));

  return (
    <div>
      <Link href="/projects" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to Projects
      </Link>

      {/* Desktop / tablet: horizontal tab strip. Mobile gets a fixed bottom
          tab bar instead (below), which reads more like a native app than a
          horizontally-scrolling row of text tabs would. */}
      <div className="mb-6 hidden border-b border-gray-200 sm:block">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabsWithActive.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={clsx(
                "whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium",
                tab.active ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-700"
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Bottom padding on mobile clears the fixed BottomTabBar so content
          never sits underneath it. */}
      <div className="pb-20 sm:pb-0">{children}</div>

      <BottomTabBar tabs={tabsWithActive} />
    </div>
  );
}
