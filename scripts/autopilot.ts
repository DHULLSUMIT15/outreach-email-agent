import prisma from "../app/lib/prisma";
import nodemailer from "nodemailer";
import Imap from "imap-simple";
import { simpleParser } from "mailparser";
import dotenv from "dotenv";

dotenv.config();

// In local mode, we need to manually pass credentials to the script or pull them.
// We will instruct the user to configure these in an .env file or just hardcode for local testing.

async function runAutopilot() {
  console.log("🚀 Starting Founder Leads Autopilot Engine...");
  console.log("Waiting for configurations from Zoho...");

  // Normally we fetch this from the database or env. 
  // Since you store it in localStorage in the browser, you must provide it here.
  const ZOHO_USER = process.env.ZOHO_USER;
  const ZOHO_PASS = process.env.ZOHO_PASS;

  if (!ZOHO_USER || !ZOHO_PASS) {
    console.error("❌ ERROR: ZOHO_USER and ZOHO_PASS environment variables are required.");
    console.error("Run the script like this: ZOHO_USER='youremail@zoho.com' ZOHO_PASS='your_app_password' npm run autopilot");
    process.exit(1);
  }

  const imapConfig = {
    imap: {
      user: ZOHO_USER,
      password: ZOHO_PASS,
      host: "imap.zoho.in", // Adjust to imap.zoho.com if you use .com
      port: 993,
      tls: true,
      authTimeout: 3000,
      tlsOptions: { rejectUnauthorized: false },
    },
  };

  const smtpTransporter = nodemailer.createTransport({
    host: "smtp.zoho.in", // Adjust if using .com
    port: 465,
    secure: true,
    auth: {
      user: ZOHO_USER,
      pass: ZOHO_PASS,
    },
  });

  async function checkReplies() {
    console.log("🔍 Checking Zoho Inbox for investor replies...");
    let connection;
    try {
      connection = await Imap.connect(imapConfig);
      await connection.openBox("INBOX");

      // Search for unseen emails
      const searchCriteria = ["UNSEEN"];
      const fetchOptions = { bodies: ["HEADER", "TEXT"], markSeen: true };
      const messages = await connection.search(searchCriteria, fetchOptions);

      for (const item of messages) {
        const all = item.parts.find((p) => p.which === "HEADER");
        if (!all) continue;
        
        const id = item.attributes.uid;
        const idHeader = "Imap-Id: " + id + "\r\n";
        
        const mail = await simpleParser(idHeader + all.body);
        const fromEmail = mail.from?.value[0]?.address?.toLowerCase();

        if (fromEmail) {
          // Check if this sender is an investor in our database
          const investor = await prisma.investor.findFirst({
            where: { email: { equals: fromEmail } }
          });

          if (investor) {
            console.log(`✅ Received reply from investor: ${investor.name} (${fromEmail})`);
            
            // Mark investor as replied
            await prisma.investor.update({
              where: { id: investor.id },
              data: { status: "replied" }
            });

            // STOP all sequences for this investor
            await prisma.followUp.updateMany({
              where: { investorId: investor.id },
              data: { stopped: true }
            });
            console.log(`🛑 Successfully stopped all automated follow-ups for ${investor.name}`);
          }
        }
      }
    } catch (err) {
      console.error("Error checking IMAP:", err);
    } finally {
      if (connection) connection.end();
    }
  }

  async function sendScheduledFollowUps() {
    console.log("⏰ Checking for pending follow-ups that need sending...");
    const now = new Date();
    
    // Find followups that are approved, not sent, not stopped, and time has passed
    const pending = await prisma.followUp.findMany({
      where: {
        sentAt: null,
        stopped: false,
        approved: true, // It must be manually approved or you can remove this to fully automate
        nextSendDate: { lte: now }
      },
      include: { investor: true, email: true }
    });

    if (pending.length === 0) {
      console.log("💤 No follow-ups due at this time.");
      return;
    }

    const profile = await prisma.companyProfile.findFirst();
    const senderName = profile?.founderName ? `${profile.founderName} | ${profile.companyName}` : ZOHO_USER;

    for (const fu of pending) {
      console.log(`🚀 Sending automated follow-up #${fu.sequenceNumber} to ${fu.investor.email}...`);
      try {
        const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2,9)}@${ZOHO_USER!.split("@")[1]}>`;
        
        await smtpTransporter.sendMail({
          from: `"${senderName}" <${ZOHO_USER}>`,
          to: fu.investor.email,
          subject: fu.subject,
          text: fu.body,
          html: `<div style="font-family: Arial, sans-serif; font-size: 14px;">${fu.body.replace(/\n/g, "<br>")}</div>`,
          headers: { "Message-ID": messageId }
        });

        // Mark as sent
        await prisma.followUp.update({
          where: { id: fu.id },
          data: { sentAt: new Date() }
        });
        
        // Mark investor status
        await prisma.investor.update({
          where: { id: fu.investorId },
          data: { status: "followup_scheduled" }
        });

        console.log(`✅ Successfully sent to ${fu.investor.email}`);

        // GENERATE THE NEXT RECURRING FOLLOW-UP AUTOMATICALLY
        // If you want it to recur indefinitely until reply:
        const nextDate = new Date();
        // Recur every 2 days as an example
        nextDate.setDate(nextDate.getDate() + 2); 
        
        await prisma.followUp.create({
          data: {
            emailId: fu.emailId,
            investorId: fu.investorId,
            sequenceNumber: fu.sequenceNumber + 1,
            frequency: "recurring",
            nextSendDate: nextDate,
            stopped: false,
            subject: `Re: ${fu.email.subject}`,
            body: `Hi ${fu.investor.name},\n\nJust bumping this to the top of your inbox.\n\nBest,\n${profile?.founderName || "Founder"}`,
            approved: true, // Auto-approved for true recurring
            sentAt: null
          }
        });

      } catch (err) {
        console.error(`❌ Failed to send to ${fu.investor.email}`, err);
      }
    }
  }

  // Run immediately on start
  await checkReplies();
  await sendScheduledFollowUps();

  // Then run every 2 minutes forever
  setInterval(async () => {
    await checkReplies();
    await sendScheduledFollowUps();
  }, 2 * 60 * 1000);
}

runAutopilot();
