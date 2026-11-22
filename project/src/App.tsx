import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleCheck,
  FileText,
  History,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Megaphone,
  MessageCircleQuestion,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { AD_RULES, JOB_RULES, checkText, type CheckResult } from "@/lib/rules";
import { extractImageText, extractPdfText } from "@/lib/extract";

type Kind = "job" | "ad";
const ACCEPTED = "image/png,image/jpeg,image/webp,application/pdf";

const SAMPLES: Record<Kind, string> = {
  job: `Congratulations! You are selected for the Data Entry position at Infotech Solutions.
Salary: Rs 45,000 per month for 2 hours of daily work from home.
No interview required - direct selection. Send your Aadhaar and bank account
details to hr.infotech@gmail.com and reply within 24 hours to confirm.`,
  ad: `Congratulations! You have WON a free iPhone 15 in our lucky draw!
100% OFF - claim your prize now, offer ends tonight. Only today!
Click the link below to collect your gift. Hurry, limited stock!
Pay a small delivery fee to receive your reward.`,
};

const LEVEL_STYLES: Record<CheckResult["level"], { ring: string; badge: string; text: string }> = {
  HIGH: { ring: "stroke-red-500", badge: "bg-red-100 text-red-800", text: "text-red-800" },
  MEDIUM: { ring: "stroke-amber-500", badge: "bg-amber-100 text-amber-800", text: "text-amber-800" },
  LOW: { ring: "stroke-emerald-500", badge: "bg-emerald-100 text-emerald-800", text: "text-emerald-800" },
};

type HistoryEntry = { kind: Kind; preview: string; result: CheckResult; at: string };

const FAQS: { question: string; answer: string[] }[] = [
  {
    question: "How can I tell if a text message is a scam?",
    answer: [
      "Most scam messages follow the same recipe: a big reward or a scary problem, plus pressure to act fast. Look out for these signs:",
      "• You won a prize, lottery or gift — but you never entered anything.\n• A job that pays a lot for very little work, with no interview needed.\n• They ask for money first — a fee, deposit, delivery charge or tax to receive your reward.\n• The message creates panic: your account will be blocked today, KYC expired, act within 24 hours.\n• A link that looks almost right but not quite.\n• They ask for an OTP, card number or bank details.",
      "Quick test: do not tap any link in the message. Open the company’s official app or type their website yourself and check there.",
    ],
  },
  {
    question: "What is smishing?",
    answer: [
      "Smishing means a scam that arrives by SMS. It is a mix of SMS and phishing — tricking you into handing over money or personal details.",
      "The same trick can also arrive on WhatsApp, email and social media. Never share OTPs, card numbers or passwords with anyone who contacts you unexpectedly.",
    ],
  },
  {
    question: "I received a scam text — what should I do?",
    answer: [
      "Do not panic and do not reply. Do not tap links, call numbers in the message, or share your OTP, card number, CVV, password or Aadhaar details.",
      "Take a screenshot, report online fraud at cybercrime.gov.in, call 1930 immediately if money or sensitive details were shared, report spam SMS to 1909, and contact your bank using the number on your card.",
    ],
  },
];

function FaqItem({ faq, isOpen, onToggle }: { faq: (typeof FAQS)[number]; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-[#e5e2ef] last:border-0">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 py-5 text-left" aria-expanded={isOpen}>
        <span className="text-sm font-semibold text-[#201b42] sm:text-base">{faq.question}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-[#4d32bd] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="space-y-3 pb-5">
            {faq.answer.map((paragraph, index) => <p key={index} className="whitespace-pre-line text-sm leading-relaxed text-[#5f5b72]">{paragraph}</p>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreGauge({ result }: { result: CheckResult }) {
  const style = LEVEL_STYLES[result.level];
  const circumference = 2 * Math.PI * 52;
  const filled = (result.score / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-[#eeeaf7]" />
        <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - filled} className={`${style.ring} transition-all duration-700 ease-out`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${style.text}`}>{result.score}%</span>
        <span className="text-xs font-medium text-[#777287]">risk score</span>
      </div>
    </div>
  );
}

function ResultCard({ kind, result }: { kind: Kind; result: CheckResult }) {
  const style = LEVEL_STYLES[result.level];
  const isHigh = result.level === "HIGH";

  return (
    <div className="rounded-[28px] border border-[#e3dfef] bg-white p-5 shadow-[0_18px_50px_rgba(38,27,87,0.08)] sm:p-7">
      <div className="flex flex-col items-center gap-5 sm:flex-row">
        <ScoreGauge result={result} />
        <div className="flex-1 text-center sm:text-left">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${style.badge}`}>
            {isHigh ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            {result.level} RISK
          </span>
          <p className="mt-3 text-lg font-bold text-[#201b42]">{isHigh ? "This looks like a scam." : result.level === "MEDIUM" ? "This looks suspicious." : "No common red flags found."}</p>
          <p className="mt-1 text-sm leading-relaxed text-[#686377]">
            {isHigh ? `This ${kind === "job" ? "job offer" : "promotion"} shows classic scam signs. Do not pay anything or share documents.` : result.level === "MEDIUM" ? "Some red flags were found. Verify with official sources before responding." : "This does not guarantee it is safe — always double-check with the official website."}
          </p>
        </div>
      </div>
      <div className="mt-6 border-t border-[#ece9f3] pt-5">
        <h3 className="text-sm font-bold text-[#201b42]">Why this score</h3>
        {result.reasons.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {result.reasons.map((reason) => <li key={reason} className="flex items-start gap-2.5 text-sm text-[#5f5b72]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#e29a26]" /><span>{reason}</span></li>)}
          </ul>
        ) : <p className="mt-2 text-sm text-[#686377]">None of the known red-flag patterns appeared in the text we could read.</p>}
      </div>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="relative mx-auto h-[470px] w-[236px] rotate-[-5deg] sm:h-[530px] sm:w-[270px]">
      <div className="absolute inset-0 rounded-[2.7rem] border-[7px] border-[#171436] bg-[#171436] p-1.5 shadow-[18px_24px_45px_rgba(20,14,66,0.34)]">
        <div className="relative h-full overflow-hidden rounded-[2.2rem] bg-[#fbfaf7]">
          <div className="mx-auto h-6 w-28 rounded-b-2xl bg-[#171436]" />
          <div className="px-5 pt-6">
            <div className="flex items-center justify-between text-[9px] font-bold text-[#252044]"><span>9:41</span><span>•••</span></div>
            <div className="mt-9 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eae3ff] text-[#4d32bd]"><Search className="h-7 w-7" /></div><h3 className="mt-4 text-lg font-extrabold tracking-tight text-[#211b48]">Check a message</h3><p className="mt-2 text-[10px] leading-relaxed text-[#777287]">Upload, paste or describe anything that feels suspicious.</p></div>
            <div className="mt-7 rounded-2xl border border-[#e5e1ed] bg-white p-3 shadow-sm"><div className="flex items-center gap-2 text-[10px] font-semibold text-[#4d32bd]"><Upload className="h-3.5 w-3.5" /> Add a screenshot</div><div className="mt-3 h-16 rounded-xl border border-dashed border-[#cfc6ee] bg-[#faf8ff]" /></div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-[#5535d5] py-3 text-[10px] font-bold text-white shadow-lg shadow-[#5535d5]/25"><Search className="h-3.5 w-3.5" /> Check for scams</button>
            <div className="mt-5 flex items-center justify-center gap-1 text-[9px] font-semibold text-[#5b5375]"><LockKeyhole className="h-3 w-3 text-[#4d32bd]" /> No sign-up needed</div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-around border-t border-[#eeeaf3] bg-white/90 py-4 text-[8px] font-semibold text-[#787287]"><span className="text-[#4d32bd]">Check</span><span>Learn</span><span>Safety</span></div>
        </div>
      </div>
      <div className="absolute -bottom-3 -right-8 rounded-2xl border border-[#dad1f2] bg-white px-4 py-3 shadow-xl"><div className="flex items-center gap-2 text-xs font-bold text-[#29224f]"><CircleCheck className="h-4 w-4 text-[#5a39ce]" /> Private by design</div><p className="mt-1 text-[10px] text-[#777287]">No account. No saved messages.</p></div>
    </div>
  );
}

export default function App() {
  const [kind, setKind] = useState<Kind>("job");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStage, setScanStage] = useState("");
  const [scanError, setScanError] = useState("");
  const [submitted, setSubmitted] = useState<{ kind: Kind; text: string } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file || file.type === "application/pdf") { setFilePreview(null); return; }
    const previewUrl = URL.createObjectURL(file);
    setFilePreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [file]);

  const result = useMemo(() => {
    if (!submitted || !submitted.text.trim()) return null;
    return checkText(submitted.text, submitted.kind === "job" ? JOB_RULES : AD_RULES);
  }, [submitted]);

  const recordCheck = (sourceText: string) => {
    setSubmitted({ kind, text: sourceText });
    setHistory((previous) => [{ kind, preview: sourceText.trim().slice(0, 80), result: checkText(sourceText, kind === "job" ? JOB_RULES : AD_RULES), at: new Date().toLocaleTimeString() }, ...previous].slice(0, 5));
  };

  const scanFile = async (selected: File) => {
    setScanError("");
    setSubmitted(null);
    setScanning(true);
    setScanProgress(0);
    setScanStage("Reading file...");
    try {
      const isPdf = selected.type === "application/pdf";
      const extracted = isPdf ? await extractPdfText(selected, setScanProgress) : await extractImageText(selected, setScanProgress);
      setScanStage("Analyzing text...");
      setScanProgress(100);
      if (!extracted.trim()) {
        setScanError(isPdf ? "No readable text was found in this PDF. Try a text-based PDF or upload a screenshot instead." : "No readable text was found in this image. Try a clearer or larger screenshot.");
        return;
      }
      setText(extracted);
      recordCheck(extracted);
    } catch {
      setScanError("Something went wrong while reading the file. Please try again.");
    } finally {
      setScanning(false);
      setScanStage("");
    }
  };

  const handleCheck = () => {
    if (file) { void scanFile(file); return; }
    if (text.trim()) recordCheck(text);
  };

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setText("");
      setSubmitted(null);
      setScanError("");
      setScanProgress(0);
    }
    event.target.value = "";
  };

  const handleClear = () => {
    setText("");
    setFile(null);
    setSubmitted(null);
    setScanError("");
    setScanProgress(0);
  };

  return (
    <div className="min-h-screen bg-[#fbfaf7] font-sans text-[#201b42]">
      <div className="border-b border-[#d8df72] bg-[#d8ed48] px-4 py-2 text-center text-[11px] font-bold tracking-wide text-[#282546] sm:text-xs">New: the quick guide to spotting fake job offers is here <span className="ml-2 underline underline-offset-2">Read the guide <ArrowRight className="inline h-3 w-3" /></span></div>

      <header className="sticky top-0 z-20 border-b border-[#eeeaf3] bg-[#fbfaf7]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <a href="#check" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#241d50] text-[#4d32bd]"><ShieldCheck className="h-5 w-5" /></span>
            <span><span className="block text-lg font-black tracking-tight text-[#211b48]">Fraud<span className="text-[#5a39ce]">Detector</span></span><span className="block text-[9px] font-bold uppercase tracking-[0.18em] text-[#878196]">by your side</span></span>
          </a>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#615c70] lg:flex">
            <a href="#check" className="text-[#211b48] transition-colors hover:text-[#5a39ce]">Check a scam</a>
            <a href="#product" className="transition-colors hover:text-[#5a39ce]">Product</a>
            <a href="#trends" className="transition-colors hover:text-[#5a39ce]">Scam trends</a>
            <a href="#about" className="transition-colors hover:text-[#5a39ce]">About</a>
          </nav>
          <div className="flex items-center gap-3"><span className="hidden items-center gap-1.5 text-xs font-bold text-[#686277] sm:flex"><LockKeyhole className="h-3.5 w-3.5 text-[#5a39ce]" /> No sign-up</span><a href="#check" className="rounded-full bg-[#5133c9] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#5133c9]/20 transition-transform hover:-translate-y-0.5">Quick check</a></div>
        </div>
      </header>

      <main>
        <section id="check" className="mx-auto max-w-5xl px-5 pb-20 pt-16 text-center sm:px-8 sm:pt-24">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#e9e3ff] text-[#5535d5] shadow-[12px_12px_0_#f5f1ff]"><Search className="h-10 w-10" strokeWidth={1.7} /></div>
          <p className="mt-8 text-xs font-extrabold uppercase tracking-[0.22em] text-[#6b5ab8]">A second opinion, in seconds</p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-[1.04] tracking-[-0.04em] text-[#211b48] sm:text-6xl">Is this a scam?<br /><span className="text-[#5133c9]">Run a quick check.</span></h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#706b7d] sm:text-lg">Free, simple and private. Upload a screenshot, paste a message, or describe what happened — no sign-up needed.</p>

          <div className="mx-auto mt-10 max-w-3xl rounded-[30px] border border-[#e2ddef] bg-white p-4 text-left shadow-[0_22px_65px_rgba(58,39,132,0.12)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeaf4] pb-4">
              <div className="flex rounded-full bg-[#f6f3fc] p-1">
                {[{ id: "job" as Kind, label: "Job offer", icon: Briefcase }, { id: "ad" as Kind, label: "Promotion", icon: Megaphone }].map((tab) => <button key={tab.id} onClick={() => setKind(tab.id)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all ${kind === tab.id ? "bg-[#211b48] text-white shadow-md" : "text-[#777287] hover:text-[#5133c9]"}`}><tab.icon className="h-3.5 w-3.5" />{tab.label}</button>)}
              </div>
              <button onClick={() => setText(SAMPLES[kind])} className="text-xs font-bold text-[#5a39ce] transition-colors hover:text-[#27186e]">Try a suspicious example <ArrowUpRight className="inline h-3.5 w-3.5" /></button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-[0.8fr_1.2fr]">
              <div>
                <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={onFileChange} className="hidden" />
                {file ? <div className="overflow-hidden rounded-2xl border border-[#d4c9f4] bg-[#faf8ff]">{filePreview ? <img src={filePreview} alt="Uploaded message preview" className="h-36 w-full object-cover" /> : <div className="flex h-36 items-center justify-center text-[#5a39ce]"><FileText className="h-12 w-12" /></div>}<div className="flex items-center gap-2 border-t border-[#e5def5] px-3 py-2.5"><ImageIcon className="h-4 w-4 text-[#5a39ce]" /><span className="min-w-0 flex-1 truncate text-xs font-semibold text-[#5c5670]">{file.name}</span><button onClick={() => fileInputRef.current?.click()} disabled={scanning} className="text-xs font-bold text-[#5a39ce] hover:text-[#2e1a88]">Change</button></div></div> : <button onClick={() => fileInputRef.current?.click()} className="flex min-h-[210px] w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#cfc4ef] bg-[#faf8ff] px-5 text-center transition-all hover:border-[#7559dc] hover:bg-[#f5f1ff]"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9e3ff] text-[#5535d5]"><Upload className="h-5 w-5" /></span><span className="text-sm font-bold text-[#28224e]">Upload image or screenshot</span><span className="text-xs leading-relaxed text-[#858095]">JPG, PNG, WEBP or PDF<br />Your file stays in this browser</span></button>}
              </div>
              <div><label htmlFor="offer-text" className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#706b7d]">Or paste the suspicious message</label><textarea id="offer-text" value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste text or tell us what happened..." rows={8} className="mt-2 min-h-[210px] w-full resize-none rounded-2xl border border-[#e1ddec] bg-[#fdfcff] px-4 py-3 text-sm leading-relaxed text-[#28224e] outline-none transition-colors placeholder:text-[#a19baa] focus:border-[#7358d7] focus:ring-4 focus:ring-[#7358d7]/10" /></div>
            </div>

            {scanning && <div className="mt-4 rounded-2xl border border-[#d8cdf7] bg-[#f6f2ff] px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-[#5a39ce]"><Loader2 className="h-4 w-4 animate-spin" />{scanStage || "Analyzing..."}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e4dcfa]"><div className="h-full rounded-full bg-[#5a39ce] transition-all duration-300" style={{ width: `${scanProgress}%` }} /></div></div>}
            {scanError && <div className="mt-4 flex items-start gap-2 rounded-2xl border border-[#f2d39b] bg-[#fff8e9] px-4 py-3 text-sm text-[#87601c]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{scanError}</div>}
            <button onClick={handleCheck} disabled={scanning || (!text.trim() && !file)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#5535d5] px-5 py-4 text-sm font-extrabold text-white shadow-xl shadow-[#5535d5]/25 transition-all hover:-translate-y-0.5 hover:bg-[#4828c2] disabled:cursor-not-allowed disabled:opacity-45">{scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{scanning ? "Checking..." : "Check for scams"}</button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-[#858095]"><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#5a39ce]" />No account needed</span><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#5a39ce]" />Private in your browser</span><span className="flex items-center gap-1.5"><CircleCheck className="h-3.5 w-3.5 text-[#5a39ce]" />Clear next steps</span></div>
            {submitted && <button onClick={handleClear} className="mx-auto mt-4 flex items-center gap-2 text-xs font-bold text-[#827b91] hover:text-[#5133c9]"><RotateCcw className="h-3.5 w-3.5" />Clear current check</button>}
          </div>
        </section>

        {result && submitted && <section className="mx-auto max-w-3xl px-5 pb-20 sm:px-8"><ResultCard kind={submitted.kind} result={result} /></section>}

        <section id="product" className="bg-[#211b48] px-5 py-20 text-white sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_0.95fr]">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#d8ed48]">How it works</p><h2 className="mt-5 max-w-xl text-4xl font-black leading-[1.05] tracking-[-0.035em] sm:text-5xl">A free scam check, whenever you need a second opinion.</h2><p className="mt-6 max-w-lg text-base leading-relaxed text-[#c8c4dc]">FraudDetector turns a suspicious message into a clear next step. It looks for pressure, payment requests, risky links and the patterns scammers use most.</p><div className="mt-10 space-y-5"><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d8ed48]"><Upload className="h-4 w-4" /></span><div><h3 className="font-bold">Submit something suspicious</h3><p className="mt-1 text-sm leading-relaxed text-[#aaa5c4]">Paste text or upload a screenshot of an email, job offer or chat.</p></div></div><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d8ed48]"><Search className="h-4 w-4" /></span><div><h3 className="font-bold">We check for scam signals</h3><p className="mt-1 text-sm leading-relaxed text-[#aaa5c4]">The checker reviews the wording and shows the red flags it found.</p></div></div><div className="flex gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#d8ed48]"><ShieldCheck className="h-4 w-4" /></span><div><h3 className="font-bold">Get a clear next step</h3><p className="mt-1 text-sm leading-relaxed text-[#aaa5c4]">Know what not to share, who to contact and how to report it in India.</p></div></div></div></div>
            <div className="relative min-h-[520px] rounded-[40px] bg-[#d8ed48] px-8 pb-10 pt-14 sm:px-12"><p className="absolute left-8 top-8 text-xs font-extrabold uppercase tracking-[0.18em] text-[#302958]">No sign-up. No judgement.</p><PhonePreview /></div>
          </div>
        </section>

        <section id="trends" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#6b5ab8]">Scam trends</p><h2 className="mt-3 text-3xl font-black tracking-tight text-[#211b48] sm:text-4xl">The tricks change. The warning signs don’t.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#777287]">A quick reminder of the patterns worth pausing for before you click, pay or reply.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3"><div className="rounded-3xl bg-[#f0ecff] p-6"><span className="text-4xl font-black text-[#5535d5]">01</span><h3 className="mt-7 text-lg font-extrabold text-[#2a2351]">Fake job offers</h3><p className="mt-2 text-sm leading-relaxed text-[#6d6680]">High pay, no interview, urgent joining and a request for a fee or personal documents.</p></div><div className="rounded-3xl bg-[#eaf3c2] p-6"><span className="text-4xl font-black text-[#53630c]">02</span><h3 className="mt-7 text-lg font-extrabold text-[#2a3a0f]">Prize and parcel scams</h3><p className="mt-2 text-sm leading-relaxed text-[#626b3c]">A surprise reward that needs a delivery fee, OTP or a quick click to claim it.</p></div><div className="rounded-3xl bg-[#f7e6e5] p-6"><span className="text-4xl font-black text-[#b34d4a]">03</span><h3 className="mt-7 text-lg font-extrabold text-[#472120]">Urgent bank messages</h3><p className="mt-2 text-sm leading-relaxed text-[#7b5c5c]">Threats about KYC, blocked accounts or suspicious activity asking you to verify now.</p></div></div></section>

        <section id="about" className="border-t border-[#eeeaf3] bg-white px-5 py-20 sm:px-8 sm:py-24"><div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-extrabold uppercase tracking-[0.22em] text-[#6b5ab8]">About FraudDetector</p><h2 className="mt-4 text-3xl font-black tracking-tight text-[#211b48]">Useful protection for ordinary moments.</h2><p className="mt-5 text-sm leading-relaxed text-[#706b7d]">You do not need an account or a technical background to use this. FraudDetector is made for the message that makes you pause — the job offer, prize notification, bank alert or WhatsApp request that feels a little too urgent.</p></div><div className="rounded-[28px] bg-[#faf8ff] p-6 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><div><LockKeyhole className="h-5 w-5 text-[#5535d5]" /><h3 className="mt-4 font-bold text-[#2b2453]">Private first</h3><p className="mt-2 text-sm leading-relaxed text-[#777287]">Your message is checked in this browser and is not saved as an account.</p></div><div><CircleCheck className="h-5 w-5 text-[#5535d5]" /><h3 className="mt-4 font-bold text-[#2b2453]">Clear, not clever</h3><p className="mt-2 text-sm leading-relaxed text-[#777287]">The result explains the warning signs in simple language.</p></div></div></div></div></section>

        {history.length > 0 && <section className="mx-auto max-w-5xl px-5 pb-16 sm:px-8"><div className="rounded-3xl border border-[#e4dfef] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-bold text-[#2b2453]"><History className="h-4 w-4 text-[#5a39ce]" />Recent checks</h2><button onClick={() => setHistory([])} className="flex items-center gap-1 text-xs font-bold text-[#827b91] hover:text-[#5133c9]"><Trash2 className="h-3.5 w-3.5" />Clear history</button></div><ul className="mt-3 divide-y divide-[#eeeaf3]">{history.map((entry, index) => <li key={`${entry.at}-${index}`} className="flex items-center gap-3 py-3"><span className={`inline-flex w-16 shrink-0 justify-center rounded-full px-2 py-1 text-[10px] font-bold ${LEVEL_STYLES[entry.result.level].badge}`}>{entry.result.level}</span><span className="min-w-0 flex-1 truncate text-sm text-[#5e586e]">{entry.preview}</span><span className="shrink-0 text-xs text-[#9c96a9]">{entry.at}</span></li>)}</ul></div></section>}

        <section className="mx-auto max-w-5xl px-5 pb-20 sm:px-8"><div className="rounded-[30px] bg-[#f0ecff] p-6 sm:p-9"><h2 className="flex items-center gap-2 text-xl font-black text-[#29214f]"><MessageCircleQuestion className="h-5 w-5 text-[#5535d5]" />Frequently asked questions</h2><div className="mt-4">{FAQS.map((faq, index) => <FaqItem key={index} faq={faq} isOpen={openFaq === index} onToggle={() => setOpenFaq(openFaq === index ? null : index)} />)}</div></div></section>
      </main>

      <div className="overflow-hidden border-y border-[#bed028] bg-[#d8ed48] py-3"><div className="flex overflow-hidden"><div className="animate-ticker flex shrink-0 items-center whitespace-nowrap">{[0, 1].map((copy) => <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>{["Never share your OTP", "Real jobs never ask for money", "Pause before urgent links", "Report lost money on 1930", "Spam SMS goes to 1909"].map((message) => <span key={`${copy}-${message}`} className="flex items-center text-xs font-extrabold uppercase tracking-wide text-[#29320d]"><ShieldCheck className="mx-6 h-4 w-4 text-[#4e5b0e]" />{message}</span>)}</div>)}</div></div></div>

      <footer className="bg-[#211b48] px-5 py-14 text-white sm:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-10 sm:flex-row"><div><div className="flex items-center gap-2.5"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8ed48] text-[#211b48]"><ShieldCheck className="h-5 w-5" /></span><span className="text-lg font-black">FraudDetector</span></div><p className="mt-4 max-w-xs text-sm leading-relaxed text-[#b4aec9]">Check first, trust second. A quick check can protect your money, identity and peace of mind.</p></div><div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm text-[#c4bed6]"><a href="#check" className="hover:text-[#d8ed48]">Check a scam</a><a href="#product" className="hover:text-[#d8ed48]">How it works</a><a href="#trends" className="hover:text-[#d8ed48]">Scam trends</a><a href="#about" className="hover:text-[#d8ed48]">About</a></div></div><div className="flex flex-col justify-between gap-3 pt-6 text-xs text-[#9e97b7] sm:flex-row"><span>Made for safer digital decisions in India.</span><span>Engineering team · Siddharth Jha · Naman Agarwal · Vedant Kashikar · Tanmay Barik</span></div></div></footer>
    </div>
  );
}
