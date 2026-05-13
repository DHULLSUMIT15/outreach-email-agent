"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: "indigo" | "emerald" | "amber" | "violet" | "rose" | "cyan";
  trend?: { value: string; positive: boolean };
}

const iconColors: Record<string, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  amber: "#f59e0b",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  cyan: "#22d3ee",
};

const iconBgs: Record<string, string> = {
  indigo: "rgba(99, 102, 241, 0.15)",
  emerald: "rgba(16, 185, 129, 0.15)",
  amber: "rgba(245, 158, 11, 0.15)",
  violet: "rgba(139, 92, 246, 0.15)",
  rose: "rgba(244, 63, 94, 0.15)",
  cyan: "rgba(34, 211, 238, 0.15)",
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: StatCardProps) {
  return (
    <div className={`glass-card stat-card ${color}`} style={{ padding: "20px 20px 20px 20px", paddingTop: "24px" }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {title}
          </p>
          <p className="text-3xl font-bold mt-2" style={{ color: "var(--foreground)" }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  background: trend.positive
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(244, 63, 94, 0.15)",
                  color: trend.positive ? "#10b981" : "#f43f5e",
                }}
              >
                {trend.positive ? "↑" : "↓"} {trend.value}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBgs[color] }}
        >
          <Icon size={20} style={{ color: iconColors[color] }} />
        </div>
      </div>
    </div>
  );
}
