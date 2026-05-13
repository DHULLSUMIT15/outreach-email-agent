"use client";

import { Email, FollowUpFrequency, FOLLOWUP_FREQ_LABELS } from "../lib/types";
import { approveEmail, rejectEmail, sendEmail, updateEmail, saveFollowUp, getProfile } from "../lib/actions";
import { Check, X, Edit3, Send, AlertTriangle, Sparkles, Repeat } from "lucide-react";
import { useState } from "react";

interface Props {
  email: Email;
  investorName: string;
  onAction: () => void;
}

export default function ApprovalCard({ email, investorName, onAction }: Props) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(email.body);
  const [subject, setSubject] = useState(email.subject);
  const [followUpFreq, setFollowUpFreq] = useState<FollowUpFrequency>("1_week");
  const [scheduleFollowUp, setScheduleFollowUp] = useState(true);
  const [sending, setSending] = useState(false);

  const handleApprove = async () => {
    if (editing) {
      await updateEmail(email.id, { subject, body });
    }
    await approveEmail(email.id);
    onAction();
  };

  const handleSend = async () => {
    let credentials: { user: string; pass: string; host: string } | undefined;
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("zoho_email");
      const pass = localStorage.getItem("zoho_password");
      const host = localStorage.getItem("zoho_region") || "smtp.zoho.in";
      if (user && pass) {
        credentials = { user, pass, host };
      }
    }

    if (!credentials) {
      alert("⚠️ Zoho credentials not saved.\n\nPlease go to Settings → Email Settings, enter your Zoho email and App-Specific Password, then click 'Test Connection' to auto-save them.");
      return;
    }

    setSending(true);
    try {
      await sendEmail(email.id, credentials);

      // Auto-schedule follow-up sequence if enabled
      if (scheduleFollowUp) {
        const profile = await getProfile();
        const minutesMap: Record<FollowUpFrequency, number> = {
          "5_min": 5,
          "1_week": 7 * 24 * 60,
          "2_weeks": 14 * 24 * 60,
          "3_weeks": 21 * 24 * 60,
          monthly: 30 * 24 * 60,
          custom: 10 * 24 * 60,
        };

        // Create only the first follow-up — the autopilot engine will auto-chain the rest infinitely
        {
          const seq = 1;
          const nextDate = new Date();
          nextDate.setMinutes(nextDate.getMinutes() + minutesMap[followUpFreq]);

          const fuSubject = `Follow-up #${seq} — ${profile?.companyName || "Our startup"}`;
          const fuBody = `Hi ${investorName},\n\nFollowing up on my previous email about ${profile?.companyName || "our startup"}.\n\n${
            seq === 1
              ? `Since I last wrote, we've continued to grow — ${profile?.growthRate || "steadily"}.`
              : "I wanted to share one more quick update before going quiet."
          }\n\n${profile?.oneLiner || ""}\n\nWould a brief call this week work for you?\n\nBest,\n${profile?.founderName || "Founder"}`;

          await saveFollowUp({
            emailId: email.id,
            investorId: email.investorId,
            sequenceNumber: seq,
            frequency: followUpFreq,
            nextSendDate: nextDate.toISOString(),
            stopped: false,
            subject: fuSubject,
            body: fuBody,
            approved: true,
            sentAt: null,
          });
        }
        // No closing loop — only 1 follow-up created, autopilot chains the rest
      }

      onAction();
    } catch (err: any) {
      alert("Failed to send email: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleReject = async () => {
    await rejectEmail(email.id);
    onAction();
  };

  const isPendingApproval = email.status === "draft" && !email.approved;
  const isApproved = email.status === "approved";
  const isSent = email.status === "sent";
  const isRejected = email.status === "rejected";

  return (
    <div className="glass-card p-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: isPendingApproval
                ? "rgba(245, 158, 11, 0.15)"
                : isApproved
                ? "rgba(16, 185, 129, 0.15)"
                : isSent
                ? "rgba(99, 102, 241, 0.15)"
                : "rgba(244, 63, 94, 0.15)",
            }}
          >
            {isPendingApproval && <AlertTriangle size={16} style={{ color: "#f59e0b" }} />}
            {isApproved && <Check size={16} style={{ color: "#10b981" }} />}
            {isSent && <Send size={16} style={{ color: "#6366f1" }} />}
            {isRejected && <X size={16} style={{ color: "#f43f5e" }} />}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              To: {investorName}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isPendingApproval && "Pending Approval"}
              {isApproved && "Approved — Ready to Send"}
              {isSent && `Sent ${email.sentAt ? new Date(email.sentAt).toLocaleDateString() : ""}`}
              {isRejected && "Rejected"}
            </p>
          </div>
        </div>
        {email.variant && (
          <span
            className="text-[11px] px-2 py-1 rounded-full font-semibold"
            style={{ background: "rgba(139, 92, 246, 0.15)", color: "#a78bfa" }}
          >
            <Sparkles size={10} className="inline mr-1" />
            Variant {email.variant}
          </span>
        )}
      </div>

      {/* Subject */}
      {editing ? (
        <input
          className="input text-sm font-semibold mb-3"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      ) : (
        <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>
          Subject: {email.subject}
        </p>
      )}

      {/* Body */}
      {editing ? (
        <textarea
          className="input text-sm mb-4"
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      ) : (
        <div
          className="text-sm whitespace-pre-wrap leading-relaxed mb-4 p-4 rounded-xl"
          style={{
            color: "var(--foreground)",
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          {email.body}
        </div>
      )}

      {/* Strategy notes */}
      {email.whyThisWorks && (
        <div
          className="text-xs p-3 rounded-lg mb-3"
          style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}
        >
          <span className="font-semibold" style={{ color: "#10b981" }}>✦ Why this works:</span>{" "}
          <span style={{ color: "var(--muted)" }}>{email.whyThisWorks}</span>
        </div>
      )}
      {email.risk && (
        <div
          className="text-xs p-3 rounded-lg mb-4"
          style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}
        >
          <span className="font-semibold" style={{ color: "#f59e0b" }}>⚠ Risk:</span>{" "}
          <span style={{ color: "var(--muted)" }}>{email.risk}</span>
        </div>
      )}

      {/* Follow-up Frequency Selector — shown when approved */}
      {isApproved && (
        <div
          className="p-3 rounded-xl mb-4"
          style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Repeat size={14} style={{ color: "#818cf8" }} />
            <span className="text-xs font-semibold" style={{ color: "#818cf8" }}>
              Auto Follow-up Sequence
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                className="w-8 h-5 rounded-full relative transition-all cursor-pointer"
                style={{
                  background: scheduleFollowUp
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "var(--border)",
                }}
                onClick={() => setScheduleFollowUp(!scheduleFollowUp)}
              >
                <div
                  className="w-3 h-3 rounded-full absolute top-1 bg-white transition-all"
                  style={{ left: scheduleFollowUp ? "17px" : "3px" }}
                />
              </div>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                Schedule follow-ups
              </span>
            </label>
            {scheduleFollowUp && (
              <select
                className="input text-xs py-1 px-2"
                style={{ width: "auto", minWidth: "160px" }}
                value={followUpFreq}
                onChange={(e) => setFollowUpFreq(e.target.value as FollowUpFrequency)}
              >
                {Object.entries(FOLLOWUP_FREQ_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            )}
            {scheduleFollowUp && (
              <span className="text-[11px]" style={{ color: "var(--muted)" }}>
                🔄 Infinite loop until investor replies
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {isPendingApproval && (
          <>
            <button className="btn-success btn-sm" onClick={handleApprove}>
              <Check size={14} /> Approve
            </button>
            <button
              className="btn-secondary btn-sm"
              onClick={() => setEditing(!editing)}
            >
              <Edit3 size={14} /> {editing ? "Preview" : "Edit"}
            </button>
            <button className="btn-danger btn-sm" onClick={handleReject}>
              <X size={14} /> Reject
            </button>
          </>
        )}
        {isApproved && (
          <button className="btn-primary btn-sm" onClick={handleSend} disabled={sending}>
            <Send size={14} /> {sending ? "Sending..." : "Send Now"}
          </button>
        )}
        {isSent && (
          <span className="text-xs font-medium" style={{ color: "#10b981" }}>
            ✓ Delivered
          </span>
        )}
      </div>
    </div>
  );
}
