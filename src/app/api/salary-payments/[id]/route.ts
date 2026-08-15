import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import SalaryPayment, { SALARY_PAYMENT_METHODS } from "@/models/SalaryPayment";

interface Params {
  params: Promise<{ id: string }>;
}

// PUT /api/salary-payments/:id - update a salary payout
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid payment id" }, { status: 400 });
    }

    const body = await req.json();
    const { date, amount, method, notes } = body;

    if (method !== undefined && !SALARY_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }
    if (amount !== undefined && Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (date !== undefined) update.date = new Date(date);
    if (amount !== undefined) update.amount = Number(amount);
    if (method !== undefined) update.method = method;
    if (notes !== undefined) update.notes = notes?.trim();

    const payment = await SalaryPayment.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!payment) {
      return NextResponse.json({ success: false, error: "Salary payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error("PUT salary payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to update salary payment" }, { status: 500 });
  }
}

// DELETE /api/salary-payments/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid payment id" }, { status: 400 });
    }

    const payment = await SalaryPayment.findByIdAndDelete(id);
    if (!payment) {
      return NextResponse.json({ success: false, error: "Salary payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("DELETE salary payment error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete salary payment" }, { status: 500 });
  }
}
