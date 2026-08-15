"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency } from "@/lib/calculations";

// Validated categorical palette (fixed order — see dataviz skill palette.md).
// Ordering is the CVD-safety mechanism, not cosmetic: keep this order.
const COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

// Status colors (fixed, never themed) — used where a mark represents a
// good/bad state rather than a category.
const STATUS_GOOD = "#0ca30c";
const STATUS_CRITICAL = "#d03b3b";

interface NamedValue {
  name: string;
  value: number;
}

interface CategoryValue {
  category: string;
  amount: number;
}

interface DailyPoint {
  date: string;
  expenses: number;
  salary: number;
  total: number;
}


interface CashFlowPoint {
  date: string;
  spent: number;
  received: number;
}

export function ExpenseVsSalaryChart({ data }: { data: NamedValue[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          tickFormatter={(v) => formatCurrency(v)}
          width={90}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Bar dataKey="value" fill={COLORS[0]} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. Daily Spending — line chart
export function DailySpendingChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          tickFormatter={(v) => formatCurrency(v)}
          width={90}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Line type="monotone" dataKey="total" name="Total Spent" stroke={COLORS[0]} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// 3. Expense by Category — pie chart
export function ExpenseCategoryChart({ data }: { data: CategoryValue[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-gray-400">No expenses recorded yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => entry.category}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 4. Budget Usage — pie chart (used vs remaining). Used/remaining is a
// good/bad state, not a category, so it takes the fixed status colors.
export function BudgetUsageChart({ data }: { data: NamedValue[] }) {
  const colors = [STATUS_CRITICAL, STATUS_GOOD];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(entry) => entry.name}>
          {data.map((_, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 5. Cash Flow — cumulative received vs cumulative spent over time.
// The gap between the two lines is real cash position (received - spent),
// distinct from the budget-based `profit` figure shown in the summary cards.
export function CashFlowChart({ data }: { data: CashFlowPoint[] }) {
  if (!data.length) {
    return <p className="py-10 text-center text-sm text-gray-400">No activity recorded yet</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#898781" }} axisLine={{ stroke: "#c3c2b7" }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12, fill: "#898781" }}
          tickFormatter={(v) => formatCurrency(v)}
          width={90}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip formatter={(v: number) => formatCurrency(v)} />
        <Legend />
        <Line type="monotone" dataKey="received" name="Received from Client" stroke={STATUS_GOOD} strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="spent" name="Total Spent" stroke={STATUS_CRITICAL} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
