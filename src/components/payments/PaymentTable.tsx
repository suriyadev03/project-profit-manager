"use client";

import { IPayment } from "@/types/payment";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { Pencil, Trash2 } from "lucide-react";

interface PaymentTableProps {
  payments: IPayment[];
  onEdit: (payment: IPayment) => void;
  onDelete: (payment: IPayment) => void;
}

export default function PaymentTable({ payments, onEdit, onDelete }: PaymentTableProps) {
  return (
    <>
      {/* Mobile: stacked cards */}
      <div className="space-y-3 sm:hidden">
        {payments.map((payment) => (
          <div key={payment._id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-green-700">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-gray-400">{formatDate(payment.date)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => onEdit(payment)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(payment)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {payment.method}
              </span>
              {payment.reference && <span className="text-xs text-gray-500">Ref: {payment.reference}</span>}
            </div>
            {payment.notes && <p className="mt-2 text-xs text-gray-500">{payment.notes}</p>}
          </div>
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Reference</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Notes</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{formatDate(payment.date)}</td>
                <td className="px-4 py-3 text-right font-medium text-green-700">{formatCurrency(payment.amount)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {payment.method}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{payment.reference || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{payment.notes || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(payment)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(payment)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
