"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  PenLine,
  FileText,
  BarChart3,
  Settings,
  Repeat,
  Inbox,
  Zap,
  Moon,
  Sun,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investors", label: "Investors", icon: Users },
  { href: "/compose", label: "Compose", icon: PenLine },
  { href: "/drafts", label: "AI Drafts", icon: FileText },
  { href: "/sequences", label: "Sequences", icon: Repeat },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let saved = "dark";
    if (typeof window !== "undefined") {
      saved = localStorage.getItem("outreach_theme") || "dark";
    }
    setThemeState(saved as "dark" | "light");
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setThemeState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("outreach_theme", next);
    }
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`sidebar fixed md:sticky top-0 left-0 h-screen w-[260px] shrink-0 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              OutreachAI
            </h1>
            <p className="text-[11px] font-medium" style={{ color: "var(--muted)" }}>
              Investor Outreach Agent
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1 mt-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Theme toggle + footer */}
        <div className="px-4 pb-6 space-y-3">
          <button
            onClick={toggleTheme}
            className="sidebar-link w-full"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <div className="px-4 py-3 rounded-xl" style={{ background: "var(--glow-color)" }}>
            <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
              Neon PostgreSQL
            </p>
            <p className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
              Connected to cloud database
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
