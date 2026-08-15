"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Wallet,
  Receipt,
  Users,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  Pencil,
  Trash2,
  IndianRupee,
  Landmark,
  HandCoins,
} from "lucide-react";
import SummaryCard from "@/components/dashboard/SummaryCard";
import BudgetHealthBadge from "@/components/ui/BudgetHealthBadge";
import {
  ExpenseVsSalaryChart,
  DailySpendingChart,
  ExpenseCategoryChart,
  BudgetUsageChart,
  CashFlowChart,
} from "@/components/dashboard/ProjectChart";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AddProjectModal from "@/components/projects/AddProjectModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/calculations";
import { IProject, ProjectSummary } from "@/types/project";

interface SummaryResponse {
  project: IProject;
  summary: ProjectSummary;
  charts: {
    expenseVsSalary: { name: string; value: number }[];
    dailySpending: { date: string; expenses: number; salary: number; total: number }[];
    expenseByCategory: { category: string; amount: number }[];
    budgetUsage: { name: string; value: number }[];
    cashFlow: { date: string; spent: number; received: number }[];
  };
}

export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${id}/summary`);
    const json = await res.json();
    if (json.success) setData(json.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) fetchSummary();
  }, [id, fetchSummary]);

  const handleDeleteProject = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Project deleted");
        router.push("/projects");
      } else {
        toast.error(json.error || "Failed to delete project");
        setDeleting(false);
      }
    } catch {
      toast.error("Failed to reach the server");
      setDeleting(false);
    }
  };

  if (loading || !data) return <LoadingSpinner label="Loading project dashboard..." />;

  const { project, summary, charts } = data;
  const profitPositive = summary.profit >= 0;
  const cashPositive = summary.cashPosition >= 0;
  const outstandingDue = summary.outstandingBalance > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
            <BudgetHealthBadge health={summary.budgetHealth} />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(project.startDate)}
            {project.endDate ? ` – ${formatDate(project.endDate)}` : ""} · {project.status}
          </p>
          {project.description && <p className="mt-2 max-w-2xl text-sm text-gray-600">{project.description}</p>}
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4" /> Edit Project
          </button>
          <button className="btn-secondary text-red-600 hover:bg-red-50" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      {/* Cost & budget */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Cost &amp; Budget</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <SummaryCard label="Project Budget" value={formatCurrency(summary.budget)} icon={Wallet} tone="brand" />
          <SummaryCard label="Total Expenses" value={formatCurrency(summary.totalExpenses)} icon={Receipt} />
          <SummaryCard label="Employee Salary" value={formatCurrency(summary.totalSalary)} icon={Users} />
          <SummaryCard label="Total Spent" value={formatCurrency(summary.totalSpent)} icon={PiggyBank} />
          <SummaryCard
            label="Remaining Budget"
            value={formatCurrency(summary.remainingBudget)}
            icon={summary.remainingBudget >= 0 ? TrendingUp : TrendingDown}
            tone={summary.remainingBudget >= 0 ? "positive" : "negative"}
          />
          <SummaryCard
            label="Profit (Budget − Spent)"
            value={formatCurrency(summary.profit)}
            icon={profitPositive ? TrendingUp : TrendingDown}
            tone={profitPositive ? "positive" : "negative"}
          />
          <SummaryCard
            label="Profit %"
            value={formatPercentage(summary.profitPercentage)}
            icon={Percent}
            tone={profitPositive ? "positive" : "negative"}
          />
        </div>
      </div>

      {/* Payroll — wages earned vs actually paid out to workers */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Payroll</h2>
          <Link href={`/projects/${project._id}/employees`} className="text-xs font-medium text-brand-700 hover:underline">
            Manage employees →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <SummaryCard label="Salary Earned" value={formatCurrency(summary.totalSalary)} icon={Users} />
          <SummaryCard label="Salary Paid Out" value={formatCurrency(summary.totalSalaryPaid)} icon={HandCoins} tone="positive" />
          <SummaryCard
            label="Salary Pending"
            value={formatCurrency(summary.pendingSalary)}
            icon={summary.pendingSalary > 0 ? TrendingDown : TrendingUp}
            tone={summary.pendingSalary > 0 ? "negative" : "default"}
          />
        </div>
      </div>

      {/* Cash & collections — the real money-in-hand picture */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Cash &amp; Collections</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <SummaryCard label="Received from Client" value={formatCurrency(summary.totalReceived)} icon={IndianRupee} tone="positive" />
          <SummaryCard
            label="Outstanding (Due)"
            value={formatCurrency(Math.max(summary.outstandingBalance, 0))}
            icon={Landmark}
            tone={outstandingDue ? "negative" : "default"}
          />
          <SummaryCard label="Collection %" value={formatPercentage(summary.collectionPercentage)} icon={Percent} />
          <SummaryCard
            label="Cash Position (Received − Spent)"
            value={formatCurrency(summary.cashPosition)}
            icon={cashPositive ? TrendingUp : TrendingDown}
            tone={cashPositive ? "positive" : "negative"}
          />
        </div>
      </div>

      {/* Charts */}
      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Trends</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Cash Flow — Received vs Spent (cumulative)</h3>
            <CashFlowChart data={charts.cashFlow} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Expense vs Salary</h3>
            <ExpenseVsSalaryChart data={charts.expenseVsSalary} />
          </div>
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Budget Usage</h3>
            <BudgetUsageChart data={charts.budgetUsage} />
          </div>
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Daily Spending</h3>
            <DailySpendingChart data={charts.dailySpending} />
          </div>
          <div className="card">
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Expense by Category</h3>
            <ExpenseCategoryChart data={charts.expenseByCategory} />
          </div>
        </div>
      </div>

      {showEdit && (
        <AddProjectModal
          editingProject={project}
          onClose={() => setShowEdit(false)}
          onCreated={() => fetchSummary()}
        />
      )}

      <ConfirmDeleteModal
        open={showDelete}
        title="Delete project"
        message={`Delete "${project.name}"? This permanently removes the project along with all of its expenses, employees, attendance records, client payments, and salary payments. This action cannot be undone.`}
        loading={deleting}
        onCancel={() => setShowDelete(false)}
        onConfirm={handleDeleteProject}
      />
    </div>
  );
}
