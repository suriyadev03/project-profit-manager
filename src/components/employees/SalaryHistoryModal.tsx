"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { IEmployeeWithSalary } from "@/types/employee";
import { ISalaryPayment } from "@/types/salaryPayment";
import { formatCurrency, formatDate } from "@/lib/calculations";

const METHODS = ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"];

interface SalaryHistoryModalProps {
  employee: IEmployeeWithSalary;
  onClose: () => void;
  onChanged: () => void;
}

export default function SalaryHistoryModal({ employee, onClose, onChanged }: SalaryHistoryModalProps) {
  const [payments, setPayments] = useState<ISalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ISalaryPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ISalaryPayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    method: "Cash",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/employees/${employee._id}/salary-payments`);
    const json = await res.json();
    if (json.success) setPayments(json.data);
    setLoading(false);
  }, [employee._id]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const resetForm = () => {
    setForm({ date: new Date().toISOString().slice(0, 10), amount: "", method: "Cash", notes: "" });
    setEditingPayment(null);
    setShowForm(false);
    setFormError("");
  };

  const startEdit = (payment: ISalaryPayment) => {
    setEditingPayment(payment);
    setForm({
      date: payment.date.slice(0, 10),
      amount: payment.amount.toString(),
      method: payment.method,
      notes: payment.notes ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.amount || Number(form.amount) <= 0) return setFormError("Amount must be greater than 0");

    setSubmitting(true);
    try {
      const url = editingPayment
        ? `/api/salary-payments/${editingPayment._id}`
        : `/api/employees/${employee._id}/salary-payments`;
      const method = editingPayment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Something went wrong");
        return;
      }

      toast.success(editingPayment ? "Payment updated" : "Salary payment recorded");
      resetForm();
      fetchPayments();
      onChanged();
    } catch {
      setFormError("Failed to reach the server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/salary-payments/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment removed");
        setDeleteTarget(null);
        fetchPayments();
        onChanged();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  const { totalEarned, totalPaid, pending } = employee.salary;

  return (
    <Modal title={`Salary — ${employee.name}`} onClose={onClose} maxWidth="max-w-xl">
      <div className="grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 text-center">
        <div>
          <p className="text-xs text-gray-500">Earned</p>
          <p className="font-semibold text-gray-900">{formatCurrency(totalEarned)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Paid</p>
          <p className="font-semibold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Pending</p>
          <p className={`font-semibold ${pending > 0 ? "text-red-600" : "text-green-600"}`}>
            {formatCurrency(pending)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">Payment History</h4>
        {!showForm && (
          <button
            className="btn-secondary px-3 py-1.5 text-xs"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> Record Payment
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-lg border border-gray-200 p-3">
          {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label-field">Date</label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
            </div>
            <div>
              <label className="label-field">Amount (₹)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input-field"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="5000"
              />
            </div>
          </div>
          <div>
            <label className="label-field">Method</label>
            <select
              className="input-field"
              value={form.method}
              onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Notes (optional)</label>
            <input
              className="input-field"
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : editingPayment ? "Save Changes" : "Record Payment"}
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 max-h-64 overflow-y-auto">
        {loading ? (
          <LoadingSpinner label="Loading history..." />
        ) : payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No salary payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <div key={payment._id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(payment.date)} · {payment.method}
                    {payment.notes ? ` · ${payment.notes}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(payment)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(payment)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteModal
        open={!!deleteTarget}
        message="Delete this salary payment? This action cannot be undone."
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </Modal>
  );
}
