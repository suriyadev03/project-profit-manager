"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import AttendanceTable, { AttendanceRow } from "@/components/attendance/AttendanceTable";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/calculations";

type RangeFilter = "today" | "week" | "month" | "custom";

interface DailySummaryRow {
  date: string;
  expenses: number;
  salary: number;
  total: number;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getRangeDates(filter: RangeFilter, customFrom: string, customTo: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return { from: toISODate(today), to: toISODate(today) };
  }
  if (filter === "week") {
    const from = new Date(today);
    from.setDate(from.getDate() - from.getDay());
    const to = new Date(from);
    to.setDate(to.getDate() + 6);
    return { from: toISODate(from), to: toISODate(to) };
  }
  if (filter === "month") {
    const from = new Date(today.getFullYear(), today.getMonth(), 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toISODate(from), to: toISODate(to) };
  }
  return { from: customFrom, to: customTo };
}

export default function AttendancePage() {
  const params = useParams();
  const projectId = params?.id as string;

  // Daily attendance marking
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [savingEmployeeId, setSavingEmployeeId] = useState<string | null>(null);

  // Daily project summary
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("week");
  const [customFrom, setCustomFrom] = useState(toISODate(new Date()));
  const [customTo, setCustomTo] = useState(toISODate(new Date()));
  const [summaryRows, setSummaryRows] = useState<DailySummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(true);

  const fetchAttendanceForDate = useCallback(async () => {
    setLoadingAttendance(true);
    const res = await fetch(`/api/projects/${projectId}/attendance?date=${selectedDate}`);
    const json = await res.json();
    if (json.success) setRows(json.data);
    setLoadingAttendance(false);
  }, [projectId, selectedDate]);

  useEffect(() => {
    if (projectId) fetchAttendanceForDate();
  }, [projectId, fetchAttendanceForDate]);

  const { from, to } = useMemo(
    () => getRangeDates(rangeFilter, customFrom, customTo),
    [rangeFilter, customFrom, customTo]
  );

  const fetchDailySummary = useCallback(async () => {
    if (!from || !to) return;
    setLoadingSummary(true);
    try {
      const [expensesRes, attendanceRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/expenses?from=${from}&to=${to}`),
        fetch(`/api/projects/${projectId}/attendance?from=${from}&to=${to}`),
      ]);
      const [expensesJson, attendanceJson] = await Promise.all([expensesRes.json(), attendanceRes.json()]);

      const map = new Map<string, { expenses: number; salary: number }>();

      if (expensesJson.success) {
        for (const e of expensesJson.data as { date: string; amount: number }[]) {
          const key = e.date.slice(0, 10);
          const entry = map.get(key) || { expenses: 0, salary: 0 };
          entry.expenses += e.amount;
          map.set(key, entry);
        }
      }
      if (attendanceJson.success) {
        for (const a of attendanceJson.data as { date: string; salary: number }[]) {
          const key = a.date.slice(0, 10);
          const entry = map.get(key) || { expenses: 0, salary: 0 };
          entry.salary += a.salary;
          map.set(key, entry);
        }
      }

      const result = Array.from(map.entries())
        .map(([date, v]) => ({ date, expenses: v.expenses, salary: v.salary, total: v.expenses + v.salary }))
        .sort((a, b) => b.date.localeCompare(a.date));

      setSummaryRows(result);
    } finally {
      setLoadingSummary(false);
    }
  }, [projectId, from, to]);

  useEffect(() => {
    if (projectId) fetchDailySummary();
  }, [projectId, fetchDailySummary]);

  const handleMark = async (employeeId: string, status: "Present" | "Half Day" | "Absent") => {
    setSavingEmployeeId(employeeId);
    try {
      const res = await fetch(`/api/projects/${projectId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, date: selectedDate, status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Marked ${status}`);
        fetchAttendanceForDate();
        fetchDailySummary();
      } else {
        toast.error(json.error || "Failed to mark attendance");
      }
    } finally {
      setSavingEmployeeId(null);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(toISODate(d));
  };

  return (
    <div className="space-y-8">
      {/* Daily attendance marking */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Daily Attendance</h2>
            <p className="text-sm text-gray-500">Mark employee attendance and auto-calculate salary.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => shiftDate(-1)} className="btn-secondary px-2 py-2">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <button onClick={() => shiftDate(1)} className="btn-secondary px-2 py-2">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4">
          {loadingAttendance ? (
            <LoadingSpinner label="Loading attendance..." />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No employees to mark"
              description="Add employees to this project first, then mark their daily attendance here."
            />
          ) : (
            <AttendanceTable rows={rows} onMark={handleMark} savingEmployeeId={savingEmployeeId} />
          )}
        </div>
      </section>

      {/* Daily project summary */}
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Daily Project Summary</h2>
            <p className="text-sm text-gray-500">Expenses + salary spent, grouped by day.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["today", "week", "month", "custom"] as RangeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setRangeFilter(f)}
                className={
                  rangeFilter === f
                    ? "rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                }
              >
                {f === "today" ? "Today" : f === "week" ? "This Week" : f === "month" ? "This Month" : "Custom Range"}
              </button>
            ))}
          </div>
        </div>

        {rangeFilter === "custom" && (
          <div className="mt-3 flex items-center gap-3">
            <input type="date" className="input-field w-40" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span className="text-sm text-gray-400">to</span>
            <input type="date" className="input-field w-40" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </div>
        )}

        <div className="mt-4">
          {loadingSummary ? (
            <LoadingSpinner label="Loading summary..." />
          ) : summaryRows.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No spending in this range" />
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <div className="space-y-3 sm:hidden">
                {summaryRows.map((row) => (
                  <div key={row.date} className="card">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900">{formatDate(row.date)}</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(row.total)}</p>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Expenses: {formatCurrency(row.expenses)}</span>
                      <span>Salary: {formatCurrency(row.salary)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / tablet: full table */}
              <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Expenses</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Salary</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-500">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summaryRows.map((row) => (
                      <tr key={row.date} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">{formatDate(row.date)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.expenses)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(row.salary)}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
