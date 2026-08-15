export type PaymentReceivedMethod = "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Card" | "Other";

export interface IPayment {
  _id: string;
  projectId: string;
  date: string;
  amount: number;
  method: PaymentReceivedMethod;
  reference?: string;
  notes?: string;
  createdAt: string;
}
