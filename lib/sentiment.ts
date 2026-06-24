/**
 * lib/sentiment.ts
 * ─────────────────────────────────────────────────────────────────
 * Rule-based sentiment detection and language identification.
 *
 * Design goals:
 *  - Synchronous, zero-latency (no API calls, no ML model)
 *  - Accurate enough for e-commerce support contexts
 *  - Conversation-aware (consecutive negative turns escalate faster)
 *  - Returns types that match types/index.ts exactly
 *
 * Scoring breakdown:
 *  1. Keyword scan — three tiers: angry (−3×), negative (−1×), positive (+1×)
 *  2. Hard escalation phrases — override score, always escalate
 *  3. Pattern detection — ALL CAPS, !!!, ???, repeated words
 *  4. Conversation context — prior negative turns add weight
 *  5. Urgency keywords — amplify negative score only
 *  6. Normalise raw score → −1.0…+1.0
 *  7. Classify into SentimentLabel
 *  8. Auto-escalate if score < −0.65
 * ─────────────────────────────────────────────────────────────────
 */

import type { Message, SentimentScore, SentimentLabel } from "@/types";

// ─── Keyword Dictionaries ─────────────────────────────────────────

/**
 * Angry keywords — highest negative weight (2–3 pts each).
 * These words indicate strong emotional distress.
 */
const ANGRY_KEYWORDS: Record<string, number> = {
  furious: 3,
  outraged: 3,
  livid: 3,
  enraged: 3,
  infuriated: 3,
  seething: 3,
  disgusting: 3,
  disgraceful: 2.5,
  despicable: 3,
  unacceptable: 2.5,
  "absolutely unacceptable": 3,
  ridiculous: 2.5,
  absurd: 2,
  outrageous: 2.5,
  pathetic: 2.5,
  incompetent: 2.5,
  useless: 2,
  terrible: 2.5,
  horrible: 2.5,
  dreadful: 2.5,
  awful: 2,
  appalling: 2.5,
  atrocious: 2.5,
  worst: 2.5,
  "worst ever": 3,
  "worst service": 3,
  scam: 3,
  fraud: 3,
  fraudulent: 3,
  liar: 3,
  lies: 2.5,
  lying: 2.5,
  thief: 3,
  stealing: 3,
  robbery: 3,
  lawsuit: 3,
  "sue you": 3,
  suing: 3,
  lawyer: 2.5,
  "legal action": 3,
  "never again": 2.5,
  "last time": 1.5,
  idiots: 3,
  morons: 3,
  incompetence: 2.5,
  garbage: 2.5,
  trash: 2.5,
  junk: 2,
  ripped: 2.5,
  "ripped off": 3,
  cheated: 2.5,
};

/**
 * Negative keywords — medium negative weight (0.5–2 pts each).
 * These indicate frustration, disappointment, or unresolved issues.
 */
const NEGATIVE_KEYWORDS: Record<string, number> = {
  angry: 2,
  upset: 1.5,
  frustrated: 1.5,
  disappointed: 1.5,
  annoyed: 1.5,
  irritated: 1.5,
  unhappy: 1.5,
  dissatisfied: 1.5,
  displeased: 1.5,
  worried: 1,
  concerned: 0.8,
  confused: 0.5,
  broken: 1.5,
  damaged: 1.5,
  defective: 1.5,
  faulty: 1.5,
  missing: 1.5,
  lost: 1.2,
  wrong: 1,
  incorrect: 1,
  inaccurate: 1,
  delayed: 1,
  delay: 1,
  late: 1,
  overdue: 1.5,
  "still waiting": 1.5,
  "not received": 1.5,
  "not arrived": 1.5,
  "never arrived": 2,
  "not delivered": 1.5,
  "wrong item": 2,
  "wrong size": 1.5,
  problem: 1,
  issue: 1,
  complaint: 1.5,
  "not working": 1.5,
  error: 1,
  failed: 1.5,
  charged: 0.5,
  overcharged: 2,
  "charged twice": 2,
  "double charged": 2,
  "extra charge": 1.5,
  refund: 0.5,
  "need refund": 1.5,
  "want refund": 1.5,
  return: 0.5,
  cancel: 0.5,
  cancelled: 0.5,
  waste: 1.5,
  wasted: 1.5,
  "money wasted": 2,
  poor: 1.5,
  "poor quality": 2,
  "poor service": 2,
  ignored: 2,
  "no response": 1.5,
  unresponsive: 1.5,
  "not helping": 1.5,
  useless: 2,
};

/**
 * Positive keywords — positive weight (1–2.5 pts each).
 */
const POSITIVE_KEYWORDS: Record<string, number> = {
  thank: 2,
  thanks: 2,
  "thank you": 2.5,
  "many thanks": 2.5,
  appreciate: 2,
  appreciated: 2,
  grateful: 2,
  gratitude: 2,
  great: 1.5,
  good: 1,
  excellent: 2,
  amazing: 2,
  wonderful: 2,
  fantastic: 2,
  superb: 2,
  outstanding: 2,
  exceptional: 2,
  perfect: 2,
  brilliant: 2,
  lovely: 1.5,
  happy: 2,
  satisfied: 2,
  pleased: 1.5,
  delighted: 2,
  thrilled: 2,
  love: 1.5,
  enjoy: 1.5,
  enjoyed: 1.5,
  impressed: 2,
  helpful: 1.5,
  helped: 1.5,
  helping: 1,
  resolved: 2,
  solved: 2,
  fixed: 2,
  quick: 1,
  fast: 1,
  easy: 1,
  smooth: 1,
  seamless: 1.5,
  efficient: 1.5,
  recommend: 2,
  recommended: 2,
  best: 1.5,
  "best service": 2.5,
};

/**
 * Urgency modifiers — boost negative score, can push toward escalation.
 * By themselves neutral, but in a negative context they intensify.
 */
const URGENCY_KEYWORDS = [
  "immediately",
  "urgent",
  "urgently",
  "asap",
  "right now",
  "right away",
  "now!",
  "today",
  "this instant",
  "emergency",
  "critical",
  "serious",
  "cannot wait",
  "can't wait",
  "need this fixed",
  "need help now",
  "been waiting",
  "waiting for days",
  "waiting for weeks",
  "manager",
  "supervisor",
  "director",
  "head office",
  "escalate",
  "human agent",
  "real person",
  "live person",
  "live agent",
  "speak to someone",
  "talk to someone",
  "speak to a representative",
];

/**
 * Hard escalation phrases — any match forces escalate=true immediately.
 * These override the numeric score threshold.
 */
const ESCALATION_PHRASES = [
  "speak to a manager",
  "talk to a manager",
  "speak to a human",
  "talk to a human",
  "speak to a real person",
  "talk to a real person",
  "human agent",
  "live agent",
  "real agent",
  "speak to an agent",
  "talk to an agent",
  "call a lawyer",
  "contact a lawyer",
  "take legal action",
  "legal action",
  "sue you",
  "going to sue",
  "file a lawsuit",
  "small claims",
  "small claims court",
  "file a complaint",
  "report you",
  "report this",
  "chargeback",
  "charge back",
  "dispute the charge",
  "dispute this charge",
  "dispute my payment",
  "trading standards",
  "better business bureau",
  "consumer protection",
  "consumer affairs",
  "social media",
  "twitter",
  "facebook",
  "instagram",
  "going public",
  "news channel",
  "expose you",
  "never shopping",
  "will never shop",
  "cancel my account",
  "close my account",
  "delete my account",
];

// ─── Language Detection ───────────────────────────────────────────

/**
 * Detects the BCP-47 language tag of a text string.
 *
 * Strategy:
 *  1. Unicode script range check (non-Latin scripts — highly reliable)
 *  2. Common word patterns for Latin-script languages
 *  3. Default to "en"
 *
 * @param text  User message text
 * @returns     BCP-47 language tag e.g. "en", "hi", "fr", "ar"
 */
export function detectLanguage(text: string): string {
  // ── Script-based detection (reliable for non-Latin) ────────────
  if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari → Hindi
  if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
  if (/[\u4E00-\u9FFF]/.test(text)) return "zh"; // Chinese (CJK)
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja"; // Japanese
  if (/[\uAC00-\uD7AF]/.test(text)) return "ko"; // Korean
  if (/[\u0400-\u04FF]/.test(text)) return "ru"; // Cyrillic → Russian
  if (/[\u0370-\u03FF]/.test(text)) return "el"; // Greek
  if (/[\u0E00-\u0E7F]/.test(text)) return "th"; // Thai
  if (/[\u0A80-\u0AFF]/.test(text)) return "gu"; // Gujarati
  if (/[\u0B00-\u0B7F]/.test(text)) return "or"; // Odia/Bengali
  if (/[\u0C00-\u0C7F]/.test(text)) return "te"; // Telugu
  if (/[\u0C80-\u0CFF]/.test(text)) return "kn"; // Kannada
  if (/[\u0D00-\u0D7F]/.test(text)) return "ml"; // Malayalam
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta"; // Tamil

  // ── Latin-script language detection via word patterns ──────────
  const lower = text.toLowerCase();

  const patterns: [string, RegExp][] = [
    [
      "es",
      /\b(hola|gracias|donde|cuando|porque|quiero|necesito|ayuda|pedido|devolucion|envio|reembolso|pago|producto|entrega|orden|problema|cliente|compra)\b/,
    ],
    [
      "fr",
      /\b(bonjour|merci|votre|notre|commande|retour|livraison|probleme|aide|paiement|produit|remboursement|client|achat|livrer|colis)\b/,
    ],
    [
      "de",
      /\b(hallo|danke|bitte|bestellung|ruckgabe|lieferung|problem|hilfe|zahlung|produkt|ruckerstattung|kunde|einkauf|paket|versand)\b/,
    ],
    [
      "pt",
      /\b(ola|obrigado|pedido|devolucao|entrega|problema|ajuda|pagamento|produto|reembolso|cliente|compra|envio|pacote)\b/,
    ],
    [
      "it",
      /\b(ciao|grazie|ordine|reso|consegna|problema|aiuto|pagamento|prodotto|rimborso|cliente|acquisto|spedizione|pacco)\b/,
    ],
    [
      "nl",
      /\b(hallo|bedankt|bestelling|retour|levering|probleem|hulp|betaling|product|terugbetaling|klant|aankoop|pakket)\b/,
    ],
  ];

  for (const [lang, pattern] of patterns) {
    if (pattern.test(lower)) return lang;
  }

  return "en"; // Default
}

// ─── Sentiment Label ──────────────────────────────────────────────

/**
 * Maps a normalised score to a SentimentLabel.
 *
 * Thresholds (tuned for customer support context):
 *  < −0.60 → angry   (strong distress, near-guaranteed escalation)
 *  < −0.15 → negative (frustrated, disappointed)
 *  < +0.15 → neutral  (informational, calm)
 *  ≥ +0.15 → positive (happy, grateful)
 */
export function getSentimentLabel(score: number): SentimentLabel {
  if (score < -0.6) return "angry";
  if (score < -0.15) return "negative";
  if (score < +0.15) return "neutral";
  return "positive";
}

// ─── UI Helpers ───────────────────────────────────────────────────

/** Tailwind color classes for each sentiment label. */
export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: "bg-emerald-400",
  neutral: "bg-slate-300",
  negative: "bg-amber-400",
  angry: "bg-red-500",
};

/** Accessible label text for screen readers. */
export const SENTIMENT_ARIA: Record<SentimentLabel, string> = {
  positive: "Positive sentiment",
  neutral: "Neutral sentiment",
  negative: "Negative sentiment",
  angry: "Angry sentiment",
};

// ─── Core Analyser ────────────────────────────────────────────────

/**
 * Analyses a single message for sentiment.
 *
 * @param text             The user's message text
 * @param previousMessages Optional conversation history for context
 * @returns                SentimentScore with label, score (−1…+1), escalate flag
 */
export function analyzeSentiment(
  text: string,
  previousMessages?: Message[],
): SentimentScore {
  const lower = text.toLowerCase().trim();
  let rawScore = 0;
  let escalate = false;

  // ── 1. Hard escalation phrase check ─────────────────────────────
  for (const phrase of ESCALATION_PHRASES) {
    if (lower.includes(phrase)) {
      escalate = true;
      rawScore -= 5; // significant pull toward angry
    }
  }

  // ── 2. Angry keywords (highest weight) ──────────────────────────
  for (const [keyword, weight] of Object.entries(ANGRY_KEYWORDS)) {
    if (lower.includes(keyword)) rawScore -= weight;
  }

  // ── 3. Negative keywords (medium weight) ────────────────────────
  for (const [keyword, weight] of Object.entries(NEGATIVE_KEYWORDS)) {
    if (lower.includes(keyword)) rawScore -= weight * 0.5;
  }

  // ── 4. Positive keywords ─────────────────────────────────────────
  for (const [keyword, weight] of Object.entries(POSITIVE_KEYWORDS)) {
    if (lower.includes(keyword)) rawScore += weight;
  }

  // ── 5. Pattern detection ─────────────────────────────────────────

  // ALL CAPS detection — if >70% of letter chars are uppercase → shouting
  const letters = text.replace(/[^a-zA-Z]/g, "");
  const upperRatio =
    letters.length > 5
      ? text.replace(/[^A-Z]/g, "").length / letters.length
      : 0;

  if (upperRatio > 0.7 && text.length > 8) {
    rawScore =
      rawScore < 0
        ? rawScore * 1.6 // amplify existing negativity
        : rawScore - 1.5; // punish shouting even if words were neutral
  }

  // Multiple exclamation marks (each extra ! beyond the first adds −0.4)
  const exclamations = (text.match(/!/g) ?? []).length;
  if (exclamations > 1) rawScore -= (exclamations - 1) * 0.4;

  // Multiple question marks (each extra ?? beyond the first adds −0.25)
  const questions = (text.match(/\?/g) ?? []).length;
  if (questions > 2) rawScore -= (questions - 2) * 0.25;

  // Repeated words (HELP HELP HELP → frustration signal)
  const wordTokens = lower.split(/\s+/).filter(Boolean);
  const wordCounts: Record<string, number> = {};
  for (const w of wordTokens) {
    if (w.length > 2) wordCounts[w] = (wordCounts[w] ?? 0) + 1;
  }
  const maxRepeat = Math.max(0, ...Object.values(wordCounts));
  if (maxRepeat >= 3) rawScore -= (maxRepeat - 2) * 0.5;

  // ── 6. Urgency keywords ─────────────────────────────────────────
  // Only amplify negative — urgency alone is not negative
  const urgencyHits = URGENCY_KEYWORDS.filter((kw) =>
    lower.includes(kw),
  ).length;
  if (urgencyHits > 0 && rawScore < 0) {
    rawScore -= urgencyHits * 0.35;
  }

  // ── 7. Conversation context ──────────────────────────────────────
  if (previousMessages && previousMessages.length > 0) {
    const recentUserMsgs = previousMessages
      .filter((m) => m.role === "user" && m.sentiment != null)
      .slice(-5); // look at last 5 user turns

    // Each prior negative/angry turn pulls current score down
    const priorNegCount = recentUserMsgs.filter(
      (m) => m.sentiment!.score < -0.15,
    ).length;
    rawScore -= priorNegCount * 0.4;

    // If conversation was already escalated, stay in escalated territory
    const wasEscalated = recentUserMsgs.some((m) => m.sentiment!.escalate);
    if (wasEscalated) rawScore -= 1.0;

    // Reward: if user was recently positive, give slight positive lift
    const priorPosCount = recentUserMsgs.filter(
      (m) => m.sentiment!.score > 0.2,
    ).length;
    rawScore += priorPosCount * 0.2;
  }

  // ── 8. Normalise to −1.0 … +1.0 ─────────────────────────────────
  // MAX_RAW: theoretical max magnitude of raw score
  // Calibrated so that "YOUR SCAM FRAUD RIDICULOUS LAWSUIT!!!!!" → ≈ −1.0
  const MAX_RAW = 14;
  const normalised = Math.max(-1.0, Math.min(1.0, rawScore / MAX_RAW));

  // ── 9. Classify ──────────────────────────────────────────────────
  const label = getSentimentLabel(normalised);

  // ── 10. Auto-escalate on very angry score ────────────────────────
  if (normalised < -0.65) escalate = true;

  return {
    label,
    score: Math.round(normalised * 100) / 100,
    escalate,
  };
}

// ─── Conversation-level summary ───────────────────────────────────

/**
 * Returns the dominant sentiment across a full conversation.
 * Used for analytics (Step 11) and DB storage (Step 10).
 *
 * Priority order: angry > negative > neutral > positive
 */
export function getConversationSentiment(messages: Message[]): SentimentScore {
  const userMessages = messages.filter(
    (m) => m.role === "user" && m.sentiment != null,
  );

  if (userMessages.length === 0) {
    return { label: "neutral", score: 0, escalate: false };
  }

  const avgScore =
    userMessages.reduce((sum, m) => sum + m.sentiment!.score, 0) /
    userMessages.length;

  const anyEscalated = userMessages.some((m) => m.sentiment!.escalate);

  return {
    label: getSentimentLabel(avgScore),
    score: Math.round(avgScore * 100) / 100,
    escalate: anyEscalated,
  };
}

/**
 * Returns a human-readable summary of the sentiment score.
 * Used in the admin dashboard tooltips.
 */
export function describeSentiment(score: SentimentScore): string {
  const percent = Math.abs(Math.round(score.score * 100));
  switch (score.label) {
    case "angry":
      return `Very negative (${percent}% intensity)`;
    case "negative":
      return `Frustrated (${percent}% intensity)`;
    case "neutral":
      return "Neutral";
    case "positive":
      return `Positive (${percent}% intensity)`;
  }
}
