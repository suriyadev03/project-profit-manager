import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Project, { ProjectDocument } from "@/models/Project";
import Expense, { ExpenseDocument } from "@/models/Expense";
import Attendance, { AttendanceDocument } from "@/models/Attendance";
import Payment, { PaymentDocument } from "@/models/Payment";
import SalaryPayment, { SalaryPaymentDocument } from "@/models/SalaryPayment";
import { buildProjectSummary } from "@/lib/calculations";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:projectId/summary
// Returns the full financial summary plus data pre-shaped for the dashboard charts:
// - expense vs salary totals
// - daily spending (expenses + salary combined, grouped by day)
// - expense breakdown by category
// - budget usage (used vs remaining)
// - cumulative cash flow (money in vs money out over time)
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid project id" }, { status: 400 });
    }

    const project = await Project.findById(id).lean<ProjectDocument | null>();
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    const [expenses, attendance, payments, salaryPayments] = await Promise.all([
      Expense.find({ projectId: id }).lean<ExpenseDocument[]>(),
      Attendance.find({ projectId: id }).lean<AttendanceDocument[]>(),
      Payment.find({ projectId: id }).lean<PaymentDocument[]>(),
      SalaryPayment.find({ projectId: id }).lean<SalaryPaymentDocument[]>(),
    ]);

    const summary = buildProjectSummary(
      project.budget,
      expenses.map((e) => e.amount),
      attendance.map((a) => a.salary),
      payments.map((p) => p.amount),
      salaryPayments.map((p) => p.amount)
    );

    // Expense category breakdown
    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    }
    const expenseByCategory = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
    }));

    // Daily spending: combine expenses + attendance salary by calendar day
    const dailyMap = new Map<string, { expenses: number; salary: number; received: number }>();
    for (const e of expenses) {
      const key = new Date(e.date).toISOString().slice(0, 10);
      const entry = dailyMap.get(key) || { expenses: 0, salary: 0, received: 0 };
      entry.expenses += e.amount;
      dailyMap.set(key, entry);
    }
    for (const a of attendance) {
      const key = new Date(a.date).toISOString().slice(0, 10);
      const entry = dailyMap.get(key) || { expenses: 0, salary: 0, received: 0 };
      entry.salary += a.salary;
      dailyMap.set(key, entry);
    }
    for (const p of payments) {
      const key = new Date(p.date).toISOString().slice(0, 10);
      const entry = dailyMap.get(key) || { expenses: 0, salary: 0, received: 0 };
      entry.received += p.amount;
      dailyMap.set(key, entry);
    }
    const dailyRows = Array.from(dailyMap.entries())
      .map(([date, v]) => ({
        date,
        expenses: v.expenses,
        salary: v.salary,
        total: v.expenses + v.salary,
        received: v.received,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Cumulative cash flow: running total spent vs running total received, by day
    let runningSpent = 0;
    let runningReceived = 0;
    const cashFlow = dailyRows.map((row) => {
      runningSpent += row.total;
      runningReceived += row.received;
      return {
        date: row.date,
        spent: runningSpent,
        received: runningReceived,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        project,
        summary,
        charts: {
          expenseVsSalary: [
            { name: "Expenses", value: summary.totalExpenses },
            { name: "Employee Salary", value: summary.totalSalary },
          ],
          dailySpending: dailyRows,
          expenseByCategory,
          budgetUsage: [
            { name: "Used Budget", value: Math.min(summary.totalSpent, summary.budget) },
            { name: "Remaining Budget", value: Math.max(summary.remainingBudget, 0) },
          ],
          cashFlow,
        },
      },
    });
  } catch (error) {
    console.error("GET summary error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch summary" }, { status: 500 });
  }
}
