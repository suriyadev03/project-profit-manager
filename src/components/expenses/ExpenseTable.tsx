"use client";

import { IExpense } from "@/types/expense";
import { formatCurrency, formatDate } from "@/lib/calculations";
import { Pencil, Trash2 } from "lucide-react";

interface ExpenseTableProps {
  expenses: IExpense[];
  onEdit: (expense: IExpense) => void;
  onDelete: (expense: IExpense) => void;
}

export default function ExpenseTable({ expenses, onEdit, onDelete }: ExpenseTableProps) {
  return (
    <>
      {/* Mobile: stacked cards — a wide table is a poor fit on small screens */}
      <div className="space-y-3 sm:hidden">
        {expenses.map((expense) => (
          <div key={expense._id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{expense.description}</p>
                <p className="text-xs text-gray-400">{formatDate(expense.date)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => onEdit(expense)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(expense)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                {expense.category}
              </span>
              <span className="font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">Paid via {expense.paymentMethod}</p>
          </div>
        ))}
      </div>

      {/* Desktop / tablet: full table */}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm sm:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Description</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Payment Method</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((expense) => (
              <tr key={expense._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-700">{formatDate(expense.date)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {expense.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{expense.description}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(expense.amount)}</td>
                <td className="px-4 py-3 text-gray-700">{expense.paymentMethod}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => onEdit(expense)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(expense)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
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
