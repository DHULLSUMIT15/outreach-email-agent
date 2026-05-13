"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Send,
  MessageSquare,
  Star,
  Clock,
  TrendingUp,
  Activity,
  Mail,
  UserPlus,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import StatCard from "./components/StatCard";
import KanbanBoard from "./components/KanbanBoard";
import { getDashboardStats, getInvestors, getActivity, seedDemoData, getEmails } from "./lib/actions";
import { DashboardStats, Investor, ActivityItem, Email } from "./lib/types";
import Link from "next/link";
import ApprovalCard from "./components/ApprovalCard";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [emails, setEmails] = useState<(Email & { investor?: any })[]>([]);

  const refreshData = async () => {
    const [st, invs, act, ems] = await Promise.all([
      getDashboardStats(),
      getInvestors(),
      getActivity(),
      getEmails(),
    ]);
    setStats(st);
    setInvestors(invs);
    setActivity(act);
    setEmails(ems);
  };

  useEffect(() => {
    seedDemoData().then(refreshData);
  }, []);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const activityIcons: Record<string, typeof Mail> = {
    email_sent: Send,
    reply_received: MessageSquare,
    followup_sent: Clock,
    investor_added: UserPlus,
    email_approved: CheckCircle,
  };

  const activityColors: Record<string, string> = {
    email_sent: "#6366f1",
    reply_received: "#10b981",
    followup_sent: "#f59e0b",
    investor_added: "#8b5cf6",
    email_approved: "#22d3ee",
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Your investor outreach at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Investors"
          value={stats.totalInvestors}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Contacted"
          value={stats.contacted}
          icon={Send}
          color="cyan"
        />
        <StatCard
          title="Replied"
          value={stats.replied}
          subtitle={`${stats.replyRate}% reply rate`}
          icon={MessageSquare}
          color="emerald"
        />
        <StatCard
          title="Interested"
          value={stats.interested}
          icon={Star}
          color="violet"
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApprovals}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Follow-ups Sent"
          value={stats.followUpsSent}
          icon={TrendingUp}
          color="rose"
        />
      </div>

      {/* Pipeline Kanban */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
            Investor Pipeline
          </h2>
          <Link href="/investors" className="text-sm font-medium flex items-center gap-1" style={{ color: "var(--accent)" }}>
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <KanbanBoard investors={investors} />
      </div>

      {/* Bottom Grid: Activity + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity & Pending Emails */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-card p-5 flex flex-col" style={{ maxHeight: "400px" }}>
            <h3 className="text-base font-bold mb-4" style={{ color: "var(--foreground)" }}>
              Recent Activity
            </h3>
            <div className="flex-1 overflow-y-auto pr-2">
            {activity.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--muted)" }}>
                No activity yet. Start by adding investors and composing emails.
              </p>
            ) : (
              <div className="space-y-3">
                {activity.slice(0, 8).map((item) => {
                  const Icon = activityIcons[item.type] || Activity;
                  const color = activityColors[item.type] || "#64748b";
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-white/[0.03]"
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}20` }}
                      >
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {item.description}
                        </p>
                        <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>

          {/* Pending Emails Section */}
          <div className="glass-card p-5 flex flex-col">
            <h3 className="text-base font-bold mb-4" style={{ color: "var(--foreground)" }}>
              Pending Emails
            </h3>
            {emails.filter((e) => e.status !== "sent").length === 0 ? (
              <p className="text-sm text-center" style={{ color: "var(--muted)" }}>
                No pending emails. Compose a new email to get started.
              </p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {emails
                  .filter((e) => e.status !== "sent")
                  .map((email) => (
                    <ApprovalCard
                      key={email.id}
                      email={email as any}
                      investorName={email.investor?.name ?? ""}
                      onAction={refreshData}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions */}
        <div className="glass-card p-5 flex flex-col h-full">
          <h3 className="text-base font-bold mb-4" style={{ color: "var(--foreground)" }}>
            Quick Actions
          </h3>
          <div className="space-y-3">
            <Link
              href="/investors"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(139, 92, 246, 0.15)" }}
              >
                <UserPlus size={16} style={{ color: "#8b5cf6" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Add Investor
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Build your target list
                </p>
              </div>
            </Link>

            <Link
              href="/compose"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(99, 102, 241, 0.15)" }}
              >
                <Mail size={16} style={{ color: "#6366f1" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Compose Email
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  AI-generated outreach
                </p>
              </div>
            </Link>

            <Link
              href="/drafts"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(245, 158, 11, 0.15)" }}
              >
                <Clock size={16} style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Review Drafts
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  {stats.pendingApprovals} pending approval
                </p>
              </div>
            </Link>

            <Link
              href="/analytics"
              className="flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
              style={{ border: "1px solid var(--border)" }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(16, 185, 129, 0.15)" }}
              >
                <TrendingUp size={16} style={{ color: "#10b981" }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                  Analytics
                </p>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Track performance
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
