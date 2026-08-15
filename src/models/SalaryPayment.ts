import mongoose, { Schema, models, model } from "mongoose";

export interface SalaryPaymentDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  amount: number;
  method: string;
  notes?: string;
  createdAt: Date;
}

// Money actually paid OUT to an employee. Attendance.salary is what an
// employee has EARNED (accrued, based on Present/Half Day/Absent) — it does
// not mean they were paid. SalaryPayment is the payout side, so
// (earned - paid) gives the real pending/unpaid salary owed to that worker.
export const SALARY_PAYMENT_METHODS = ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"] as const;

const SalaryPaymentSchema = new Schema<SalaryPaymentDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    method: { type: String, enum: SALARY_PAYMENT_METHODS, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

SalaryPaymentSchema.index({ employeeId: 1, date: -1 });
SalaryPaymentSchema.index({ projectId: 1, date: -1 });

export default models.SalaryPayment || model<SalaryPaymentDocument>("SalaryPayment", SalaryPaymentSchema);
