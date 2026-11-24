export type Rule = {
  pattern: RegExp;
  points: number;
  reason: string;
};

type ContextRule = {
  pattern: RegExp;
  phrase: string;
  reason: string;
  boost: number;
};

export const JOB_RULES: Rule[] = [
  {
    pattern: /training fee|pay.{0,20}(fee|deposit)|refundable/,
    points: 35,
    reason: "Asks you to pay money. Real companies never charge for jobs.",
  },
  {
    pattern: /[\w.-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/,
    points: 25,
    reason: "Uses a free email instead of a company email.",
  },
  {
    pattern: /no interview|without interview|direct selection|instant (joining|selection)/,
    points: 25,
    reason: "Promises a job without an interview.",
  },
  {
    pattern: /(earn|income|salary|pay).{0,35}(₹|rs\.?|inr)?\s*\d[\d,]{3,}/,
    points: 20,
    reason: "Promises unusually high pay without enough detail about the job.",
  },
  {
    pattern: /\d[\d,]{3,}\s*(per|\/|a)\s*(day|week|month)/,
    points: 15,
    reason: "Promises a large daily, weekly or monthly income.",
  },
  {
    pattern: /2 hours|part[- ]time|data entry|typing job/,
    points: 10,
    reason: "Advertises easy or flexible work, a common hook in fake job offers.",
  },
  {
    pattern: /no experience|no qualification|anyone can apply|easy work|immediate joining|join immediately/,
    points: 15,
    reason: "Promises easy hiring with little or no experience required.",
  },
  {
    pattern: /within 24 hours|reply (now|immediately)|last chance|limited (seats|vacancies|positions)|apply (now|today)|hiring now/,
    points: 15,
    reason: "Creates pressure to act fast instead of giving you time to verify the employer.",
  },
  {
    pattern: /aadhaar|aadhar|pan card|passport copy/,
    points: 20,
    reason: "Asks for sensitive identity documents before proper hiring.",
  },
  {
    pattern: /laptop (deposit|charges)|courier charges|kit charges/,
    points: 25,
    reason: "Asks for money for equipment or courier delivery.",
  },
];

export const AD_RULES: Rule[] = [
  {
    pattern: /you (have )?(won|been selected)|congratulations.{0,40}(winner|won|prize)|lucky draw/,
    points: 35,
    reason: "Says you won something you never entered for.",
  },
  {
    pattern: /(free|win).{0,15}(iphone|laptop|smartphone|gift card|bike)/,
    points: 25,
    reason: "Offers an expensive item for free.",
  },
  {
    pattern: /(\b[5-9]\d|100)\s*%\s*(off|discount)/,
    points: 20,
    reason: "Uses an unrealistically high discount.",
  },
  {
    pattern: /100% guaranteed|guaranteed (returns|profit|income)|double your money|no risk/,
    points: 35,
    reason: "Promises guaranteed profit. No real investment is risk-free.",
  },
  {
    pattern: /bit\.ly|tinyurl|t\.co\/|goo\.gl|cutt\.ly|shorturl/,
    points: 20,
    reason: "Uses a shortened link that hides the real website.",
  },
  {
    pattern: /click (here|the link|below).{0,30}(claim|win|collect|verify)|claim (your )?(prize|reward|gift)/,
    points: 25,
    reason: "Pushes you to click a link to claim something.",
  },
  {
    pattern: /only today|hurry|offer ends (in|soon|tonight)|limited stock|last \d+ (pieces|items)/,
    points: 15,
    reason: "Uses fake urgency to rush your decision.",
  },
  {
    pattern: /kyc (update|expired)/,
    points: 25,
    reason: "Uses a KYC warning to pressure you into an immediate action.",
  },
  {
    pattern: /delivery (charge|fee)|shipping (charge|fee)|pay .{0,15}(to receive|to claim)/,
    points: 25,
    reason: "Asks you to pay a fee to receive a free gift.",
  },
];

const TIER_1_RULES: ContextRule[] = [
  {
    pattern: /\bi\s*(?:am|'m)\s+a\s+scammer\b/,
    phrase: "I am a scammer",
    reason: "The message directly states malicious scam intent.",
    boost: 100,
  },
  {
    pattern: /\b(?:will\s+)?scam\s+you\b/,
    phrase: "scam you",
    reason: "The message directly threatens or promises to scam someone.",
    boost: 100,
  },
  {
    pattern: /\b(?:give|share|send)(?:\s+me)?\s+(?:your\s+)?bank\s+details\b/,
    phrase: "request for bank details",
    reason: "Requests bank details directly from the reader.",
    boost: 100,
  },
  {
    pattern: /\b(?:share|send)(?:\s+your)?\s+otp\b/,
    phrase: "share or send OTP",
    reason: "Requests a one-time password, which should never be shared.",
    boost: 100,
  },
  {
    pattern: /\bcvv\b/,
    phrase: "CVV",
    reason: "Mentions a card security code that must remain private.",
    boost: 100,
  },
  {
    pattern: /\bupfront\s+payment\b/,
    phrase: "upfront payment",
    reason: "Requests payment before the promised service or job.",
    boost: 100,
  },
  {
    pattern: /\bpay\s+(?:the\s+)?registration\s+fee\b/,
    phrase: "pay registration fee",
    reason: "Requests a registration payment for a job or opportunity.",
    boost: 100,
  },
  {
    pattern: /\bsecurity\s+deposit\s+required\b/,
    phrase: "security deposit required",
    reason: "Requires a security deposit before a job can begin.",
    boost: 100,
  },
  {
    pattern: /\btelegram\s+task\b/,
    phrase: "Telegram task",
    reason: "Uses a task-based Telegram setup commonly seen in job scams.",
    boost: 100,
  },
  {
    pattern: /\bwhatsapp\s+hr\b/,
    phrase: "WhatsApp HR",
    reason: "Uses an informal WhatsApp HR contact as the main hiring channel.",
    boost: 100,
  },
];

const TIER_2_RULES: ContextRule[] = [
  { pattern: /\bbank\b/, phrase: "bank", reason: "The message mentions banking, which needs context.", boost: 6 },
  { pattern: /\bpayment\b/, phrase: "payment", reason: "The message mentions payment, which needs context.", boost: 6 },
  { pattern: /\bdeposit\b/, phrase: "deposit", reason: "The message mentions a deposit, which needs context.", boost: 7 },
  { pattern: /\bfee\b/, phrase: "fee", reason: "The message mentions a fee, which needs context.", boost: 7 },
  { pattern: /\bwhatsapp\b/, phrase: "WhatsApp", reason: "The message mentions WhatsApp, which needs context.", boost: 6 },
  { pattern: /\btelegram\b/, phrase: "Telegram", reason: "The message mentions Telegram, which needs context.", boost: 6 },
  { pattern: /\burgent\b/, phrase: "urgent", reason: "The message uses urgency, which needs context.", boost: 7 },
  { pattern: /\bwork\s+from\s+home\b/, phrase: "work from home", reason: "The message advertises remote work, which needs context.", boost: 6 },
];

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type CheckResult = {
  score: number;
  level: RiskLevel;
  reasons: string[];
  baseReasons: string[];
  baseScore: number;
  tier1Matches: string[];
  tier2Matches: string[];
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

function getBaseMatches(text: string, rules: Rule[]): Rule[] {
  return rules.filter((rule) => rule.pattern.test(text));
}

function getContextMatches(text: string, rules: ContextRule[]): ContextRule[] {
  return rules.filter((rule) => rule.pattern.test(text));
}

export function checkText(text: string, rules: Rule[]): CheckResult {
  const normalized = normalizeText(text);
  const baseMatches = getBaseMatches(normalized, rules);
  const tier1Matches = getContextMatches(normalized, TIER_1_RULES);
  const tier2Matches = getContextMatches(normalized, TIER_2_RULES);
  const baseScore = baseMatches.reduce((total, rule) => total + rule.points, 0);
  const tier2Score = tier2Matches.reduce((total, rule) => total + rule.boost, 0);
  const contextualScore = Math.min(baseScore + tier2Score, 100);
  const score = tier1Matches.length >= 2
    ? Math.min(100, Math.max(95, contextualScore))
    : tier1Matches.length === 1
      ? Math.min(100, Math.max(85, contextualScore))
      : contextualScore;
  const baseReasons = baseMatches.map((rule) => rule.reason);
  const tier1Reasons = tier1Matches.map((match) => `Tier 1: ${match.phrase} — ${match.reason}`);
  const tier2Reasons = tier2Matches.map((match) => `Tier 2: ${match.phrase} — ${match.reason}`);

  return {
    score,
    level: score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW",
    reasons: [...tier1Reasons, ...tier2Reasons, ...baseReasons],
    baseReasons,
    baseScore,
    tier1Matches: tier1Matches.map((match) => match.phrase),
    tier2Matches: tier2Matches.map((match) => match.phrase),
  };
}
