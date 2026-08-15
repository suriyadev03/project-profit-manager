"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { IEmployee } from "@/types/employee";

interface EmployeeModalProps {
  projectId: string;
  editingEmployee?: IEmployee | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EmployeeModal({ projectId, editingEmployee, onClose, onSaved }: EmployeeModalProps) {
  const [form, setForm] = useState({
    name: editingEmployee?.name ?? "",
    phone: editingEmployee?.phone ?? "",
    role: editingEmployee?.role ?? "",
    dailySalary: editingEmployee?.dailySalary?.toString() ?? "",
    joiningDate: editingEmployee?.joiningDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Employee name is required");
    if (!form.role.trim()) return setError("Role is required");
    if (!form.dailySalary || Number(form.dailySalary) <= 0) return setError("Daily salary must be greater than 0");

    setSubmitting(true);
    try {
      const url = editingEmployee ? `/api/employees/${editingEmployee._id}` : `/api/projects/${projectId}/employees`;
      const method = editingEmployee ? "PUT" : "POST";

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

      toast.success(editingEmployee ? "Employee updated" : "Employee added");
      onSaved();
      onClose();
    } catch {
      setError("Failed to reach the server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editingEmployee ? "Edit Employee" : "Add Employee"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="label-field">Employee Name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Kumar"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Role</label>
            <input
              className="input-field"
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              placeholder="e.g. Carpenter"
            />
          </div>
          <div>
            <label className="label-field">Phone Number (optional)</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Daily Salary (₹)</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.dailySalary}
              onChange={(e) => handleChange("dailySalary", e.target.value)}
              placeholder="800"
            />
          </div>
          <div>
            <label className="label-field">Joining Date</label>
            <input
              type="date"
              className="input-field"
              value={form.joiningDate}
              onChange={(e) => handleChange("joiningDate", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingEmployee ? "Save Changes" : "Add Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
