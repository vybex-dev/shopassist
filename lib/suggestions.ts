/**
 * lib/suggestions.ts
 * ─────────────────────────────────────────────────────────────────
 * Suggestion categorisation, colour config, and fallbacks.
 *
 * categorizeSuggestion(text) → SuggestionCategory
 *   Keyword-match in priority order so "Talk to a human agent"
 *   always gets the red escalation colour, not the blue general one.
 *
 * getCategoryConfig(cat) → colours, emoji, hover classes
 *   Pure data — no React. Safe to import in API routes too.
 *
 * getFallbackSuggestions(langCode) → [string, string, string]
 *   Used when Gemini forgets to include a SUGGESTIONS line.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────

export type SuggestionCategory =
  | "tracking"
  | "return"
  | "payment"
  | "escalation"
  | "account"
  | "general";

export interface CategorizedSuggestion {
  text: string;
  category: SuggestionCategory;
}

export interface CategoryConfig {
  emoji: string;
  label: string; // screen-reader prefix e.g. "Shipping:"
  // Tailwind static class strings (must be full strings for PurgeCSS)
  bg: string;
  border: string;
  text: string;
  hoverBg: string;
  dot: string; // colour of the small leading dot
}

// ─── Category config ──────────────────────────────────────────────
// All Tailwind class names are complete strings so the JIT compiler
// never purges them.

const CATEGORY_CONFIG: Record<SuggestionCategory, CategoryConfig> = {
  tracking: {
    emoji: "📦",
    label: "Shipping",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    hoverBg: "hover:bg-emerald-100 hover:border-emerald-300",
    dot: "bg-emerald-400",
  },
  return: {
    emoji: "↩️",
    label: "Returns",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    hoverBg: "hover:bg-amber-100 hover:border-amber-300",
    dot: "bg-amber-400",
  },
  payment: {
    emoji: "💳",
    label: "Payment",
    bg: "bg-violet-50",
    border: "border-violet-200",
    text: "text-violet-700",
    hoverBg: "hover:bg-violet-100 hover:border-violet-300",
    dot: "bg-violet-400",
  },
  escalation: {
    emoji: "🧑‍💼",
    label: "Agent",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-600",
    hoverBg: "hover:bg-red-100 hover:border-red-300",
    dot: "bg-red-400",
  },
  account: {
    emoji: "👤",
    label: "Account",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    hoverBg: "hover:bg-blue-100 hover:border-blue-300",
    dot: "bg-blue-400",
  },
  general: {
    emoji: "💬",
    label: "General",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-600",
    hoverBg: "hover:bg-slate-100 hover:border-slate-300",
    dot: "bg-slate-400",
  },
};

// ─── Category detector ────────────────────────────────────────────

// Keywords per category — checked in PRIORITY order below.
const CATEGORY_KEYWORDS: Record<SuggestionCategory, string[]> = {
  escalation: [
    "human",
    "agent",
    "manager",
    "person",
    "representative",
    "speak to",
    "talk to",
    "call",
    "phone",
    "live agent",
    "real person",
    "live support",
    "supervisor",
    "директор",
    "agente",
    "responsable",
    "wكيل",
    "Mitarbeiter",
    "担当者",
    "상담사",
    "agente humano",
  ],
  tracking: [
    "track",
    "order",
    "where is",
    "shipping",
    "delivery",
    "package",
    "shipped",
    "arrive",
    "status",
    "parcel",
    "dispatch",
    "courier",
    "whereabouts",
    "suivi",
    "envío",
    "Bestellung",
    "追跡",
    "추적",
    "pedido",
    "отследить",
    "livraison",
  ],
  return: [
    "return",
    "refund",
    "exchange",
    "send back",
    "reship",
    "replacement",
    "damaged",
    "wrong item",
    "defective",
    "faulty",
    "retour",
    "devolución",
    "Rücksendung",
    "返品",
    "반품",
    "devolver",
    "возврат",
  ],
  payment: [
    "payment",
    "pay",
    "charge",
    "billing",
    "invoice",
    "price",
    "promo",
    "discount",
    "coupon",
    "code",
    "card",
    "refund",
    "money",
    "cost",
    "fee",
    "paiement",
    "pago",
    "Zahlung",
    "支払い",
    "결제",
    "pagamento",
    "оплата",
  ],
  account: [
    "account",
    "login",
    "password",
    "profile",
    "email",
    "sign in",
    "register",
    "settings",
    "username",
    "forgot",
    "compte",
    "cuenta",
    "Konto",
    "アカウント",
    "계정",
    "conta",
    "аккаунт",
  ],
  general: [],
};

// Priority order: specific high-stakes categories first
const DETECTION_PRIORITY: SuggestionCategory[] = [
  "escalation",
  "tracking",
  "return",
  "payment",
  "account",
  "general",
];

/**
 * Classifies a suggestion string into a SuggestionCategory.
 * Falls back to "general" if no keywords match.
 *
 * @param text  Raw suggestion text (any language)
 */
export function categorizeSuggestion(text: string): SuggestionCategory {
  const lower = text.toLowerCase();

  for (const category of DETECTION_PRIORITY) {
    const keywords = CATEGORY_KEYWORDS[category];
    if (keywords.some((kw) => lower.includes(kw))) {
      return category;
    }
  }

  return "general";
}

/**
 * Enriches an array of suggestion strings with category metadata.
 */
export function categorizeSuggestions(
  texts: string[],
): CategorizedSuggestion[] {
  return texts.map((text) => ({
    text,
    category: categorizeSuggestion(text),
  }));
}

/**
 * Returns the display config (colours, emoji) for a category.
 */
export function getCategoryConfig(
  category: SuggestionCategory,
): CategoryConfig {
  return CATEGORY_CONFIG[category];
}

// ─── Fallback suggestions ─────────────────────────────────────────
// Used when Gemini's SUGGESTIONS line is missing or malformed.

export const FALLBACK_SUGGESTIONS: Record<string, [string, string, string]> = {
  en: ["Track my order", "Return an item", "Talk to a human agent"],
  hi: ["ऑर्डर ट्रैक करें", "आइटम वापस करें", "एजेंट से बात करें"],
  es: ["Rastrear pedido", "Devolver artículo", "Hablar con agente"],
  fr: ["Suivre ma commande", "Retourner un article", "Parler à un agent"],
  ar: ["تتبع طلبي", "إرجاع منتج", "التحدث مع وكيل"],
  de: ["Bestellung verfolgen", "Artikel zurückgeben", "Mit Agent sprechen"],
  pt: ["Rastrear pedido", "Devolver item", "Falar com agente"],
  ja: ["注文を追跡", "商品を返品", "担当者に連絡"],
  zh: ["追踪订单", "申请退货", "联系客服"],
  ko: ["주문 추적", "상품 반품", "상담사 연결"],
  ru: ["Отследить заказ", "Вернуть товар", "Поговорить с агентом"],
};

export function getFallbackSuggestions(
  langCode: string,
): [string, string, string] {
  return FALLBACK_SUGGESTIONS[langCode] ?? FALLBACK_SUGGESTIONS["en"];
}
