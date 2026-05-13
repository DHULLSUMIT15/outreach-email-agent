// ============================================
// AI Prompt Templates
// ============================================

import { CompanyProfile, EmailConfig } from "./types";

export function buildColdEmailPrompt(
  profile: CompanyProfile,
  investorName: string,
  investorFirm: string,
  investorNotes: string,
  config: EmailConfig
): string {
  const toneMap = {
    formal: "Formal Indian English — professional, respectful of seniority",
    conversational: "Conversational — friendly, founder-to-founder",
    bold: "Bold founder-voice — confident, direct, numbers-driven",
    technical: "Technical — detailed, data-heavy, for domain experts",
  };

  const lengthMap = {
    short: "Short — under 120 words",
    medium: "Medium — 150-200 words",
    long: "Long — 220-280 words",
  };

  return `You are an expert investor-relations copywriter who has helped Indian and global founders raise from angel investors. You write cold outreach emails that get high reply rates because they are personalized, specific, founder-honest, and respectful of an investor's time.

Generate ${config.variants} personalized cold email variant(s) for this investor.

## FOUNDER & COMPANY
- Founder: ${profile.founderName} (${profile.founderRole})
- Company: ${profile.companyName}
- One-liner: ${profile.oneLiner}
- Sector: ${profile.sector}
- Stage: ${profile.stage}
- Raising: ${profile.amountRaising} (${profile.roundStructure})
- Already committed: ${profile.alreadyCommitted}

## PRODUCT & WEDGE
- Problem: ${profile.problem}
- Insight: ${profile.insight}
- Product: ${profile.product}
- Differentiator: ${profile.differentiator}

## TRACTION
- Revenue: ${profile.revenue}
- Users: ${profile.users}
- Growth: ${profile.growthRate}
- LOIs/Waitlist: ${profile.loisWaitlist}
- Other proof: ${profile.otherProof}

## MARKET
- TAM/SAM: ${profile.tamSam}
- Comparable exits: ${profile.comparableExits}

## THE INVESTOR
- Name: ${investorName}
- Firm: ${investorFirm}
- Context/Notes: ${investorNotes}

## CONFIG
- Tone: ${toneMap[config.tone]}
- Length: ${lengthMap[config.length]}
- Hook style: ${config.hookStyle}
- Structure: ${config.structure}
- CTA style: ${config.ctaStyle}

## RULES
1. Never invent numbers, logos, quotes, or customer names.
2. No flattery in the first line. Open with substance.
3. Subject line ≤ 7 words. No ALL CAPS, no emojis.
4. First sentence must answer "why are you in my inbox?"
5. State the ask in ONE sentence.
6. Default reading level: Grade 7-8. Short sentences.
7. Sign off with full name + role + company.

## OUTPUT FORMAT (respond in JSON)
Return a JSON array of variants:
[
  {
    "variant": 1,
    "subject": "...",
    "body": "...",
    "hookStyle": "...",
    "whyThisWorks": "...",
    "risk": "..."
  }
]

Only return the JSON array, no other text.`;
}

export function buildFollowUpPrompt(
  profile: CompanyProfile,
  investorName: string,
  previousEmail: string,
  sequenceNumber: number
): string {
  return `Generate a short, professional investor follow-up email.

Context:
- Founder (${profile.founderName} from ${profile.companyName}) already sent an initial pitch.
- Investor (${investorName}) has not replied.
- This is follow-up #${sequenceNumber}.
- Tone should be respectful, concise, confident.
- Do not sound desperate.
- Include a soft CTA.
- Keep under 120 words.
- Add NEW information — a new metric, milestone, or angle. Never just "bumping this."

Startup details:
- Company: ${profile.companyName}
- What we do: ${profile.oneLiner}
- Revenue: ${profile.revenue}
- Users: ${profile.users}
- Growth: ${profile.growthRate}

Previous email subject & body:
${previousEmail}

## OUTPUT FORMAT (respond in JSON)
{
  "subject": "...",
  "body": "..."
}

Only return the JSON object, no other text.`;
}

export function buildPersonalizationScorePrompt(
  emailBody: string,
  investorName: string,
  investorNotes: string
): string {
  return `Score this investor outreach email for personalization on a scale of 0-10.

The email is to: ${investorName}
Investor context: ${investorNotes}

Email:
${emailBody}

Criteria:
- Does it reference something specific about this investor? (thesis, portfolio, public statements)
- Could this email be sent to 50 other investors without changing anything? (if yes, score low)
- Is the opening line substance-driven, not generic?
- Is there a clear, specific reason why THIS investor is the right fit?

## OUTPUT FORMAT (respond in JSON)
{
  "score": 7,
  "feedback": "...",
  "genericSentences": ["any sentences that fail the swap test"]
}

Only return the JSON object, no other text.`;
}
