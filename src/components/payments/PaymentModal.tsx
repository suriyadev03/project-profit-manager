"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { IPayment } from "@/types/payment";

const METHODS = ["Cash", "Bank Transfer", "UPI", "Cheque", "Card", "Other"];

interface PaymentModalProps {
  projectId: string;
  editingPayment?: IPayment | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function PaymentModal({ projectId, editingPayment, onClose, onSaved }: PaymentModalProps) {
  const [form, setForm] = useState({
    date: editingPayment?.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    amount: editingPayment?.amount?.toString() ?? "",
    method: editingPayment?.method ?? "Bank Transfer",
    reference: editingPayment?.reference ?? "",
    notes: editingPayment?.notes ?? "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.amount || Number(form.amount) <= 0) return setError("Amount must be greater than 0");

    setSubmitting(true);
    try {
      const url = editingPayment
        ? `/api/payments/${editingPayment._id}`
        : `/api/projects/${projectId}/payments`;
      const method = editingPayment ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Something went wrong");
        return;
      }

      toast.success(editingPayment ? "Payment updated" : "Payment recorded");
      onSaved();
      onClose();
    } catch {
      setError("Failed to reach the server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editingPayment ? "Edit Payment" : "Record Payment Received"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Payment Date</label>
            <input
              type="date"
              className="input-field"
              value={form.date}
              onChange={(e) => handleChange("date", e.target.value)}
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
              onChange={(e) => handleChange("amount", e.target.value)}
              placeholder="50000"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Payment Method</label>
            <select className="input-field" value={form.method} onChange={(e) => handleChange("method", e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-field">Reference No. (optional)</label>
            <input
              className="input-field"
              value={form.reference}
              onChange={(e) => handleChange("reference", e.target.value)}
              placeholder="Cheque / UTR / txn no."
            />
          </div>
        </div>

        <div>
          <label className="label-field">Notes (optional)</label>
          <textarea
            className="input-field"
            rows={2}
            value={form.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingPayment ? "Save Changes" : "Record Payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
