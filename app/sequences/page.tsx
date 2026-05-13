"use client";

import { useEffect, useState } from "react";
import { Repeat, Calendar, Clock, Check, Pause, Play, Plus, Loader2, Send, Search, Filter } from "lucide-react";
import {
  getFollowUps,
  getInvestor,
  getInvestors,
  getEmails,
  getProfile,
  saveFollowUp,
  updateFollowUp,
  sendFollowUp,
  seedDemoData,
} from "../lib/actions";
import { FollowUp, Investor, Email, FollowUpFrequency, FOLLOWUP_FREQ_LABELS } from "../lib/types";

export default function SequencesPage() {
  const [followups, setFollowups] = useState<(FollowUp & { investor?: any })[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedInvestorId, setSelectedInvestorId] = useState("");
  const [frequency, setFrequency] = useState<FollowUpFrequency>("1_week");
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [seqFilter, setSeqFilter] = useState<"all" | "active" | "completed">("all");

  const refresh = async () => {
    const [fus, invs, ems] = await Promise.all([
      getFollowUps(),
      getInvestors(),
      getEmails(),
    ]);
    setFollowups(fus);
    setInvestors(invs);
    setEmails(ems);
  };

  useEffect(() => {
    seedDemoData().then(refresh);
  }, []);

  const handleCreateSequence = async () => {
    if (!selectedInvestorId) return;
    setGenerating(true);

    const profile = await getProfile();
    const investor = investors.find((i) => i.id === selectedInvestorId);
    const investorEmails = emails.filter((e) => e.investorId === selectedInvestorId && e.status === "sent");
    const lastEmail = investorEmails[investorEmails.length - 1];

    const minutesMap: Record<FollowUpFrequency, number> = {
      "5_min": 5,
      "1_week": 7 * 24 * 60,
      "2_weeks": 14 * 24 * 60,
      "3_weeks": 21 * 24 * 60,
      monthly: 30 * 24 * 60,
      custom: 10 * 24 * 60,
    };

    // Generate 2 follow-ups
    for (let seq = 1; seq <= 2; seq++) {
      const nextDate = new Date();
      nextDate.setMinutes(nextDate.getMinutes() + minutesMap[frequency] * seq);

      let subject = `Follow-up #${seq} — ${profile?.companyName || "Our startup"}`;
      let body = `Hi ${investor?.name || "there"},\n\nFollowing up on my previous email about ${profile?.companyName || "our startup"}.\n\n${seq === 1 ? `Since I last wrote, we've continued to grow — ${profile?.growthRate || "steadily"}.` : "I wanted to share one more quick update before going quiet."}\n\n${profile?.oneLiner || ""}\n\nWould a brief call this week work for you?\n\nBest,\n${profile?.founderName || "Founder"}`;

      await saveFollowUp({
        emailId: lastEmail?.id || "",
        investorId: selectedInvestorId,
        sequenceNumber: seq,
        frequency,
        nextSendDate: nextDate.toISOString(),
        stopped: false,
        subject,
        body,
        approved: false,
        sentAt: null,
      });
    }

    setGenerating(false);
    setShowCreate(false);
    await refresh();
  };

  const toggleStop = async (id: string, currentStopped: boolean) => {
    await updateFollowUp(id, { stopped: !currentStopped });
    refresh();
  };

  const approveFollowUp = async (id: string) => {
    await updateFollowUp(id, { approved: true });
    refresh();
  };

  const handleSendFollowUp = async (id: string) => {
    let credentials;
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("zoho_email");
      const pass = localStorage.getItem("zoho_password");
      const host = localStorage.getItem("zoho_region") || "smtp.zoho.in";
      if (user && pass) {
        credentials = { user, pass, host };
      }
    }
    
    try {
      await sendFollowUp(id, credentials);
      refresh();
    } catch (err: any) {
      alert("Failed to send follow-up: " + err.message);
    }
  };

  // Get investors who have sent emails (eligible for follow-ups)
  const investorsWithSentEmails = Array.from(
    new Set(emails.filter((e) => e.status === "sent").map((e) => e.investorId))
  );

  const allActive = followups.filter((f) => !f.stopped && !f.sentAt);
  const allCompleted = followups.filter((f) => f.stopped || f.sentAt);

  const applySearch = (list: typeof followups) =>
    list.filter((f) =>
      !search ||
      (f.investor?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      f.subject.toLowerCase().includes(search.toLowerCase())
    );

  const activeSequences = applySearch(seqFilter === "completed" ? [] : allActive);
  const completedSequences = applySearch(seqFilter === "active" ? [] : allCompleted);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Follow-up Sequences
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Automated follow-ups with manual approval before every send
          </p>
        </div>
        <button className="btn-primary btn-sm" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> Create Sequence
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 min-w-0 w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
          <input
            className="input pl-9 text-sm w-full"
            placeholder="Search by investor or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={13} style={{ color: "var(--muted)" }} />
          {(["all", "active", "completed"] as const).map((f) => (
            <button
              key={f}
              className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
              style={{
                background: seqFilter === f ? "var(--glow-color)" : "transparent",
                color: seqFilter === f ? "var(--accent)" : "var(--muted)",
                border: seqFilter === f ? "1px solid rgba(99,102,241,0.3)" : "1px solid transparent",
              }}
              onClick={() => setSeqFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Create Sequence Panel */}
      {showCreate && (
        <div className="glass-card p-5 mb-6 animate-slide-up">
          <h3 className="text-sm font-bold mb-4" style={{ color: "var(--foreground)" }}>
            New Follow-up Sequence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="label">Investor</label>
              <select
                className="input"
                value={selectedInvestorId}
                onChange={(e) => setSelectedInvestorId(e.target.value)}
              >
                <option value="">Select investor...</option>
                {investorsWithSentEmails.map((id) => {
                  const inv = investors.find((i) => i.id === id);
                  return inv ? (
                    <option key={id} value={id}>
                      {inv.name} — {inv.firm}
                    </option>
                  ) : null;
                })}
              </select>
            </div>
            <div>
              <label className="label">Frequency</label>
              <select
                className="input"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as FollowUpFrequency)}
              >
                {Object.entries(FOLLOWUP_FREQ_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              className="btn-primary btn-sm"
              onClick={handleCreateSequence}
              disabled={!selectedInvestorId || generating}
            >
              {generating ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Repeat size={14} /> Create Sequence
                </>
              )}
            </button>
            <button className="btn-secondary btn-sm" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Sequences */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Clock size={16} style={{ color: "#f59e0b" }} />
          Active Sequences ({activeSequences.length})
        </h2>
        {activeSequences.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No active follow-up sequences. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSequences.map((fu) => {
              return (
                <div key={fu.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                        Follow-up #{fu.sequenceNumber} → {fu.investor?.name || "Unknown"}
                      </p>
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        <Calendar size={12} className="inline mr-1" />
                        Scheduled: {new Date(fu.nextSendDate).toLocaleDateString()} •{" "}
                        {FOLLOWUP_FREQ_LABELS[fu.frequency]}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!fu.approved && (
                        <button className="btn-success btn-sm" onClick={() => approveFollowUp(fu.id)}>
                          <Check size={12} /> Approve
                        </button>
                      )}
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => toggleStop(fu.id, fu.stopped)}
                      >
                        <Pause size={12} /> Pause
                      </button>
                    </div>
                  </div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                    Subject: {fu.subject}
                  </p>
                  <div
                    className="text-xs whitespace-pre-wrap p-3 rounded-lg"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--muted)" }}
                  >
                    {fu.body}
                  </div>
                  {fu.approved && (
                    <div className="mt-3 flex items-center justify-between bg-green-500/10 p-2 rounded border border-green-500/20">
                      <p className="text-[11px] font-medium text-green-500">
                        ✓ Approved — Scheduled for {new Date(fu.nextSendDate).toLocaleDateString()}
                      </p>
                      <button 
                        className="btn-primary py-1 px-2 text-[11px]" 
                        onClick={() => handleSendFollowUp(fu.id)}
                      >
                        <Send size={12} className="mr-1" /> Send Now
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed / Stopped */}
      {completedSequences.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <Check size={16} style={{ color: "#10b981" }} />
            Completed / Stopped ({completedSequences.length})
          </h2>
          <div className="space-y-3">
            {completedSequences.map((fu) => {
              return (
                <div key={fu.id} className="glass-card p-4" style={{ opacity: 0.6 }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        Follow-up #{fu.sequenceNumber} → {fu.investor?.name || "Unknown"}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {fu.sentAt ? `Sent ${new Date(fu.sentAt).toLocaleDateString()}` : "Paused"}
                      </p>
                    </div>
                    {fu.stopped && !fu.sentAt && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => toggleStop(fu.id, fu.stopped)}
                      >
                        <Play size={12} /> Resume
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
