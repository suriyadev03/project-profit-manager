import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import SalaryPayment, { SALARY_PAYMENT_METHODS, SalaryPaymentDocument } from "@/models/SalaryPayment";
import Employee, { EmployeeDocument } from "@/models/Employee";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/employees/:employeeId/salary-payments - payout history for one employee
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid employee id" }, { status: 400 });
    }

    const payments = await SalaryPayment.find({ employeeId: id })
      .sort({ date: -1 })
      .lean<SalaryPaymentDocument[]>();

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("GET salary payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch salary payments" }, { status: 500 });
  }
}

// POST /api/employees/:employeeId/salary-payments - record a payout to this employee
export async function POST(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid employee id" }, { status: 400 });
    }

    const employee = await Employee.findById(id).lean<EmployeeDocument | null>();
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }

    const body = await req.json();
    const { date, amount, method, notes } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Payment date is required" }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (!SALARY_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    const payment = await SalaryPayment.create({
      projectId: employee.projectId,
      employeeId: id,
      date: new Date(date),
      amount: Number(amount),
      method,
      notes: notes?.trim(),
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("POST salary payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to record salary payment" }, { status: 500 });
  }
}
