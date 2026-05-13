"use client";

import { useEffect, useState, useMemo } from "react";
import { UserPlus, Upload, LayoutGrid, List, Search, Filter, X } from "lucide-react";
import { getInvestors, seedDemoData, saveInvestor } from "../lib/actions";
import { Investor, InvestorStatus, INVESTOR_STATUS_LABELS } from "../lib/types";
import InvestorTable from "../components/InvestorTable";
import InvestorModal from "../components/InvestorModal";
import KanbanBoard from "../components/KanbanBoard";

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvestorStatus | "all">("all");
  const [stageFilter, setStageFilter] = useState("all");

  const refresh = async () => {
    const data = await getInvestors();
    setInvestors(data);
  };

  useEffect(() => {
    seedDemoData().then(refresh);
  }, []);

  const stages = useMemo(() => {
    const s = new Set(investors.map((i) => i.stage).filter(Boolean));
    return Array.from(s);
  }, [investors]);

  const filtered = useMemo(() => {
    return investors.filter((inv) => {
      const matchSearch =
        !search ||
        inv.name.toLowerCase().includes(search.toLowerCase()) ||
        inv.firm.toLowerCase().includes(search.toLowerCase()) ||
        inv.email.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      const matchStage = stageFilter === "all" || inv.stage === stageFilter;
      return matchSearch && matchStatus && matchStage;
    });
  }, [investors, search, statusFilter, stageFilter]);

  const hasFilters = search || statusFilter !== "all" || stageFilter !== "all";

  const handleCSVImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = ev.target?.result as string;
        const lines = text.split("\n").filter(Boolean);
        if (lines.length < 2) return alert("CSV must have a header row and at least one data row.");
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const emailIdx = headers.indexOf("email");
        const firmIdx = headers.indexOf("firm");
        if (nameIdx === -1 || emailIdx === -1) {
          return alert("CSV must have 'name' and 'email' columns.");
        }
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          if (cols[nameIdx] && cols[emailIdx]) {
            await saveInvestor({
              name: cols[nameIdx],
              email: cols[emailIdx],
              firm: firmIdx !== -1 ? cols[firmIdx] || "" : "",
              stage: "Pre-Seed",
              notes: "",
              tags: [],
              status: "not_contacted",
              lastContactedAt: null,
            });
            count++;
          }
        }
        alert(`Imported ${count} investors from CSV.`);
        refresh();
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Investors
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            {filtered.length} of {investors.length} investors
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <button
              onClick={() => setView("table")}
              className="p-2 transition-colors"
              style={{ background: view === "table" ? "var(--glow-color)" : "transparent", color: view === "table" ? "var(--accent)" : "var(--muted)" }}
              title="Table view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setView("kanban")}
              className="p-2 transition-colors"
              style={{ background: view === "kanban" ? "var(--glow-color)" : "transparent", color: view === "kanban" ? "var(--accent)" : "var(--muted)" }}
              title="Kanban view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
          <button className="btn-secondary btn-sm" onClick={handleCSVImport}>
            <Upload size={14} /> Import CSV
          </button>
          <button className="btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <UserPlus size={14} /> Add Investor
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search by name, firm or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
          <select
            className="input text-sm"
            style={{ width: "auto", minWidth: "150px" }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as InvestorStatus | "all")}
          >
            <option value="all">All Statuses</option>
            {Object.entries(INVESTOR_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {stages.length > 0 && (
            <select
              className="input text-sm"
              style={{ width: "auto", minWidth: "130px" }}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="all">All Stages</option>
              {stages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {hasFilters && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setStageFilter("all"); }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {view === "table" ? (
        <InvestorTable investors={filtered} onRefresh={refresh} />
      ) : (
        <KanbanBoard investors={filtered} />
      )}

      {showModal && (
        <InvestorModal onClose={() => setShowModal(false)} onSaved={refresh} />
      )}
    </div>
  );
}
