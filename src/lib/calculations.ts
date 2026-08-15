import { AttendanceStatus } from "@/types/attendance";
import { BudgetHealth, ProjectSummary } from "@/types/project";

/**
 * Centralized financial calculation utilities.
 * Every profit/spend figure in the app must be derived through these
 * functions so calculations stay consistent everywhere they're used.
 */

/** Salary owed for a single attendance record based on status. */
export function calculateAttendanceSalary(
  status: AttendanceStatus,
  dailySalary: number
): number {
  switch (status) {
    case "Present":
      return dailySalary;
    case "Half Day":
      return dailySalary / 2;
    case "Absent":
    default:
      return 0;
  }
}

/** Sum of a list of numeric amounts. */
export function sum(values: number[]): number {
  return values.reduce((total, v) => total + (Number.isFinite(v) ? v : 0), 0);
}

const NEAR_BUDGET_THRESHOLD = 80; // % of budget spent

/** Classifies a project's spend against its budget for the health badge. */
export function getBudgetHealth(budgetUsedPercentage: number): BudgetHealth {
  if (budgetUsedPercentage > 100) return "over-budget";
  if (budgetUsedPercentage >= NEAR_BUDGET_THRESHOLD) return "near-budget";
  return "on-track";
}

/**
 * Builds the full financial summary for a project given its raw expense
 * amounts, attendance salary amounts, client payment amounts, and salary
 * payout amounts. This is the single source of truth for the profit formula
 * used across the dashboard, project list, and summary API.
 *
 * Several distinct concepts are surfaced on purpose, rather than collapsed
 * into one "profit" number:
 * - `profit` (budget - spent): the cost-accounting view, assuming the full
 *   contracted budget will eventually be collected from the client, and
 *   that all earned salary counts as a real cost whether or not it has
 *   actually been paid out yet.
 * - `cashPosition` (received - spent): the real cash-in-hand view today,
 *   which is what actually matters for day-to-day decisions early in a
 *   project when collections lag spending.
 * - `pendingSalary` (earned - paid): what is still owed to workers — this
 *   does NOT change `profit` or `cashPosition` (earned salary is already
 *   counted as spent the moment it's earned), it's purely a payroll
 *   liability figure so a contractor can see who still needs to be paid.
 */
export function buildProjectSummary(
  budget: number,
  expenseAmounts: number[],
  salaryAmounts: number[],
  paymentAmounts: number[] = [],
  salaryPaidAmounts: number[] = []
): ProjectSummary {
  const totalExpenses = sum(expenseAmounts);
  const totalSalary = sum(salaryAmounts);
  const totalSpent = totalExpenses + totalSalary;
  const remainingBudget = budget - totalSpent;
  const profit = budget - totalSpent;
  const profitPercentage = budget > 0 ? (profit / budget) * 100 : 0;

  const totalReceived = sum(paymentAmounts);
  const outstandingBalance = budget - totalReceived;
  const collectionPercentage = budget > 0 ? (totalReceived / budget) * 100 : 0;
  const cashPosition = totalReceived - totalSpent;

  const budgetUsedPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
  const budgetHealth = getBudgetHealth(budgetUsedPercentage);

  const totalSalaryPaid = sum(salaryPaidAmounts);
  const pendingSalary = Math.max(totalSalary - totalSalaryPaid, 0);

  return {
    budget,
    totalExpenses,
    totalSalary,
    totalSpent,
    remainingBudget,
    profit,
    profitPercentage,
    totalReceived,
    outstandingBalance,
    collectionPercentage,
    cashPosition,
    budgetUsedPercentage,
    budgetHealth,
    totalSalaryPaid,
    pendingSalary,
  };
}

/** Per-employee earned / paid / pending salary breakdown. */
export function buildEmployeeSalarySummary(earnedAmounts: number[], paidAmounts: number[]) {
  const totalEarned = sum(earnedAmounts);
  const totalPaid = sum(paidAmounts);
  return {
    totalEarned,
    totalPaid,
    pending: Math.max(totalEarned - totalPaid, 0),
  };
}

/** Formats a number as Indian Rupees, e.g. ₹10,00,000 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function formatPercentage(value: number): string {
  return `${(value || 0).toFixed(1)}%`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}
