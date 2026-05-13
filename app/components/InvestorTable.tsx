"use client";

import { useState } from "react";
import {
  Investor,
  InvestorStatus,
  INVESTOR_STATUS_LABELS,
  INVESTOR_STATUS_COLORS,
} from "../lib/types";
import { deleteInvestor, updateInvestor } from "../lib/actions";
import {
  Mail,
  MoreHorizontal,
  Trash2,
  Edit3,
  ExternalLink,
  Search,
  Filter,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Props {
  investors: Investor[];
  onRefresh: () => void;
}

const STATUS_OPTIONS: InvestorStatus[] = [
  "not_contacted",
  "first_email_sent",
  "followup_scheduled",
  "replied",
  "interested",
  "rejected",
];

export default function InvestorTable({ investors, onRefresh }: Props) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<InvestorStatus | "all">("all");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  const filtered = investors.filter((inv) => {
    const matchSearch =
      inv.name.toLowerCase().includes(search.toLowerCase()) ||
      inv.firm.toLowerCase().includes(search.toLowerCase()) ||
      inv.email.toLowerCase().includes(search.toLowerCase()) ||
      inv.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string) => {
    if (confirm("Delete this investor and all associated emails?")) {
      await deleteInvestor(id);
      onRefresh();
    }
  };

  const handleStatusChange = async (id: string, status: InvestorStatus) => {
    await updateInvestor(id, { status });
    setEditingStatus(null);
    onRefresh();
  };

  return (
    <div className="animate-fade-in">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by name, firm, email, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <select
            className="input pl-10 w-full sm:w-[200px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as InvestorStatus | "all")}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {INVESTOR_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <Users size={48} />
          <p className="text-lg font-semibold mt-2">No investors found</p>
          <p className="text-sm mt-1">Add investors or adjust your filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--border)" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Investor</th>
                <th>Firm</th>
                <th>Stage</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Last Contact</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <div>
                      <p className="font-semibold" style={{ color: "var(--foreground)" }}>
                        {inv.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {inv.email}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: "var(--foreground)" }}>{inv.firm}</span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      {inv.stage}
                    </span>
                  </td>
                  <td>
                    {editingStatus === inv.id ? (
                      <select
                        className="input text-xs py-1 px-2"
                        style={{ width: "160px" }}
                        value={inv.status}
                        onChange={(e) =>
                          handleStatusChange(inv.id, e.target.value as InvestorStatus)
                        }
                        onBlur={() => setEditingStatus(null)}
                        autoFocus
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {INVESTOR_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingStatus(inv.id)}
                        className={`badge ${INVESTOR_STATUS_COLORS[inv.status]}`}
                        title="Click to change status"
                      >
                        {INVESTOR_STATUS_LABELS[inv.status]}
                      </button>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {inv.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: "var(--glow-color)",
                            color: "var(--accent)",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>
                      {inv.lastContactedAt
                        ? new Date(inv.lastContactedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1 relative">
                      <Link
                        href={`/compose?investorId=${inv.id}`}
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                        title="Compose email"
                      >
                        <Mail size={15} style={{ color: "var(--muted)" }} />
                      </Link>
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === inv.id ? null : inv.id)
                        }
                        className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        <MoreHorizontal size={15} style={{ color: "var(--muted)" }} />
                      </button>
                      {menuOpen === inv.id && (
                        <div
                          className="absolute right-0 top-10 w-40 rounded-xl py-2 z-20"
                          style={{
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
                          }}
                        >
                          <button
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors"
                            style={{ color: "var(--foreground)" }}
                            onClick={() => {
                              setMenuOpen(null);
                              // Edit functionality handled via modal in parent
                            }}
                          >
                            <Edit3 size={14} /> Edit
                          </button>
                          <button
                            className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-white/5 transition-colors"
                            style={{ color: "#f87171" }}
                            onClick={() => {
                              setMenuOpen(null);
                              handleDelete(inv.id);
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
        Showing {filtered.length} of {investors.length} investors
      </p>
    </div>
  );
}

