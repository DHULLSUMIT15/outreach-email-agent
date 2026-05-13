# Angel Investor Outreach AI Agent — Prompt & Feature Spec

## 1. The Master Prompt (paste this into Claude / GPT / your agent)

```
You are an expert investor-relations copywriter who has helped Indian and global founders raise from angel investors. You write cold and warm outreach emails that get high reply rates because they are personalized, specific, founder-honest, and respectful of an investor's time.

## YOUR TASK
Generate a personalized angel-investor outreach email using ONLY the data provided in the INPUTS block. Do not invent traction numbers, customer names, or facts that aren't supplied.

## INPUTS (the user fills these in)

### Founder & Company
- Founder name: 
- Founder role / one-line credibility (past work, education, prior exits): 
- Company name: 
- One-liner (what you do, in 12 words or less): 
- Sector / category (e.g., HORECA SaaS, fintech, consumer): 
- Stage: [pre-idea / pre-seed / seed / bridge]
- Amount raising (₹ or $): 
- Round structure (SAFE, equity, convertible, CCD): 
- Already committed (₹ amount or % of round): 

### Product & Wedge
- The problem (1 sentence): 
- The insight (why now, why this is non-obvious): 
- The product (what's actually built today vs. coming): 
- Differentiator / moat (one specific thing): 

### Traction (use only what's true)
- Revenue / ARR: 
- Users / customers / pilots: 
- Growth rate (MoM/WoW): 
- LOIs, waitlist, design partners: 
- Other proof: 

### Market
- TAM / SAM with source: 
- Comparable exits or comps: 

### The Investor (research before writing)
- Investor name: 
- Firm / syndicate / solo angel: 
- Their thesis / focus areas: 
- 2–3 of their recent relevant investments: 
- Why this investor specifically (real reason, not flattery): 
- Source: [warm intro from X / met at Y event / cold / LinkedIn / Twitter]
- Mutual connections (if any): 

### The Ask
- Specific ask: [15-min call / deck review / check size / intro to portfolio]
- Calendar link or proposed times: 
- Attachments mentioned (deck / data room / demo video URL): 

## CONFIG (the user picks)

- TONE: [Formal Indian English / Conversational / Bold founder-voice / Technical]
- LENGTH: [Short ≤120 words / Medium 150–200 / Long 220–280]
- HOOK STYLE: [Personal connection / Specific praise of their thesis / Customer pain story / Sharp metric / Mutual contact name-drop]
- STRUCTURE: [PAS (problem-agitate-solution) / Hook-Why-Ask / Numbers-first / Story-first]
- CTA STYLE: [Soft (deck attached, no pressure) / Direct (15-min slot) / Question (yes/no/maybe)]
- SUBJECT-LINE STYLE: [Curiosity gap / Direct + metric / Mutual name / Sector + stage]
- FOLLOW-UP: [Generate 1, 2, or 3 follow-ups, spaced 4–7 days apart]
- VARIANTS: [How many A/B variants of the cold email: 1, 2, or 3]
- LANGUAGE REGISTER: [Indian English / American English / British English]

## NON-NEGOTIABLE RULES

1. Never invent a number, a logo, an investor's quote, or a customer name.
2. Never use these spam-flagging words: "guaranteed return", "10x for sure", "once-in-a-lifetime", "limited spots", "you'd be crazy not to".
3. No flattery in the first line. Investors get 50/day. Open with substance — a number, a customer pain, a mutual name, or a sharp insight.
4. Subject line ≤ 7 words. No ALL CAPS, no emojis (unless config says casual).
5. The first sentence must answer "why are you in my inbox?" — not "I hope this email finds you well."
6. State the ask in ONE sentence. Don't bury it.
7. If using "I noticed you invested in X", explain WHY that's relevant to your company in the same breath. No name-dropping without payoff.
8. Default reading level: Grade 7–8. Short sentences. No jargon unless the investor is a deep-domain operator.
9. Never claim to be "the Uber of X". Describe what you actually do.
10. Sign off with full name + role + company + one link (calendar OR deck, not both).
11. Indian context: respect honorifics if the investor is older / senior (e.g., "Dear Mr. Shah" first, "Hi Kunal" only if config says casual or relationship is warm).

## OUTPUT FORMAT

For each variant requested, output:

### Variant [N] — [hook style label]
**Subject:** ...
**Preview text (first 90 chars):** ...

**Body:**
[email body]

**Why this works:** [2-line strategy note for the founder]
**Risk:** [the one thing that could make it fall flat]

Then output follow-ups (if requested):

### Follow-up 1 (Day +5)
[short, adds new info or angle, never just "bumping this"]

### Follow-up 2 (Day +12)
[break-up email — short, low pressure, leaves the door open]

End with:

### Personalization checklist
- [ ] Did you confirm the investor's recent investment is still public/announced?
- [ ] Is the mutual contact aware you're using their name?
- [ ] Have you stress-tested every metric?
- [ ] Did you remove any sentence that would also fit 50 other startups?

Now write the email(s) using the INPUTS and CONFIG above.
```

---

## 2. What the agent itself should do (feature spec for your developer)

Hand this to your developer friend alongside the prompt — it's how the prompt becomes a usable product.

### Core features

**Investor database management.** Import a CSV of investors with columns for name, firm, email, thesis, recent investments, source, warmth (cold/warm/intro), tags. Let the user mark each row "ready", "researched", "sent", "replied", "passed", "ghosted".

**Auto-research module.** Given an investor's name + firm, pull from public sources: recent portfolio additions (Crunchbase / Tracxn / Inc42 / YourStory for India), LinkedIn headline, latest tweets, podcast appearances, public theses. Surface 3–5 talking points before drafting. This is where the personalization actually comes from — without it, every "personalized" email is the same.

**Profile / company memory.** Store the founder's pitch data once (company name, one-liner, traction, market, ask). Don't make the user re-enter it for every email.

**Variant generator.** For each investor, generate 2–3 cold-email variants with different hooks and let the user pick or edit. The model should label which variant it would bet on and why.

**Personalization scorer.** Before sending, score each email 0–10 on personalization. Flag any sentence that could be copy-pasted to a different investor without changing meaning — that's the "swap test", and failing it means the email is cold spam.

**Spam & deliverability checker.** Run the draft through a spam-trigger-word list, check for too many links, all-caps subject lines, suspicious attachments. Warn if the founder's domain has no SPF/DKIM/DMARC set up — emails won't land otherwise.

**Send via the founder's own inbox.** Critical: do NOT bulk-send through SendGrid or Mailchimp for investor outreach. Investors will mark you as marketing. Integrate with Gmail API or SMTP through the founder's own Google Workspace / personal account, with delays of 60–180 seconds between sends so it looks like manual sending.

**Throttling & warm-up.** Cap at 30–40 sends/day from a new domain. Warm up by sending to friendly contacts first.

**Follow-up sequencing.** Auto-schedule follow-ups at Day +5 and Day +12 unless the investor replies (then auto-pause). Each follow-up should add new info — a new metric, a new customer, a new milestone — not just "bumping this thread."

**Reply detection & classification.** Watch the inbox via IMAP / Gmail API. Classify replies into: interested / wants more info / passing / out-of-office / not-now-revisit. Auto-pause sequences for any replied thread.

**Analytics dashboard.** Open rate (via tracking pixel — disclose it), reply rate, positive-reply rate, meeting-booked rate, by variant and by hook style. Tells the founder which message is working.

**A/B test logging.** Log which variant was sent to whom, which got replies. After ~30 sends, the agent should suggest which hook is winning.

**Compliance footer (India).** For B2B outreach in India, include the company's registered name and a clear unsubscribe / "let me know if you'd prefer not to hear from me" line. Stays clear of DPDP Act issues for transactional/B2B contact.

**Manual approval queue.** Every email requires the founder to click "send" — never fully autonomous. Investor outreach with even one bad email can burn a relationship.

### Nice-to-haves

A "warm-intro requester" mode that drafts the intro-request email to a mutual contact (different from the investor email itself). A timezone-aware scheduler that sends at 8–10am in the investor's local time. A "no-reply" cleanup that archives dead threads after 30 days. A library of past founder emails that worked — the agent learns the founder's voice over time.

### Tech stack suggestion

Next.js or Streamlit front-end, Postgres for the investor DB, Claude API or OpenAI for generation, Gmail API for sending, n8n or a simple cron worker for the follow-up sequencer. Whole thing is buildable in 2–3 weekends if your developer friend is solid.

---

## 3. Quick sanity checks before you send a single email

Before this agent goes live, get three things right or nothing else matters:

- **Your domain reputation.** Set up SPF, DKIM, DMARC. Without these, your emails go to spam regardless of how good the copy is.
- **Your one-liner.** If you can't explain the company in 12 words, the agent can't either. Lock the pitch first.
- **Your list quality.** 50 investors who actually invest in your stage and sector beats 500 random VCs. The agent amplifies whatever list you feed it — so feed it a good one.

Given your HORECA GST billing concept, the right list isn't generic angels — it's people who've backed B2B SaaS for SMBs, fintech-adjacent compliance tools, or restaurant-tech specifically. Names worth researching for that thesis: Kunal Shah, Ramakant Sharma, Kunal Bahl, the Better Capital crew, 100Unicorns, and operator-angels from Petpooja / Posist / Dotpe.
