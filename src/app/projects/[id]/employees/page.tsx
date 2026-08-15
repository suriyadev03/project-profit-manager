"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Plus, Users, Pencil, Trash2, Phone, Wallet } from "lucide-react";
import EmployeeModal from "@/components/employees/EmployeeModal";
import SalaryHistoryModal from "@/components/employees/SalaryHistoryModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import SummaryCard from "@/components/dashboard/SummaryCard";
import FAB from "@/components/ui/FAB";
import { IEmployeeWithSalary } from "@/types/employee";
import { formatCurrency, formatDate, sum } from "@/lib/calculations";
import toast from "react-hot-toast";

export default function EmployeesPage() {
  const params = useParams();
  const projectId = params?.id as string;

  const [employees, setEmployees] = useState<IEmployeeWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployeeWithSalary | null>(null);
  const [salaryEmployee, setSalaryEmployee] = useState<IEmployeeWithSalary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IEmployeeWithSalary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/employees`);
    const json = await res.json();
    if (json.success) setEmployees(json.data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    if (projectId) fetchEmployees();
  }, [projectId, fetchEmployees]);

  // Keep the open salary-history modal's numbers fresh after a payment is recorded
  useEffect(() => {
    if (!salaryEmployee) return;
    const updated = employees.find((e) => e._id === salaryEmployee._id);
    if (updated) setSalaryEmployee(updated);
  }, [employees, salaryEmployee]);

  const totalPending = useMemo(() => sum(employees.map((e) => e.salary.pending)), [employees]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employees/${deleteTarget._id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Employee removed");
        setDeleteTarget(null);
        fetchEmployees();
      } else {
        toast.error(json.error || "Failed to delete");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Employees</h2>
          <p className="text-sm text-gray-500">Workers assigned to this project.</p>
        </div>
        <button
          className="btn-primary hidden sm:inline-flex"
          onClick={() => {
            setEditingEmployee(null);
            setShowModal(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {!loading && employees.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:w-64">
          <SummaryCard label="Employees" value={String(employees.length)} icon={Users} />
          <SummaryCard
            label="Salary Pending"
            value={formatCurrency(totalPending)}
            icon={Wallet}
            tone={totalPending > 0 ? "negative" : "default"}
          />
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <LoadingSpinner label="Loading employees..." />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees added"
            description="Add workers to this project to start recording attendance and salary."
            action={
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <div key={emp._id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.role}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditingEmployee(emp);
                        setShowModal(true);
                      }}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(emp)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{formatCurrency(emp.dailySalary)} / day</p>
                  {emp.phone && (
                    <p className="flex items-center gap-1.5 text-gray-500">
                      <Phone className="h-3.5 w-3.5" /> {emp.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">Joined {formatDate(emp.joiningDate)}</p>
                </div>

                <button
                  onClick={() => setSalaryEmployee(emp)}
                  className="mt-3 w-full rounded-lg border border-gray-200 p-2.5 text-left transition hover:border-brand-300 hover:bg-brand-50"
                >
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-gray-500">Earned</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(emp.salary.totalEarned)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Paid</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(emp.salary.totalPaid)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pending</p>
                      <p className={`font-semibold ${emp.salary.pending > 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(emp.salary.pending)}
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <EmployeeModal
          projectId={projectId}
          editingEmployee={editingEmployee}
          onClose={() => setShowModal(false)}
          onSaved={fetchEmployees}
        />
      )}

      {salaryEmployee && (
        <SalaryHistoryModal
          employee={salaryEmployee}
          onClose={() => setSalaryEmployee(null)}
          onChanged={fetchEmployees}
        />
      )}

      <ConfirmDeleteModal
        open={!!deleteTarget}
        message={`Remove "${deleteTarget?.name}" from this project? Their attendance and salary payment history will also be deleted.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <FAB
        label="Add Employee"
        onClick={() => {
          setEditingEmployee(null);
          setShowModal(true);
        }}
      />
    </div>
  );
}
