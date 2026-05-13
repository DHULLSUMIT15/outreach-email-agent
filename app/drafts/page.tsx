"use client";

import { useEffect, useState } from "react";
import { FileText, Clock, Check, X as XIcon, Send, AlertTriangle, Search } from "lucide-react";
import { getEmails, seedDemoData } from "../lib/actions";
import { Email } from "../lib/types";
import ApprovalCard from "../components/ApprovalCard";

type FilterTab = "pending" | "approved" | "sent" | "rejected" | "all";

export default function DraftsPage() {
  const [emails, setEmails] = useState<(Email & { investor?: any })[]>([]);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");

  const refresh = async () => {
    const data = await getEmails();
    setEmails(data);
  };

  useEffect(() => {
    seedDemoData().then(refresh);
  }, []);

  const filtered = emails.filter((e) => {
    const matchTab =
      tab === "all" ? true :
      tab === "pending" ? e.status === "draft" :
      tab === "approved" ? e.status === "approved" :
      tab === "sent" ? e.status === "sent" :
      tab === "rejected" ? e.status === "rejected" : true;
    const matchSearch =
      !search ||
      e.subject.toLowerCase().includes(search.toLowerCase()) ||
      (e.investor?.name ?? "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const tabs: { key: FilterTab; label: string; icon: typeof FileText; count: number }[] = [
    { key: "pending", label: "Pending", icon: Clock, count: emails.filter((e) => e.status === "draft").length },
    { key: "approved", label: "Approved", icon: Check, count: emails.filter((e) => e.status === "approved").length },
    { key: "sent", label: "Sent", icon: Send, count: emails.filter((e) => e.status === "sent").length },
    { key: "rejected", label: "Rejected", icon: XIcon, count: emails.filter((e) => e.status === "rejected").length },
    { key: "all", label: "All", icon: FileText, count: emails.length },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          AI Drafts
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Review, edit, approve, or reject AI-generated emails before sending
        </p>
      </div>

      {/* Important notice */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
      >
        <AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#f59e0b" }}>
            Manual approval required
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Every email must be reviewed and approved before sending. No emails are sent autonomously.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t.key ? "var(--glow-color)" : "transparent",
              color: tab === t.key ? "var(--accent)" : "var(--muted)",
              border: tab === t.key ? "1px solid rgba(99, 102, 241, 0.3)" : "1px solid transparent",
            }}
          >
            <t.icon size={14} />
            {t.label}
            <span
              className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
              style={{
                background: tab === t.key ? "rgba(99, 102, 241, 0.2)" : "var(--surface)",
                color: tab === t.key ? "var(--accent)" : "var(--muted)",
              }}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
        <input
          className="input pl-9 text-sm w-full"
          placeholder="Search by investor name or subject..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Email Cards */}
      {filtered.length === 0 ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <FileText size={40} style={{ color: "var(--muted)", opacity: 0.3 }} />
          <p className="text-lg font-semibold mt-4" style={{ color: "var(--foreground)" }}>
            No {tab === "all" ? "" : tab} drafts
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Go to Compose to generate AI emails for your investors.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((email) => {
            return (
              <ApprovalCard
                key={email.id}
                email={email}
                investorName={email.investor?.name ?? "Unknown Investor"}
                onAction={refresh}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
