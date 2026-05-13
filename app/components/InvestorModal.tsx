"use client";

import { useState } from "react";
import { Investor, InvestorStatus } from "../lib/types";
import { saveInvestor, updateInvestor } from "../lib/actions";
import { X, UserPlus, Save } from "lucide-react";

interface Props {
  investor?: Investor;
  onClose: () => void;
  onSaved: () => void;
}

export default function InvestorModal({ investor, onClose, onSaved }: Props) {
  const isEdit = !!investor;
  const [form, setForm] = useState({
    name: investor?.name ?? "",
    email: investor?.email ?? "",
    firm: investor?.firm ?? "",
    stage: investor?.stage ?? "Pre-Seed",
    notes: investor?.notes ?? "",
    tags: investor?.tags.join(", ") ?? "",
    status: investor?.status ?? ("not_contacted" as InvestorStatus),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      email: form.email.trim(),
      firm: form.firm.trim(),
      stage: form.stage,
      notes: form.notes.trim(),
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status: form.status as InvestorStatus,
      lastContactedAt: investor?.lastContactedAt ?? null,
    };

    if (isEdit && investor) {
      await updateInvestor(investor.id, data);
    } else {
      await saveInvestor(data);
    }

    onSaved();
    onClose();
  };

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(99, 102, 241, 0.15)" }}
            >
              <UserPlus size={18} style={{ color: "#6366f1" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              {isEdit ? "Edit Investor" : "Add Investor"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={18} style={{ color: "var(--muted)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Name *</label>
              <input
                className="input"
                placeholder="Kunal Shah"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email *</label>
              <input
                className="input"
                type="email"
                placeholder="kunal@cred.club"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Firm / Company</label>
              <input
                className="input"
                placeholder="CRED / Angel"
                value={form.firm}
                onChange={(e) => update("firm", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Stage</label>
              <select
                className="input"
                value={form.stage}
                onChange={(e) => update("stage", e.target.value)}
              >
                <option value="Pre-Seed">Pre-Seed</option>
                <option value="Seed">Seed</option>
                <option value="Series A">Series A</option>
                <option value="Bridge">Bridge</option>
                <option value="Angel">Angel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Tags (comma-separated)</label>
            <input
              className="input"
              placeholder="fintech, consumer, angel"
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              placeholder="Investor thesis, recent investments, mutual connections..."
              rows={3}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="not_contacted">Not Contacted</option>
                <option value="first_email_sent">First Email Sent</option>
                <option value="followup_scheduled">Follow-up Scheduled</option>
                <option value="replied">Replied</option>
                <option value="interested">Interested</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              {isEdit ? "Update" : "Add Investor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
