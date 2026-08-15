import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Project, { ProjectDocument } from "@/models/Project";
import Expense, { ExpenseDocument } from "@/models/Expense";
import Attendance, { AttendanceDocument } from "@/models/Attendance";
import Payment, { PaymentDocument } from "@/models/Payment";
import SalaryPayment, { SalaryPaymentDocument } from "@/models/SalaryPayment";
import { buildProjectSummary } from "@/lib/calculations";

// GET /api/projects - list all projects, each with a computed financial summary
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query).lean<ProjectDocument[]>();

    // Compute financial summary for every project in parallel
    const projectsWithSummary = await Promise.all(
      projects.map(async (project) => {
        const [expenses, attendance, payments, salaryPayments] = await Promise.all([
          Expense.find({ projectId: project._id }).lean<ExpenseDocument[]>(),
          Attendance.find({ projectId: project._id }).lean<AttendanceDocument[]>(),
          Payment.find({ projectId: project._id }).lean<PaymentDocument[]>(),
          SalaryPayment.find({ projectId: project._id }).lean<SalaryPaymentDocument[]>(),
        ]);

        const summary = buildProjectSummary(
          project.budget,
          expenses.map((e) => e.amount),
          attendance.map((a) => a.salary),
          payments.map((p) => p.amount),
          salaryPayments.map((p) => p.amount)
        );

        return { ...project, summary };
      })
    );

    // Sorting on computed or raw fields
    projectsWithSummary.sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      if (sortBy === "budget") {
        aVal = a.budget;
        bVal = b.budget;
      } else if (sortBy === "profit") {
        aVal = a.summary.profit;
        bVal = b.summary.profit;
      } else {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      }

      if (aVal < bVal) return sortOrder === 1 ? -1 : 1;
      if (aVal > bVal) return sortOrder === 1 ? 1 : -1;
      return 0;
    });

    return NextResponse.json({ success: true, data: projectsWithSummary });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - create a new project
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { name, budget, startDate, endDate, description, status } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required" },
        { status: 400 }
      );
    }
    if (!budget || Number(budget) <= 0) {
      return NextResponse.json(
        { success: false, error: "Project budget must be greater than 0" },
        { status: 400 }
      );
    }
    if (!startDate) {
      return NextResponse.json(
        { success: false, error: "Start date is required" },
        { status: 400 }
      );
    }

    const project = await Project.create({
      name: name.trim(),
      budget: Number(budget),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      description: description?.trim(),
      status: status || "Active",
    });

    return NextResponse.json({ success: true, data: project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create project" },
      { status: 500 }
    );
  }
}
