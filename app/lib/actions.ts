"use server";

import prisma from "./prisma";
import {
  InvestorStatus,
  EmailStatus,
  FollowUpFrequency,
} from "./types";
import { revalidatePath } from "next/cache";

// Helper to serialize Prisma objects
function serialize<T>(obj: any): T {
  return JSON.parse(JSON.stringify(obj));
}

// ── Investors ──────────────────────────────────

export async function getInvestors() {
  const investors = await prisma.investor.findMany({
    orderBy: { createdAt: "desc" },
  });
  return serialize<any[]>(investors).map((inv) => ({
    ...inv,
    tags: JSON.parse(inv.tags),
  }));
}

export async function getInvestor(id: string) {
  const inv = await prisma.investor.findUnique({ where: { id } });
  if (!inv) return undefined;
  const serialized = serialize<any>(inv);
  return { ...serialized, tags: JSON.parse(serialized.tags) };
}

export async function saveInvestor(data: any) {
  const investor = await prisma.investor.create({
    data: {
      ...data,
      tags: JSON.stringify(data.tags || []),
    },
  });
  await addActivity({
    type: "investor_added",
    investorName: investor.name,
    description: `Added ${investor.name} from ${investor.firm}`,
  });
  revalidatePath("/");
  return serialize<any>({ ...investor, tags: JSON.parse(investor.tags) });
}

export async function updateInvestor(id: string, data: any) {
  const updateData = { ...data };
  if (updateData.tags) {
    updateData.tags = JSON.stringify(updateData.tags);
  }
  const investor = await prisma.investor.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/");
  return serialize<any>({ ...investor, tags: JSON.parse(investor.tags) });
}

export async function deleteInvestor(id: string) {
  await prisma.investor.delete({ where: { id } });
  revalidatePath("/");
}

// ── Emails ─────────────────────────────────────

export async function getEmails() {
  const emails = await prisma.email.findMany({
    orderBy: { createdAt: "desc" },
    include: { investor: true },
  });
  return serialize<any[]>(emails);
}

export async function getEmailsForInvestor(investorId: string) {
  const emails = await prisma.email.findMany({
    where: { investorId },
    orderBy: { createdAt: "desc" },
    include: { investor: true },
  });
  return serialize<any[]>(emails);
}

export async function getPendingApprovals() {
  const emails = await prisma.email.findMany({
    where: { status: "draft", approved: false },
    orderBy: { createdAt: "desc" },
    include: { investor: true },
  });
  return serialize<any[]>(emails);
}

export async function saveEmail(data: any) {
  const email = await prisma.email.create({ data });
  revalidatePath("/");
  return serialize<any>(email);
}

export async function updateEmail(id: string, data: any) {
  const email = await prisma.email.update({ where: { id }, data });
  revalidatePath("/");
  return serialize<any>(email);
}

export async function approveEmail(id: string) {
  const email = await prisma.email.update({
    where: { id },
    data: { status: "approved", approved: true },
    include: { investor: true },
  });
  await addActivity({
    type: "email_approved",
    investorName: email.investor.name,
    description: `Approved email: "${email.subject}"`,
  });
  revalidatePath("/");
}

export async function sendEmail(id: string, credentials?: { user: string; pass: string; host?: string }) {
  const email = await prisma.email.findUnique({
    where: { id },
    include: { investor: true },
  });

  if (!email) throw new Error("Email not found");

  if (!credentials?.user || !credentials?.pass) {
    throw new Error("Missing Zoho credentials. Please configure and save them in Settings.");
  }

  const nodemailer = require("nodemailer");
  const host = credentials.host || "smtp.zoho.in";

  const transporter = nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: {
      user: credentials.user.trim(),
      pass: credentials.pass.trim(),
    },
  });

    try {
      // Fetch profile for sender display name
      const profile = await prisma.companyProfile.findFirst();
      const senderName = profile?.founderName 
        ? `${profile.founderName} | ${profile.companyName || "Founder"}` 
        : credentials.user;
      const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2,9)}@${credentials.user.split("@")[1]}>`;

      await transporter.sendMail({
        from: `"${senderName}" <${credentials.user.trim()}>`,
        replyTo: credentials.user.trim(),
        to: email.investor.email,
        subject: email.subject,
        text: email.body,
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${email.body.replace(/\n/g, "<br>")}</div>`,
        headers: {
          "Message-ID": messageId,
          "X-Mailer": "Founder Leads Platform",
          "X-Priority": "3",
        },
      });
    } catch (error) {
      console.error("Failed to send email via Zoho:", error);
      throw new Error("SMTP Error: Check your Zoho credentials and ensure App-Specific Passwords are used.");
    }

  const updatedEmail = await prisma.email.update({
    where: { id },
    data: { status: "sent", sentAt: new Date() },
    include: { investor: true },
  });
  
  await prisma.investor.update({
    where: { id: updatedEmail.investorId },
    data: { status: "first_email_sent", lastContactedAt: new Date() },
  });

  await addActivity({
    type: "email_sent",
    investorName: updatedEmail.investor.name,
    description: `Sent email: "${updatedEmail.subject}"`,
  });
  revalidatePath("/");
}

export async function testZohoConnection(credentials: { user: string; pass: string; host?: string }) {
  if (!credentials?.user || !credentials?.pass) {
    throw new Error("Missing credentials");
  }
  
  const nodemailer = require("nodemailer");
  const host = credentials.host || "smtp.zoho.in";

  const tryConnect = async (port: number, secure: boolean) => {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: credentials.user.trim(),
        pass: credentials.pass.trim(),
      },
    });
    await transporter.verify();
  };

  try {
    // Try standard SSL first
    await tryConnect(465, true);
    return { success: true };
  } catch (error: any) {
    if (error.responseCode === 535) {
      console.error("Zoho verify error (465):", error);
      throw new Error(`Authentication Failed (535): Incorrect App-Specific Password or Email for region ${host}. Please generate a new App Password.`);
    }
    
    // If it's a connection/SSL error, try TLS on 587
    try {
      await tryConnect(587, false);
      return { success: true };
    } catch (err2: any) {
      console.error("Zoho verify error (587):", err2);
      throw new Error(error.message || "Failed to verify credentials");
    }
  }
}

export async function rejectEmail(id: string) {
  await prisma.email.update({
    where: { id },
    data: { status: "rejected", approved: false },
  });
  revalidatePath("/");
}

// ── Follow-ups ─────────────────────────────────

export async function getFollowUps() {
  const followups = await prisma.followUp.findMany({
    include: { investor: true },
  });
  return serialize<any[]>(followups);
}

export async function getFollowUpsForInvestor(investorId: string) {
  const followups = await prisma.followUp.findMany({ where: { investorId } });
  return serialize<any[]>(followups);
}

export async function saveFollowUp(data: any) {
  const followup = await prisma.followUp.create({ data });
  revalidatePath("/");
  return serialize<any>(followup);
}

export async function updateFollowUp(id: string, data: any) {
  await prisma.followUp.update({ where: { id }, data });
  revalidatePath("/");
}

export async function sendFollowUp(id: string, credentials?: { user: string; pass: string; host?: string }) {
  const followUp = await prisma.followUp.findUnique({
    where: { id },
    include: { investor: true },
  });

  if (!followUp) throw new Error("Follow-up not found");

  if (!credentials?.user || !credentials?.pass) {
    throw new Error("Missing Zoho credentials. Please configure and save them in Settings.");
  }

  const nodemailer = require("nodemailer");
  const host = credentials.host || "smtp.zoho.in";

  const transporter = nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: {
      user: credentials.user.trim(),
      pass: credentials.pass.trim(),
    },
  });

    try {
      const profile = await prisma.companyProfile.findFirst();
      const senderName = profile?.founderName 
        ? `${profile.founderName} | ${profile.companyName || "Founder"}` 
        : credentials.user;
      const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2,9)}@${credentials.user.split("@")[1]}>`;

      await transporter.sendMail({
        from: `"${senderName}" <${credentials.user.trim()}>`,
        replyTo: credentials.user.trim(),
        to: followUp.investor.email,
        subject: followUp.subject,
        text: followUp.body,
        html: `<div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${followUp.body.replace(/\n/g, "<br>")}</div>`,
        headers: {
          "Message-ID": messageId,
          "X-Mailer": "Founder Leads Platform",
          "X-Priority": "3",
        },
      });
    } catch (error) {
      console.error("Failed to send follow-up via Zoho:", error);
      throw new Error("SMTP Error: Check your Zoho credentials and ensure App-Specific Passwords are used.");
    }

  await prisma.followUp.update({
    where: { id },
    data: { sentAt: new Date(), stopped: true }, // We mark it stopped so it doesn't show as active pending
  });
  
  await prisma.investor.update({
    where: { id: followUp.investorId },
    data: { status: "followup_scheduled", lastContactedAt: new Date() }, // Or some status indicating follow-up sent
  });

  await addActivity({
    type: "email_sent",
    investorName: followUp.investor.name,
    description: `Sent follow-up #${followUp.sequenceNumber}: "${followUp.subject}"`,
  });
  revalidatePath("/");
}

export async function stopFollowUpSequence(investorId: string) {
  await prisma.followUp.updateMany({
    where: { investorId },
    data: { stopped: true },
  });
  revalidatePath("/");
}

// ── Company Profile ────────────────────────────

export async function getProfile() {
  const profile = await prisma.companyProfile.findFirst();
  return profile ? serialize<any>(profile) : null;
}

export async function saveProfile(data: any) {
  const existing = await prisma.companyProfile.findFirst();
  if (existing) {
    await prisma.companyProfile.update({ where: { id: existing.id }, data });
  } else {
    await prisma.companyProfile.create({ data });
  }
  revalidatePath("/");
}

// ── Activity Feed ──────────────────────────────

export async function getActivity() {
  const activities = await prisma.activity.findMany({
    orderBy: { timestamp: "desc" },
    take: 100,
  });
  return serialize<any[]>(activities);
}

export async function addActivity(data: any) {
  await prisma.activity.create({ data });
  revalidatePath("/");
}

// ── Dashboard Stats ────────────────────────────

export async function getDashboardStats() {
  const [totalInvestors, contacted, replied, interested, pendingApprovals, followUpsSent, sentEmails] = await Promise.all([
    prisma.investor.count(),
    prisma.investor.count({ where: { status: { not: "not_contacted" } } }),
    prisma.investor.count({ where: { status: { in: ["replied", "interested"] } } }),
    prisma.investor.count({ where: { status: "interested" } }),
    prisma.email.count({ where: { status: "draft" } }),
    prisma.followUp.count({ where: { sentAt: { not: null } } }),
    prisma.email.count({ where: { status: "sent" } }),
  ]);

  return {
    totalInvestors,
    contacted,
    replied,
    interested,
    pendingApprovals,
    followUpsSent,
    replyRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
    openRate: sentEmails > 0 ? Math.round(Math.random() * 30 + 50) : 0, // placeholder
  };
}

// ── Seed data (demo) ───────────────────────────
export async function seedDemoData() {
  const count = await prisma.investor.count();
  if (count > 0) return; // Already seeded

  const demoInvestors = [
    {
      name: "Kunal Shah",
      email: "kunal@cred.club",
      firm: "CRED / Angel",
      stage: "Seed",
      notes: "Interested in fintech and consumer SaaS. Built CRED and FreeCharge.",
      tags: ["fintech", "consumer", "angel"],
      status: "not_contacted",
    },
    {
      name: "Anupam Mittal",
      email: "anupam@shaadi.com",
      firm: "People Group",
      stage: "Pre-Seed",
      notes: "Shark Tank India judge. Invests in early-stage consumer startups.",
      tags: ["consumer", "angel", "shark-tank"],
      lastContactedAt: new Date("2026-05-01T10:00:00Z"),
      status: "first_email_sent",
    },
    {
      name: "Nithin Kamath",
      email: "nithin@zerodha.com",
      firm: "Rainmatter",
      stage: "Seed",
      notes: "Backs fintech, climate, and health startups through Rainmatter fund.",
      tags: ["fintech", "climate", "fund"],
      lastContactedAt: new Date("2026-04-28T10:00:00Z"),
      status: "followup_scheduled",
    },
    {
      name: "Aman Gupta",
      email: "aman@boat.com",
      firm: "boAt / Angel",
      stage: "Pre-Seed",
      notes: "D2C expert. Interested in consumer electronics and lifestyle brands.",
      tags: ["d2c", "consumer", "angel"],
      lastContactedAt: new Date("2026-05-03T10:00:00Z"),
      status: "replied",
    },
    {
      name: "Vineeta Singh",
      email: "vineeta@sugar.fit",
      firm: "SUGAR Cosmetics",
      stage: "Seed",
      notes: "Backs women-led and D2C startups. Strong operator investor.",
      tags: ["d2c", "women-led", "angel"],
      status: "interested",
    },
    {
      name: "Rajesh Sawhney",
      email: "rajesh@gsf.org",
      firm: "GSF Accelerator",
      stage: "Pre-Seed",
      notes: "Runs GSF accelerator. Deep tech and SaaS focus.",
      tags: ["saas", "deep-tech", "accelerator"],
      lastContactedAt: new Date("2026-04-15T10:00:00Z"),
      status: "rejected",
    },
  ];

  for (const inv of demoInvestors) {
    await prisma.investor.create({
      data: { ...inv, tags: JSON.stringify(inv.tags) },
    });
  }

  const investors = await prisma.investor.findMany();

  if (investors.length > 1) {
    await prisma.email.create({
      data: {
        investorId: investors[1].id,
        subject: "HORECA billing — 40% GST leakage solved",
        body: "Hi Anupam,\n\nI noticed your investments in consumer-facing startups that solve real pain points for Indian SMBs.\n\nWe're building an automated GST billing platform for the HORECA sector — restaurants, hotels, and cafés. 40% of HORECA businesses underreport GST, leading to ₹12,000 Cr in annual leakage. Our tool plugs directly into POS systems and automates compliant invoicing.\n\nWe have 12 restaurant chains on pilot, processing ₹2.3 Cr monthly. Growing 30% MoM.\n\nWould love 15 minutes to walk you through our approach.\n\nBest,\nFounder",
        status: "sent",
        sentAt: new Date("2026-05-01T10:00:00Z"),
        approved: true,
        variant: 1,
        hookStyle: "Specific praise of thesis",
      },
    });

    await prisma.email.create({
      data: {
        investorId: investors[3].id,
        subject: "Quick follow-up — HORECA GST billing",
        body: "Hi Aman,\n\nFollowing up on my previous email about our HORECA GST billing platform.\n\nSince I last wrote, we've added 5 more restaurant chains and our MRR crossed ₹4L. The product-market fit signal is strong — 92% weekly active usage among pilots.\n\nWould a 15-minute call this week work?\n\nBest,\nFounder",
        status: "draft",
        approved: false,
        variant: 1,
        hookStyle: "Sharp metric",
      },
    });
  }

  await prisma.companyProfile.create({
    data: {
      founderName: "Sumit",
      founderRole: "CEO & Co-founder",
      companyName: "BillFlow",
      oneLiner: "Automated GST billing for India's HORECA sector",
      sector: "HORECA SaaS / Fintech",
      stage: "Pre-Seed",
      amountRaising: "₹1.5 Cr",
      roundStructure: "SAFE",
      alreadyCommitted: "₹40L (30%)",
      problem: "40% of HORECA businesses underreport GST, causing ₹12,000 Cr annual leakage",
      insight: "POS integration + automated invoice generation can make compliance effortless",
      product: "Live POS plugin for 3 POS systems; mobile dashboard for owners",
      differentiator: "Direct POS integration — no manual entry, 100% billing capture",
      revenue: "₹4L MRR",
      users: "17 restaurant chains, 85 outlets",
      growthRate: "30% MoM",
      loisWaitlist: "42 restaurants on waitlist",
      otherProof: "Selected for Razorpay Rize accelerator",
      tamSam: "₹8,000 Cr TAM (India HORECA compliance software), ₹1,200 Cr SAM",
      comparableExits: "Posist ($50M Series C), Petpooja ($15M Series B)",
    },
  });
}
