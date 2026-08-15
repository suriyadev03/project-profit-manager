"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, IndianRupee, Download } from "lucide-react";
import PaymentTable from "@/components/payments/PaymentTable";
import PaymentModal from "@/components/payments/PaymentModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import FAB from "@/components/ui/FAB";
import { IPayment } from "@/types/payment";
import { formatDate } from "@/lib/calculations";
import { downloadCSV } from "@/lib/csv";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IPayment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IPayment | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/payments`);
    const json = await res.json();
    if (json.success) setPayments(json.data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchPayments();
  }, [projectId, fetchPayments]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/payments/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Payment removed");
        setDeleteTarget(null);
        fetchPayments();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    downloadCSV(
      `payments-${projectId}.csv`,
      payments.map((p) => ({
        Date: formatDate(p.date),
        Amount: p.amount,
        Method: p.method,
        Reference: p.reference || "",
        Notes: p.notes || "",
      }))
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Payments Received</h2>
          <p className="text-sm text-gray-500">Money collected from the client against this project&apos;s budget.</p>
        </div>
        <div className="flex gap-2">
          {payments.length > 0 && (
            <button className="btn-secondary" onClick={handleExport}>
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
          <button
            className="btn-primary hidden sm:inline-flex"
            onClick={() => {
              setEditingPayment(null);
              setShowModal(true);
            }}
          >
            <Plus className="h-4 w-4" /> Record Payment
          </button>
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner label="Loading payments..." />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={IndianRupee}
            title="No payments recorded"
            description="Record client payments as they come in to track real cash position against your spending."
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Record Payment
              </button>
            }
          />
        ) : (
          <PaymentTable
            payments={payments}
            onEdit={(payment) => {
              setEditingPayment(payment);
              setShowModal(true);
            }}
            onDelete={(payment) => setDeleteTarget(payment)}
          />
        )}
      </div>

      {showModal && (
        <PaymentModal
          projectId={projectId}
          editingPayment={editingPayment}
          onClose={() => setShowModal(false)}
          onSaved={fetchPayments}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        message={`Delete this payment of ${deleteTarget ? formatDate(deleteTarget.date) : ""}? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <FAB
        label="Record Payment"
        onClick={() => {
          setEditingPayment(null);
          setShowModal(true);
        }}
      />
    </div>
  );
}
