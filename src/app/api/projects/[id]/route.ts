import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Project, { ProjectDocument } from "@/models/Project";
import Expense from "@/models/Expense";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import Payment from "@/models/Payment";
import SalaryPayment from "@/models/SalaryPayment";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/projects/:id - fetch a single project
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: "Invalid project id" }, { status: 400 });
    }

    const project = await Project.findById(id).lean<ProjectDocument | null>();
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("GET /api/projects/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT /api/projects/:id - update a project
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: "Invalid project id" }, { status: 400 });
    }

    const body = await req.json();
    const { name, budget, startDate, endDate, description, status } = body;

    if (budget !== undefined && Number(budget) <= 0) {
      return NextResponse.json(
        { success: false, error: "Project budget must be greater than 0" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name.trim();
    if (budget !== undefined) update.budget = Number(budget);
    if (startDate !== undefined) update.startDate = new Date(startDate);
    if (endDate !== undefined) update.endDate = endDate ? new Date(endDate) : undefined;
    if (description !== undefined) update.description = description?.trim();
    if (status !== undefined) update.status = status;

    const project = await Project.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    console.error("PUT /api/projects/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/:id - delete a project and all related records
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!isValidId(id)) {
      return NextResponse.json({ success: false, error: "Invalid project id" }, { status: 400 });
    }

    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    // Cascade delete all related records to keep the database consistent
    await Promise.all([
      Expense.deleteMany({ projectId: id }),
      Employee.deleteMany({ projectId: id }),
      Attendance.deleteMany({ projectId: id }),
      Payment.deleteMany({ projectId: id }),
      SalaryPayment.deleteMany({ projectId: id }),
      Project.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE /api/projects/:id error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete project" }, { status: 500 });
  }
}
