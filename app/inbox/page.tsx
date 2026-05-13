"use client";

import { useEffect, useState } from "react";
import { Inbox, MessageSquare, Clock, Archive, Bell } from "lucide-react";
import { getInvestors, getEmails, updateInvestor, stopFollowUpSequence, addActivity, seedDemoData } from "../lib/actions";
import { Investor, Email, INVESTOR_STATUS_LABELS, INVESTOR_STATUS_COLORS } from "../lib/types";

interface InboxItem {
  investorId: string;
  investorName: string;
  firm: string;
  lastEmailSubject: string;
  status: "no_reply" | "replied" | "interested" | "out_of_office";
  daysSinceSent: number;
}

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);

  useEffect(() => {
    seedDemoData().then(buildInboxItems);
  }, []);

  const buildInboxItems = async () => {
    const [investors, emails] = await Promise.all([getInvestors(), getEmails()]);
    const inboxItems: InboxItem[] = [];

    investors.forEach((inv) => {
      const sentEmails = emails.filter(
        (e) => e.investorId === inv.id && e.status === "sent"
      );
      if (sentEmails.length === 0) return;

      const lastEmail = sentEmails[sentEmails.length - 1];
      const daysSince = Math.floor(
        (Date.now() - new Date(lastEmail.sentAt!).getTime()) / (1000 * 60 * 60 * 24)
      );

      let status: InboxItem["status"] = "no_reply";
      if (inv.status === "replied") status = "replied";
      else if (inv.status === "interested") status = "interested";

      inboxItems.push({
        investorId: inv.id,
        investorName: inv.name,
        firm: inv.firm,
        lastEmailSubject: lastEmail.subject,
        status,
        daysSinceSent: daysSince,
      });
    });

    setItems(inboxItems);
  };

  const markAsReplied = async (investorId: string) => {
    await updateInvestor(investorId, { status: "replied" });
    await stopFollowUpSequence(investorId);
    
    // Using current item name from state to avoid extra fetch, or just omit name
    const item = items.find((i) => i.investorId === investorId);
    await addActivity({
      type: "reply_received",
      investorName: item?.investorName ?? "Unknown",
      description: `${item?.investorName} replied! Follow-up sequence stopped.`,
    });
    await buildInboxItems();
  };

  const markAsInterested = async (investorId: string) => {
    await updateInvestor(investorId, { status: "interested" });
    await stopFollowUpSequence(investorId);
    
    const item = items.find((i) => i.investorId === investorId);
    await addActivity({
      type: "reply_received",
      investorName: item?.investorName ?? "Unknown",
      description: `${item?.investorName} is interested! 🎉`,
    });
    await buildInboxItems();
  };

  const replied = items.filter((i) => i.status === "replied" || i.status === "interested");
  const waiting = items.filter((i) => i.status === "no_reply");

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Inbox Replies
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Monitor investor replies and update statuses
        </p>
      </div>

      {/* Info box */}
      <div
        className="flex items-start gap-3 p-4 rounded-xl mb-6"
        style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.2)" }}
      >
        <Bell size={18} style={{ color: "#6366f1", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#818cf8" }}>
            Reply Detection
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            In production, this will automatically monitor your inbox via Gmail API webhooks.
            For now, manually mark replies below. When an investor replies, all follow-up sequences are automatically stopped.
          </p>
        </div>
      </div>

      {/* Replied Section */}
      <div className="mb-8">
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <MessageSquare size={16} style={{ color: "#10b981" }} />
          Replies Received ({replied.length})
        </h2>
        {replied.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No replies yet. Keep your outreach quality high!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {replied.map((item) => (
              <div key={item.investorId} className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {item.investorName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {item.firm} • RE: {item.lastEmailSubject}
                    </p>
                  </div>
                  <span
                    className="badge"
                    style={{
                      background: item.status === "interested" ? "rgba(16, 185, 129, 0.15)" : "rgba(139, 92, 246, 0.15)",
                      color: item.status === "interested" ? "#10b981" : "#a78bfa",
                    }}
                  >
                    {item.status === "interested" ? "🎯 Interested" : "💬 Replied"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waiting for Reply */}
      <div>
        <h2 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Clock size={16} style={{ color: "#f59e0b" }} />
          Waiting for Reply ({waiting.length})
        </h2>
        {waiting.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No emails waiting for replies.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {waiting.map((item) => (
              <div key={item.investorId} className="glass-card p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {item.investorName}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {item.firm} • "{item.lastEmailSubject}" • Sent {item.daysSinceSent} days ago
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn-success btn-sm"
                      onClick={() => markAsInterested(item.investorId)}
                    >
                      🎯 Interested
                    </button>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => markAsReplied(item.investorId)}
                    >
                      💬 Replied
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
