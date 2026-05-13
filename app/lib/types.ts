// ============================================
// Angel Investor Outreach Agent — Type System
// ============================================

export type InvestorStatus =
  | "not_contacted"
  | "first_email_sent"
  | "followup_scheduled"
  | "replied"
  | "interested"
  | "rejected";

export const INVESTOR_STATUS_LABELS: Record<InvestorStatus, string> = {
  not_contacted: "Not Contacted",
  first_email_sent: "First Email Sent",
  followup_scheduled: "Follow-up Scheduled",
  replied: "Replied",
  interested: "Interested",
  rejected: "Rejected",
};

export const INVESTOR_STATUS_COLORS: Record<InvestorStatus, string> = {
  not_contacted: "bg-slate-500/20 text-slate-300",
  first_email_sent: "bg-blue-500/20 text-blue-400",
  followup_scheduled: "bg-amber-500/20 text-amber-400",
  replied: "bg-violet-500/20 text-violet-400",
  interested: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-rose-500/20 text-rose-400",
};

export interface Investor {
  id: string;
  name: string;
  email: string;
  firm: string;
  stage: string;
  notes: string;
  tags: string[];
  lastContactedAt: string | null;
  status: InvestorStatus;
  createdAt: string;
  updatedAt: string;
}

export type EmailStatus = "draft" | "approved" | "sent" | "rejected";

export interface Email {
  id: string;
  investorId: string;
  subject: string;
  body: string;
  status: EmailStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  approved: boolean;
  createdAt: string;
  variant?: number;
  hookStyle?: string;
  whyThisWorks?: string;
  risk?: string;
}

export type FollowUpFrequency =
  | "5_min"
  | "1_week"
  | "2_weeks"
  | "3_weeks"
  | "monthly"
  | "custom";

export const FOLLOWUP_FREQ_LABELS: Record<FollowUpFrequency, string> = {
  "5_min": "5 Minutes (Test)",
  "1_week": "1 Week",
  "2_weeks": "2 Weeks",
  "3_weeks": "3 Weeks",
  monthly: "Monthly",
  custom: "Custom (10 days)",
};

export interface FollowUp {
  id: string;
  emailId: string;
  investorId: string;
  sequenceNumber: number;
  frequency: FollowUpFrequency;
  nextSendDate: string;
  stopped: boolean;
  subject: string;
  body: string;
  approved: boolean;
  sentAt: string | null;
  createdAt: string;
}

export interface CompanyProfile {
  founderName: string;
  founderRole: string;
  companyName: string;
  oneLiner: string;
  sector: string;
  stage: string;
  amountRaising: string;
  roundStructure: string;
  alreadyCommitted: string;
  problem: string;
  insight: string;
  product: string;
  differentiator: string;
  revenue: string;
  users: string;
  growthRate: string;
  loisWaitlist: string;
  otherProof: string;
  tamSam: string;
  comparableExits: string;
}

export interface EmailConfig {
  tone: "formal" | "conversational" | "bold" | "technical";
  length: "short" | "medium" | "long";
  hookStyle: string;
  structure: string;
  ctaStyle: string;
  followUpCount: number;
  variants: number;
}

export interface DashboardStats {
  totalInvestors: number;
  contacted: number;
  replied: number;
  interested: number;
  pendingApprovals: number;
  followUpsSent: number;
  replyRate: number;
  openRate: number;
}

export interface ActivityItem {
  id: string;
  type: "email_sent" | "reply_received" | "followup_sent" | "investor_added" | "email_approved";
  investorName: string;
  description: string;
  timestamp: string;
}
