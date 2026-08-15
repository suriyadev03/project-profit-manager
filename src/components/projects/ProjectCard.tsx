"use client";

import Link from "next/link";
import { ProjectWithSummary } from "@/types/project";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/calculations";
import BudgetHealthBadge from "@/components/ui/BudgetHealthBadge";
import clsx from "clsx";
import { Calendar } from "lucide-react";

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  "On Hold": "bg-yellow-100 text-yellow-700",
};

export default function ProjectCard({ project }: { project: ProjectWithSummary }) {
  const { summary } = project;
  const profitPositive = summary.profit >= 0;

  return (
    <Link
      href={`/projects/${project._id}`}
      className="card block transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-900">{project.name}</h3>
        <span className={clsx("shrink-0 rounded-full px-2.5 py-1 text-xs font-medium", statusColors[project.status])}>
          {project.status}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(project.startDate)}
          {project.endDate ? ` – ${formatDate(project.endDate)}` : ""}
        </span>
        <BudgetHealthBadge health={summary.budgetHealth} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Budget</p>
          <p className="font-medium text-gray-900">{formatCurrency(project.budget)}</p>
        </div>
        <div>
          <p className="text-gray-500">Total Spent</p>
          <p className="font-medium text-gray-900">{formatCurrency(summary.totalSpent)}</p>
        </div>
        <div>
          <p className="text-gray-500">Received</p>
          <p className="font-medium text-gray-900">{formatCurrency(summary.totalReceived)}</p>
        </div>
        <div>
          <p className="text-gray-500">Outstanding</p>
          <p className="font-medium text-gray-900">{formatCurrency(Math.max(summary.outstandingBalance, 0))}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-500">Profit</p>
          <p className={clsx("text-lg font-semibold", profitPositive ? "text-green-600" : "text-red-600")}>
            {formatCurrency(summary.profit)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Profit %</p>
          <p className={clsx("text-lg font-semibold", profitPositive ? "text-green-600" : "text-red-600")}>
            {formatPercentage(summary.profitPercentage)}
          </p>
        </div>
      </div>
    </Link>
  );
}
