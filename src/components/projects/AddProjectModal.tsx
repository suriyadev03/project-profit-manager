"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { IProject } from "@/types/project";

interface AddProjectModalProps {
  onClose: () => void;
  onCreated: (project: IProject) => void;
  editingProject?: IProject | null;
}

export default function AddProjectModal({ onClose, onCreated, editingProject }: AddProjectModalProps) {
  const [form, setForm] = useState({
    name: editingProject?.name ?? "",
    budget: editingProject?.budget?.toString() ?? "",
    startDate: editingProject?.startDate?.slice(0, 10) ?? "",
    endDate: editingProject?.endDate?.slice(0, 10) ?? "",
    description: editingProject?.description ?? "",
    status: editingProject?.status ?? "Active",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) return setError("Project name is required");
    if (!form.budget || Number(form.budget) <= 0) return setError("Budget must be greater than 0");
    if (!form.startDate) return setError("Start date is required");

    setSubmitting(true);
    try {
      const url = editingProject ? `/api/projects/${editingProject._id}` : "/api/projects";
      const method = editingProject ? "PUT" : "POST";

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

      toast.success(editingProject ? "Project updated" : "Project created");
      onCreated(json.data);
      onClose();
    } catch {
      setError("Failed to reach the server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={editingProject ? "Edit Project" : "Add Project"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div>
          <label className="label-field">Project Name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. House Construction"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Project Budget (₹)</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={form.budget}
              onChange={(e) => handleChange("budget", e.target.value)}
              placeholder="1000000"
            />
          </div>
          <div>
            <label className="label-field">Status</label>
            <select
              className="input-field"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-field">Start Date</label>
            <input
              type="date"
              className="input-field"
              value={form.startDate}
              onChange={(e) => handleChange("startDate", e.target.value)}
            />
          </div>
          <div>
            <label className="label-field">End Date (optional)</label>
            <input
              type="date"
              className="input-field"
              value={form.endDate}
              onChange={(e) => handleChange("endDate", e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="label-field">Description (optional)</label>
          <textarea
            className="input-field"
            rows={3}
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving..." : editingProject ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
