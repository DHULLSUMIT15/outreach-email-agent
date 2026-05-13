"use client";

import { Investor, INVESTOR_STATUS_LABELS, InvestorStatus } from "../lib/types";
import { UserCircle, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

interface Props {
  investors: Investor[];
}

const KANBAN_COLUMNS: { status: InvestorStatus; label: string; color: string; dotColor: string }[] = [
  { status: "not_contacted", label: "Not Contacted", color: "rgba(100, 116, 139, 0.15)", dotColor: "#64748b" },
  { status: "first_email_sent", label: "Email Sent", color: "rgba(59, 130, 246, 0.15)", dotColor: "#3b82f6" },
  { status: "followup_scheduled", label: "Follow-up", color: "rgba(245, 158, 11, 0.15)", dotColor: "#f59e0b" },
  { status: "replied", label: "Replied", color: "rgba(139, 92, 246, 0.15)", dotColor: "#8b5cf6" },
  { status: "interested", label: "Interested", color: "rgba(16, 185, 129, 0.15)", dotColor: "#10b981" },
  { status: "rejected", label: "Passed", color: "rgba(244, 63, 94, 0.15)", dotColor: "#f43f5e" },
];

export default function KanbanBoard({ investors }: Props) {
  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-full" style={{ minWidth: "max-content" }}>
      {KANBAN_COLUMNS.map((col) => {
        const items = investors.filter((inv) => inv.status === col.status);
        return (
          <div key={col.status} className="kanban-column flex-1" style={{ minWidth: "220px", maxWidth: "400px" }}>
            <div className="flex items-center gap-2 mb-3 px-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: col.dotColor }}
              />
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                {col.label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-auto"
                style={{ background: col.color, color: col.dotColor }}
              >
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[11px]" style={{ color: "var(--muted)" }}>No investors</p>
                </div>
              ) : (
                items.map((inv) => (
                  <div key={inv.id} className="kanban-card">
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle size={14} style={{ color: col.dotColor }} />
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {inv.name}
                      </span>
                    </div>
                    <p className="text-[11px] truncate" style={{ color: "var(--muted)" }}>
                      {inv.firm}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      {inv.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: "var(--glow-color)", color: "var(--accent)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/compose?investorId=${inv.id}`}
                      className="flex items-center gap-1 mt-3 text-[11px] font-medium transition-colors"
                      style={{ color: "var(--accent)" }}
                    >
                      <Mail size={11} /> Compose <ArrowRight size={10} />
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
