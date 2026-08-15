import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Employee from "@/models/Employee";
import Attendance from "@/models/Attendance";
import SalaryPayment from "@/models/SalaryPayment";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/employees/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid employee id" }, { status: 400 });
    }

    const body = await req.json();
    const { name, phone, role, dailySalary, joiningDate } = body;

    if (dailySalary !== undefined && Number(dailySalary) <= 0) {
      return NextResponse.json(
        { success: false, error: "Daily salary must be greater than 0" },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {};
    if (name !== undefined) update.name = name.trim();
    if (phone !== undefined) update.phone = phone?.trim();
    if (role !== undefined) update.role = role.trim();
    if (dailySalary !== undefined) update.dailySalary = Number(dailySalary);
    if (joiningDate !== undefined) update.joiningDate = new Date(joiningDate);

    const employee = await Employee.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    console.error("PUT employee error:", error);
    return NextResponse.json({ success: false, error: "Failed to update employee" }, { status: 500 });
  }
}

// DELETE /api/employees/:id - also removes their attendance and salary payment history
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid employee id" }, { status: 400 });
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    await Promise.all([
      Attendance.deleteMany({ employeeId: id }),
      SalaryPayment.deleteMany({ employeeId: id }),
      Employee.findByIdAndDelete(id),
    ]);

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE employee error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete employee" }, { status: 500 });
  }
}
