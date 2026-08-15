export type ProjectStatus = "Active" | "Completed" | "On Hold";

export interface IProject {
  _id: string;
  name: string;
  budget: number;
  startDate: string;
  endDate?: string;
  description?: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

/** Where a project stands against its budget, used to drive the health badge. */
export type BudgetHealth = "on-track" | "near-budget" | "over-budget";

export interface ProjectSummary {
  budget: number;
  totalExpenses: number;
  totalSalary: number;
  totalSpent: number;
  remainingBudget: number;
  profit: number;
  profitPercentage: number;
  /** Total amount the client has actually paid so far. */
  totalReceived: number;
  /** Budget - totalReceived: what the client still owes. Negative means overpaid. */
  outstandingBalance: number;
  /** totalReceived / budget * 100 */
  collectionPercentage: number;
  /** totalReceived - totalSpent: real cash position today (can differ a lot from `profit`,
   *  which assumes the full budget will eventually be collected). */
  cashPosition: number;
  /** totalSpent / budget * 100 — drives the on-track / near-budget / over-budget badge. */
  budgetUsedPercentage: number;
  budgetHealth: BudgetHealth;
  /** Total actually paid out to employees so far (subset of totalSalary, which is accrued/earned). */
  totalSalaryPaid: number;
  /** totalSalary - totalSalaryPaid: wages earned but not yet paid out. Does not affect profit/cashPosition. */
  pendingSalary: number;
}

export interface ProjectWithSummary extends IProject {
  summary: ProjectSummary;
}
