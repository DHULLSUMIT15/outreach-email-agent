"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Users,
  Send,
  MessageSquare,
  Star,
  Clock,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import StatCard from "../components/StatCard";
import { getInvestors, getEmails, getFollowUps, getDashboardStats, seedDemoData } from "../lib/actions";
import { Investor, INVESTOR_STATUS_LABELS, InvestorStatus } from "../lib/types";

export default function AnalyticsPage() {
  const [stats, setStats] = useState({
    totalInvestors: 0,
    contacted: 0,
    replied: 0,
    interested: 0,
    pendingApprovals: 0,
    followUpsSent: 0,
    replyRate: 0,
    openRate: 0,
  });
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadData = async () => {
    const [st, invs, ems] = await Promise.all([
      getDashboardStats(),
      getInvestors(),
      getEmails(),
    ]);
    setStats(st);
    setInvestors(invs);
    setEmails(ems);
    setMounted(true);
  };

  useEffect(() => {
    seedDemoData().then(loadData);
  }, []);

  // Pipeline data
  const pipelineData = [
    { name: "Not Contacted", value: investors.filter((i) => i.status === "not_contacted").length, fill: "#64748b" },
    { name: "Email Sent", value: investors.filter((i) => i.status === "first_email_sent").length, fill: "#3b82f6" },
    { name: "Follow-up", value: investors.filter((i) => i.status === "followup_scheduled").length, fill: "#f59e0b" },
    { name: "Replied", value: investors.filter((i) => i.status === "replied").length, fill: "#8b5cf6" },
    { name: "Interested", value: investors.filter((i) => i.status === "interested").length, fill: "#10b981" },
    { name: "Rejected", value: investors.filter((i) => i.status === "rejected").length, fill: "#f43f5e" },
  ];

  // Weekly activity (demo data)
  const weeklyData = [
    { day: "Mon", emailsSent: 3, replies: 1, followups: 2 },
    { day: "Tue", emailsSent: 5, replies: 0, followups: 3 },
    { day: "Wed", emailsSent: 2, replies: 2, followups: 1 },
    { day: "Thu", emailsSent: 4, replies: 1, followups: 4 },
    { day: "Fri", emailsSent: 6, replies: 3, followups: 2 },
    { day: "Sat", emailsSent: 1, replies: 0, followups: 0 },
    { day: "Sun", emailsSent: 0, replies: 0, followups: 0 },
  ];

  // Response rate over time (demo)
  const responseData = [
    { week: "Week 1", rate: 12 },
    { week: "Week 2", rate: 18 },
    { week: "Week 3", rate: 22 },
    { week: "Week 4", rate: 28 },
    { week: "Week 5", rate: 25 },
    { week: "Week 6", rate: 32 },
  ];

  const COLORS = ["#64748b", "#3b82f6", "#f59e0b", "#8b5cf6", "#10b981", "#f43f5e"];

  const sentCount = emails.filter((e) => e.status === "sent").length;
  const draftCount = emails.filter((e) => e.status === "draft").length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Track your outreach performance and pipeline health
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Emails Sent" value={sentCount} icon={Send} color="indigo" />
        <StatCard
          title="Reply Rate"
          value={`${stats.replyRate}%`}
          icon={MessageSquare}
          color="emerald"
          trend={{ value: "+5%", positive: true }}
        />
        <StatCard title="Interested" value={stats.interested} icon={Star} color="violet" />
        <StatCard title="Pending Drafts" value={draftCount} icon={Clock} color="amber" />
      </div>

      {/* Charts Grid */}
      {mounted && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pipeline Distribution */}
          <div className="glass-card p-5">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <Target size={16} style={{ color: "var(--accent)" }} />
              Pipeline Distribution
            </h3>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pipelineData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {pipelineData
                      .filter((d) => d.value > 0)
                      .map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(51, 65, 85, 0.5)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "#e2e8f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pipelineData
                .filter((d) => d.value > 0)
                .map((d) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {d.name} ({d.value})
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Weekly Activity */}
          <div className="glass-card p-5">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <BarChart3 size={16} style={{ color: "var(--accent)" }} />
              Weekly Activity
            </h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(51, 65, 85, 0.5)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Bar dataKey="emailsSent" fill="#6366f1" radius={[4, 4, 0, 0]} name="Emails Sent" />
                  <Bar dataKey="replies" fill="#10b981" radius={[4, 4, 0, 0]} name="Replies" />
                  <Bar dataKey="followups" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Follow-ups" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Response Rate Trend */}
          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <TrendingUp size={16} style={{ color: "var(--accent)" }} />
              Response Rate Trend
            </h3>
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={responseData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(51, 65, 85, 0.5)",
                      borderRadius: "10px",
                      fontSize: "13px",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: any) => [`${value}%`, "Reply Rate"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Conversion Funnel */}
      <div className="glass-card p-5">
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Users size={16} style={{ color: "var(--accent)" }} />
          Conversion Funnel
        </h3>
        <div className="space-y-3">
          {[
            { label: "Total Investors", value: stats.totalInvestors, pct: 100, color: "#64748b" },
            { label: "Contacted", value: stats.contacted, pct: stats.totalInvestors > 0 ? Math.round((stats.contacted / stats.totalInvestors) * 100) : 0, color: "#3b82f6" },
            { label: "Replied", value: stats.replied, pct: stats.totalInvestors > 0 ? Math.round((stats.replied / stats.totalInvestors) * 100) : 0, color: "#8b5cf6" },
            { label: "Interested", value: stats.interested, pct: stats.totalInvestors > 0 ? Math.round((stats.interested / stats.totalInvestors) * 100) : 0, color: "#10b981" },
          ].map((step) => (
            <div key={step.label} className="flex items-center gap-4">
              <span className="text-sm font-medium w-32" style={{ color: "var(--foreground)" }}>
                {step.label}
              </span>
              <div className="flex-1 h-8 rounded-lg overflow-hidden" style={{ background: "var(--surface)" }}>
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all duration-700"
                  style={{
                    width: `${Math.max(step.pct, 5)}%`,
                    background: `${step.color}30`,
                    borderRight: `3px solid ${step.color}`,
                  }}
                >
                  <span className="text-xs font-bold" style={{ color: step.color }}>
                    {step.value} ({step.pct}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
