"use client";

import Link from "next/link";
import { ProjectWithSummary } from "@/types/project";
import { formatCurrency, formatPercentage } from "@/lib/calculations";
import BudgetHealthBadge from "@/components/ui/BudgetHealthBadge";
import clsx from "clsx";

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Completed: "bg-blue-100 text-blue-700",
  "On Hold": "bg-yellow-100 text-yellow-700",
};

export default function ProjectTable({ projects }: { projects: ProjectWithSummary[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Project Name</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Budget</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Total Spent</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Received</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Outstanding</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Profit</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Profit %</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Budget Health</th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {projects.map((project) => (
            <tr key={project._id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <Link href={`/projects/${project._id}`} className="font-medium text-brand-700 hover:underline">
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(project.budget)}</td>
              <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(project.summary.totalSpent)}</td>
              <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(project.summary.totalReceived)}</td>
              <td className="px-4 py-3 text-right text-gray-700">
                {formatCurrency(Math.max(project.summary.outstandingBalance, 0))}
              </td>
              <td
                className={clsx(
                  "px-4 py-3 text-right font-medium",
                  project.summary.profit >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(project.summary.profit)}
              </td>
              <td className="px-4 py-3 text-right text-gray-700">
                {formatPercentage(project.summary.profitPercentage)}
              </td>
              <td className="px-4 py-3">
                <BudgetHealthBadge health={project.summary.budgetHealth} />
              </td>
              <td className="px-4 py-3">
                <span className={clsx("rounded-full px-2.5 py-1 text-xs font-medium", statusColors[project.status])}>
                  {project.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
