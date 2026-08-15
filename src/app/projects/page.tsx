"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Search, LayoutGrid, List as ListIcon } from "lucide-react";
import ProjectCard from "@/components/projects/ProjectCard";
import ProjectTable from "@/components/projects/ProjectTable";
import AddProjectModal from "@/components/projects/AddProjectModal";
import SummaryCard from "@/components/dashboard/SummaryCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import { ProjectWithSummary } from "@/types/project";
import { formatCurrency } from "@/lib/calculations";
import { FolderPlus, Wallet, PiggyBank, TrendingUp, TrendingDown, Landmark, HandCoins } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"grid" | "table">("grid");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);

      const res = await fetch(`/api/projects?${params.toString()}`);
      const json = await res.json();
      if (json.success) setProjects(json.data);
    } finally {
      setLoading(false);
    }
  }, [search, status, sortBy, sortOrder]);

  useEffect(() => {
    const timeout = setTimeout(fetchProjects, 300);
    return () => clearTimeout(timeout);
  }, [fetchProjects]);

  // Cross-project totals — computed client-side from the already-fetched list,
  // so a contractor running several jobs at once can see the whole picture
  // at a glance instead of clicking into each project.
  const totals = useMemo(() => {
    return projects.reduce(
      (acc, p) => {
        acc.budget += p.summary.budget;
        acc.spent += p.summary.totalSpent;
        acc.profit += p.summary.profit;
        acc.outstanding += Math.max(p.summary.outstandingBalance, 0);
        acc.salaryPending += p.summary.pendingSalary;
        return acc;
      },
      { budget: 0, spent: 0, profit: 0, outstanding: 0, salaryPending: 0 }
    );
  }, [projects]);
  const profitPositive = totals.profit >= 0;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500">Track budgets, expenses, salaries and profit for every project.</p>
        </div>
        <button className="btn-primary hidden sm:inline-flex" onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" /> Add Project
        </button>
      </div>

      {/* Cross-project overview */}
      {!loading && projects.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard label="Total Budget" value={formatCurrency(totals.budget)} icon={Wallet} tone="brand" />
          <SummaryCard label="Total Spent" value={formatCurrency(totals.spent)} icon={PiggyBank} />
          <SummaryCard
            label="Total Profit"
            value={formatCurrency(totals.profit)}
            icon={profitPositive ? TrendingUp : TrendingDown}
            tone={profitPositive ? "positive" : "negative"}
          />
          <SummaryCard label="Outstanding (Due)" value={formatCurrency(totals.outstanding)} icon={Landmark} />
          <SummaryCard
            label="Salary Pending"
            value={formatCurrency(totals.salaryPending)}
            icon={HandCoins}
            tone={totals.salaryPending > 0 ? "negative" : "default"}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            className="input-field pl-9"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="input-field sm:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>

        <select
          className="input-field sm:w-44"
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split("-");
            setSortBy(by);
            setSortOrder(order);
          }}
        >
          <option value="createdAt-desc">Newest First</option>
          <option value="budget-desc">Budget: High to Low</option>
          <option value="budget-asc">Budget: Low to High</option>
          <option value="profit-desc">Profit: High to Low</option>
          <option value="profit-asc">Profit: Low to High</option>
        </select>

        {/* Table view is a poor fit on small screens, so the toggle — and the
            table itself — only appear from the sm breakpoint up; phones always
            get the card grid. */}
        <div className="hidden gap-1 rounded-lg border border-gray-300 p-1 sm:flex">
          <button
            onClick={() => setView("grid")}
            className={`rounded p-1.5 ${view === "grid" ? "bg-brand-100 text-brand-700" : "text-gray-400"}`}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("table")}
            className={`rounded p-1.5 ${view === "table" ? "bg-brand-100 text-brand-700" : "text-gray-400"}`}
            aria-label="Table view"
          >
            <ListIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner label="Loading projects..." />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={FolderPlus}
            title="No projects yet"
            description="Create your first project to start tracking expenses, salaries and profit."
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Add Project
              </button>
            }
          />
        ) : (
          <>
            {/* Phones always get the card grid, even if "table" is selected —
                the table view (and its toggle) only exists from sm up. */}
            <div
              className={
                view === "table"
                  ? "grid grid-cols-1 gap-4 sm:hidden"
                  : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              }
            >
              {projects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
            {view === "table" && (
              <div className="hidden sm:block">
                <ProjectTable projects={projects} />
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <AddProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => fetchProjects()}
        />
      )}

      <FAB label="Add Project" onClick={() => setShowModal(true)} aboveTabBar={false} />
    </div>
  );
}
