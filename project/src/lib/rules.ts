export type Rule = {
  pattern: RegExp;
  points: number;
  reason: string;
};

export const JOB_RULES: Rule[] = [
  {
    pattern: /registration fee|training fee|security deposit|pay.{0,20}(fee|deposit)|refundable/,
    points: 40,
    reason: "Asks you to pay money. Real companies never charge for jobs.",
  },
  {
    pattern: /[\w.-]+@(gmail|yahoo|outlook|hotmail|rediffmail)\.com/,
    points: 25,
    reason: "Uses a free email (Gmail/Yahoo...) instead of a company email.",
  },
  {
    pattern: /whatsapp|telegram/,
    points: 15,
    reason: "Asks you to contact on WhatsApp/Telegram. Real HR uses official email.",
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
    pattern: /2 hours|part[- ]time|work from home|data entry|typing job/,
    points: 10,
    reason: "Advertises easy or flexible work, a common hook in fake job offers.",
  },
  {
    pattern: /no experience|no qualification|anyone can apply|easy work|immediate joining|join immediately/,
    points: 15,
    reason: "Promises easy hiring with little or no experience required.",
  },
  {
    pattern: /within 24 hours|reply (now|immediately)|last chance|limited (seats|vacancies|positions)|urgent|apply (now|today)|hiring now/,
    points: 15,
    reason: "Creates pressure to act fast instead of giving you time to verify the employer.",
  },
  {
    pattern: /aadhaar|aadhar|pan card|bank (account|details)|otp|passport copy/,
    points: 20,
    reason: "Asks for sensitive documents/bank details before any proper hiring.",
  },
  {
    pattern: /laptop (deposit|charges)|courier charges|kit charges/,
    points: 25,
    reason: "Asks for money for equipment/courier.",
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
    reason: "Unrealistically high discount (50% to 100% off).",
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
    reason: "Pushes you to click a link to 'claim' something.",
  },
  {
    pattern: /only today|hurry|offer ends (in|soon|tonight)|limited stock|last \d+ (pieces|items)/,
    points: 15,
    reason: "Fake urgency to rush your decision.",
  },
  {
    pattern: /otp|cvv|pin\b|card number|bank (details|account)|kyc (update|expired)/,
    points: 35,
    reason: "Asks for OTP/card/bank details. Never share these.",
  },
  {
    pattern: /delivery (charge|fee)|shipping (charge|fee)|pay .{0,15}(to receive|to claim)/,
    points: 25,
    reason: "Asks you to pay a fee to receive a 'free' gift.",
  },
];

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type CheckResult = {
  score: number;
  level: RiskLevel;
  reasons: string[];
};

export function checkText(text: string, rules: Rule[]): CheckResult {
  const lower = text.toLowerCase().replace(/\s+/g, " ");
  const score = rules
    .filter((rule) => rule.pattern.test(lower))
    .reduce((total, rule) => total + rule.points, 0);

  return {
    score: Math.min(score, 100),
    level: score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW",
    reasons: rules.filter((rule) => rule.pattern.test(lower)).map((rule) => rule.reason),
  };
}
