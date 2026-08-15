export type SalaryPaymentMethod = "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Other";

export interface ISalaryPayment {
  _id: string;
  projectId: string;
  employeeId: string;
  date: string;
  amount: number;
  method: SalaryPaymentMethod;
  notes?: string;
  createdAt: string;
}
