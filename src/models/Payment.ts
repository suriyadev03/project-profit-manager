import mongoose, { Schema, models, model } from "mongoose";

export interface PaymentDocument extends mongoose.Document {
  projectId: mongoose.Types.ObjectId;
  date: Date;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
}

// Client payments received against a project's budget. This is the revenue
// side of the ledger — Expense/Attendance track money going OUT, Payment
// tracks money coming IN from the client, so the app can show real cash
// position (received - spent) alongside the budget-based profit figure.
export const PAYMENT_RECEIVED_METHODS = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Other"] as const;

const PaymentSchema = new Schema<PaymentDocument>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true, min: [0.01, "Amount must be greater than 0"] },
    method: { type: String, enum: PAYMENT_RECEIVED_METHODS, required: true },
    reference: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PaymentSchema.index({ projectId: 1, date: -1 });

export default models.Payment || model<PaymentDocument>("Payment", PaymentSchema);
