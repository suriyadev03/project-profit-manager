import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import Payment, { PAYMENT_RECEIVED_METHODS, PaymentDocument } from "@/models/Payment";
import Project, { ProjectDocument } from "@/models/Project";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/projects/:projectId/payments - list payments received for a project (optional date range filter)
export async function GET(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, error: "Invalid project id" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const query: Record<string, unknown> = { projectId: id };
    if (from || to) {
      const dateFilter: Record<string, Date> = {};
      if (from) dateFilter.$gte = new Date(from);
      if (to) dateFilter.$lte = new Date(to);
      query.date = dateFilter;
    }

    const payments = await Payment.find(query).sort({ date: -1 }).lean<PaymentDocument[]>();

    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("GET payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/projects/:projectId/payments - record a payment received from the client
export async function POST(req: NextRequest, { params }: Params) {
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

    const body = await req.json();
    const { date, amount, method, reference, notes } = body;

    if (!date) {
      return NextResponse.json({ success: false, error: "Payment date is required" }, { status: 400 });
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: "Amount must be greater than 0" }, { status: 400 });
    }
    if (!PAYMENT_RECEIVED_METHODS.includes(method)) {
      return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    const payment = await Payment.create({
      projectId: id,
      date: new Date(date),
      amount: Number(amount),
      method,
      reference: reference?.trim(),
      notes: notes?.trim(),
    });

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    console.error("POST payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to record payment" }, { status: 500 });
  }
}
