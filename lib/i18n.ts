/**
 * lib/i18n.ts
 * ─────────────────────────────────────────────────────────────────
 * UI string translations for 11 languages.
 *
 * getStrings(langCode) → UIStrings for that language (falls back to "en")
 * getLanguageInfo(code) → flag, name, native name, RTL flag
 * isRTL(code)          → true for Arabic (and future RTL additions)
 * formatMessageCount() → localised "3 msgs" / "3 件" etc.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────

export interface UIStrings {
  alwaysOnline: string;
  languageLabel: string;
  autoDetected: string;
  poweredBy: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  quickStarts: Array<{ label: string; prompt: string }>;
  inputPlaceholder: string;
  inputPlaceholderStreaming: string;
  enterToSend: string;
  shiftEnterNewLine: string;
  quickRepliesLabel: string;
  clearButton: string;
  confirmClear: string;
  defaultSuggestions: [string, string, string];
  messageSingular: string;
  messagePlural: string;
}

export interface LanguageInfo {
  code: string; // BCP-47
  name: string; // English name
  nativeName: string; // Name in own language
  flag: string; // Emoji flag
  rtl: boolean; // Right-to-left script
}

// ─── Supported Languages ──────────────────────────────────────────

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
    rtl: false,
  },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳", rtl: false },
  {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    flag: "🇪🇸",
    rtl: false,
  },
  {
    code: "fr",
    name: "French",
    nativeName: "Français",
    flag: "🇫🇷",
    rtl: false,
  },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", rtl: true },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", rtl: false },
  {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    flag: "🇧🇷",
    rtl: false,
  },
  {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    flag: "🇯🇵",
    rtl: false,
  },
  { code: "zh", name: "Chinese", nativeName: "中文", flag: "🇨🇳", rtl: false },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷", rtl: false },
  {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    flag: "🇷🇺",
    rtl: false,
  },
];

export function getLanguageInfo(code: string): LanguageInfo {
  return (
    SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0]
  );
}

export function isRTL(code: string): boolean {
  return getLanguageInfo(code).rtl;
}

// ─── Translations ─────────────────────────────────────────────────

const TRANSLATIONS: Record<string, UIStrings> = {
  en: {
    alwaysOnline: "FlowMart Support · Always online",
    languageLabel: "Language",
    autoDetected: "Auto",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "Hi there! 👋",
    welcomeSubtitle:
      "I'm ShopAssist, your AI support agent for FlowMart. I can help with orders, returns, payments, and more — in any language.",
    quickStarts: [
      { label: "📦  Track my order", prompt: "Where is my order?" },
      { label: "↩️  Start a return", prompt: "I want to return an item" },
      {
        label: "💳  Payment issue",
        prompt: "I have a problem with my payment",
      },
      { label: "🕐  Delivery time", prompt: "How long does shipping take?" },
    ],
    inputPlaceholder: "Ask about your order, returns, payments…",
    inputPlaceholderStreaming: "ShopAssist is typing…",
    enterToSend: "Enter to send",
    shiftEnterNewLine: "Shift+Enter for new line",
    quickRepliesLabel: "Quick replies",
    clearButton: "Clear",
    confirmClear: "Confirm?",
    defaultSuggestions: [
      "Track my order",
      "Return an item",
      "Talk to a human agent",
    ],
    messageSingular: "msg",
    messagePlural: "msgs",
  },

  hi: {
    alwaysOnline: "FlowMart सपोर्ट · हमेशा ऑनलाइन",
    languageLabel: "भाषा",
    autoDetected: "स्वतः",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "नमस्ते! 👋",
    welcomeSubtitle:
      "मैं ShopAssist हूँ, FlowMart का AI सपोर्ट एजेंट। ऑर्डर, रिटर्न, पेमेंट और अधिक — किसी भी भाषा में।",
    quickStarts: [
      { label: "📦  ऑर्डर ट्रैक करें", prompt: "मेरा ऑर्डर कहाँ है?" },
      {
        label: "↩️  रिटर्न शुरू करें",
        prompt: "मैं एक आइटम वापस करना चाहता हूँ",
      },
      { label: "💳  पेमेंट समस्या", prompt: "मेरे पेमेंट में समस्या है" },
      { label: "🕐  डिलीवरी समय", prompt: "शिपिंग में कितना समय लगता है?" },
    ],
    inputPlaceholder: "ऑर्डर, रिटर्न, पेमेंट के बारे में पूछें…",
    inputPlaceholderStreaming: "ShopAssist टाइप कर रहा है…",
    enterToSend: "भेजने के लिए Enter",
    shiftEnterNewLine: "नई लाइन के लिए Shift+Enter",
    quickRepliesLabel: "त्वरित उत्तर",
    clearButton: "साफ करें",
    confirmClear: "पक्का?",
    defaultSuggestions: [
      "ऑर्डर ट्रैक करें",
      "आइटम वापस करें",
      "एजेंट से बात करें",
    ],
    messageSingular: "संदेश",
    messagePlural: "संदेश",
  },

  es: {
    alwaysOnline: "Soporte FlowMart · Siempre en línea",
    languageLabel: "Idioma",
    autoDetected: "Auto",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "¡Hola! 👋",
    welcomeSubtitle:
      "Soy ShopAssist, tu agente de soporte IA para FlowMart. Te ayudo con pedidos, devoluciones, pagos y más.",
    quickStarts: [
      { label: "📦  Rastrear pedido", prompt: "¿Dónde está mi pedido?" },
      {
        label: "↩️  Iniciar devolución",
        prompt: "Quiero devolver un artículo",
      },
      {
        label: "💳  Problema de pago",
        prompt: "Tengo un problema con mi pago",
      },
      {
        label: "🕐  Tiempo de entrega",
        prompt: "¿Cuánto tiempo tarda el envío?",
      },
    ],
    inputPlaceholder: "Pregunta sobre tu pedido, devoluciones, pagos…",
    inputPlaceholderStreaming: "ShopAssist está escribiendo…",
    enterToSend: "Enter para enviar",
    shiftEnterNewLine: "Shift+Enter para nueva línea",
    quickRepliesLabel: "Respuestas rápidas",
    clearButton: "Limpiar",
    confirmClear: "¿Confirmar?",
    defaultSuggestions: [
      "Rastrear pedido",
      "Devolver artículo",
      "Hablar con agente",
    ],
    messageSingular: "mensaje",
    messagePlural: "mensajes",
  },

  fr: {
    alwaysOnline: "Support FlowMart · Toujours en ligne",
    languageLabel: "Langue",
    autoDetected: "Auto",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "Bonjour ! 👋",
    welcomeSubtitle:
      "Je suis ShopAssist, votre agent de support IA pour FlowMart. Je vous aide avec vos commandes, retours, paiements et plus encore.",
    quickStarts: [
      { label: "📦  Suivre ma commande", prompt: "Où est ma commande ?" },
      {
        label: "↩️  Démarrer un retour",
        prompt: "Je veux retourner un article",
      },
      {
        label: "💳  Problème de paiement",
        prompt: "J'ai un problème de paiement",
      },
      {
        label: "🕐  Délai de livraison",
        prompt: "Combien de temps prend la livraison ?",
      },
    ],
    inputPlaceholder:
      "Posez une question sur votre commande, retours, paiements…",
    inputPlaceholderStreaming: "ShopAssist est en train d'écrire…",
    enterToSend: "Entrée pour envoyer",
    shiftEnterNewLine: "Shift+Entrée pour nouvelle ligne",
    quickRepliesLabel: "Réponses rapides",
    clearButton: "Effacer",
    confirmClear: "Confirmer ?",
    defaultSuggestions: [
      "Suivre ma commande",
      "Retourner un article",
      "Parler à un agent",
    ],
    messageSingular: "message",
    messagePlural: "messages",
  },

  ar: {
    alwaysOnline: "دعم FlowMart · متاح دائماً",
    languageLabel: "اللغة",
    autoDetected: "تلقائي",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "مرحباً! 👋",
    welcomeSubtitle:
      "أنا ShopAssist، وكيل الدعم الذكي لـ FlowMart. يمكنني مساعدتك في الطلبات والمرتجعات والمدفوعات والمزيد.",
    quickStarts: [
      { label: "📦  تتبع طلبي", prompt: "أين طلبي؟" },
      { label: "↩️  بدء إرجاع", prompt: "أريد إرجاع منتج" },
      { label: "💳  مشكلة دفع", prompt: "لدي مشكلة في الدفع" },
      { label: "🕐  وقت التوصيل", prompt: "كم يستغرق الشحن؟" },
    ],
    inputPlaceholder: "اسأل عن طلبك أو المرتجعات أو المدفوعات…",
    inputPlaceholderStreaming: "ShopAssist يكتب…",
    enterToSend: "Enter للإرسال",
    shiftEnterNewLine: "Shift+Enter لسطر جديد",
    quickRepliesLabel: "ردود سريعة",
    clearButton: "مسح",
    confirmClear: "تأكيد؟",
    defaultSuggestions: ["تتبع طلبي", "إرجاع منتج", "التحدث مع وكيل"],
    messageSingular: "رسالة",
    messagePlural: "رسائل",
  },

  de: {
    alwaysOnline: "FlowMart-Support · Immer online",
    languageLabel: "Sprache",
    autoDetected: "Auto",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "Hallo! 👋",
    welcomeSubtitle:
      "Ich bin ShopAssist, Ihr KI-Supportagent für FlowMart. Ich helfe Ihnen bei Bestellungen, Rücksendungen, Zahlungen und mehr.",
    quickStarts: [
      { label: "📦  Bestellung verfolgen", prompt: "Wo ist meine Bestellung?" },
      {
        label: "↩️  Rücksendung starten",
        prompt: "Ich möchte einen Artikel zurückgeben",
      },
      { label: "💳  Zahlungsproblem", prompt: "Ich habe ein Zahlungsproblem" },
      { label: "🕐  Lieferzeit", prompt: "Wie lange dauert der Versand?" },
    ],
    inputPlaceholder: "Fragen Sie nach Bestellung, Rücksendungen, Zahlungen…",
    inputPlaceholderStreaming: "ShopAssist schreibt…",
    enterToSend: "Enter zum Senden",
    shiftEnterNewLine: "Shift+Enter für neue Zeile",
    quickRepliesLabel: "Schnellantworten",
    clearButton: "Löschen",
    confirmClear: "Bestätigen?",
    defaultSuggestions: [
      "Bestellung verfolgen",
      "Artikel zurückgeben",
      "Mit Agent sprechen",
    ],
    messageSingular: "Nachricht",
    messagePlural: "Nachrichten",
  },

  pt: {
    alwaysOnline: "Suporte FlowMart · Sempre online",
    languageLabel: "Idioma",
    autoDetected: "Auto",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "Olá! 👋",
    welcomeSubtitle:
      "Sou o ShopAssist, seu agente de suporte IA para o FlowMart. Ajudo com pedidos, devoluções, pagamentos e muito mais.",
    quickStarts: [
      { label: "📦  Rastrear pedido", prompt: "Onde está meu pedido?" },
      { label: "↩️  Iniciar devolução", prompt: "Quero devolver um item" },
      {
        label: "💳  Problema de pagamento",
        prompt: "Tenho um problema com meu pagamento",
      },
      { label: "🕐  Prazo de entrega", prompt: "Quanto tempo leva o envio?" },
    ],
    inputPlaceholder: "Pergunte sobre seu pedido, devoluções, pagamentos…",
    inputPlaceholderStreaming: "ShopAssist está digitando…",
    enterToSend: "Enter para enviar",
    shiftEnterNewLine: "Shift+Enter para nova linha",
    quickRepliesLabel: "Respostas rápidas",
    clearButton: "Limpar",
    confirmClear: "Confirmar?",
    defaultSuggestions: [
      "Rastrear pedido",
      "Devolver item",
      "Falar com agente",
    ],
    messageSingular: "mensagem",
    messagePlural: "mensagens",
  },

  ja: {
    alwaysOnline: "FlowMartサポート · 常時オンライン",
    languageLabel: "言語",
    autoDetected: "自動",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "こんにちは！ 👋",
    welcomeSubtitle:
      "私はShopAssist、FlowMartのAIサポートエージェントです。注文・返品・支払いなどについてお手伝いします。",
    quickStarts: [
      { label: "📦  注文を追跡", prompt: "私の注文はどこですか？" },
      { label: "↩️  返品を開始", prompt: "商品を返品したいです" },
      { label: "💳  支払い問題", prompt: "支払いに問題があります" },
      { label: "🕐  配達時間", prompt: "配送にどのくらいかかりますか？" },
    ],
    inputPlaceholder: "注文・返品・支払いについてお尋ねください…",
    inputPlaceholderStreaming: "ShopAssistが入力中…",
    enterToSend: "Enterで送信",
    shiftEnterNewLine: "Shift+Enterで改行",
    quickRepliesLabel: "クイック返信",
    clearButton: "クリア",
    confirmClear: "確認？",
    defaultSuggestions: ["注文を追跡", "商品を返品", "担当者に連絡"],
    messageSingular: "件",
    messagePlural: "件",
  },

  zh: {
    alwaysOnline: "FlowMart客服 · 全天在线",
    languageLabel: "语言",
    autoDetected: "自动",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "您好！ 👋",
    welcomeSubtitle:
      "我是ShopAssist，FlowMart的AI客服助手。可以帮您处理订单、退货、支付等问题。",
    quickStarts: [
      { label: "📦  追踪订单", prompt: "我的订单在哪里？" },
      { label: "↩️  申请退货", prompt: "我想退货" },
      { label: "💳  支付问题", prompt: "我的支付遇到问题" },
      { label: "🕐  配送时间", prompt: "配送需要多长时间？" },
    ],
    inputPlaceholder: "询问您的订单、退货、支付…",
    inputPlaceholderStreaming: "ShopAssist正在输入…",
    enterToSend: "Enter发送",
    shiftEnterNewLine: "Shift+Enter换行",
    quickRepliesLabel: "快速回复",
    clearButton: "清除",
    confirmClear: "确认？",
    defaultSuggestions: ["追踪订单", "申请退货", "联系客服"],
    messageSingular: "条",
    messagePlural: "条",
  },

  ko: {
    alwaysOnline: "FlowMart 지원 · 항상 온라인",
    languageLabel: "언어",
    autoDetected: "자동",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "안녕하세요! 👋",
    welcomeSubtitle:
      "저는 ShopAssist, FlowMart의 AI 지원 에이전트입니다. 주문·반품·결제 등 도움을 드립니다.",
    quickStarts: [
      { label: "📦  주문 추적", prompt: "내 주문은 어디 있나요?" },
      { label: "↩️  반품 시작", prompt: "상품을 반품하고 싶습니다" },
      { label: "💳  결제 문제", prompt: "결제에 문제가 있습니다" },
      { label: "🕐  배송 시간", prompt: "배송은 얼마나 걸리나요?" },
    ],
    inputPlaceholder: "주문·반품·결제에 대해 질문하세요…",
    inputPlaceholderStreaming: "ShopAssist가 입력 중…",
    enterToSend: "Enter로 전송",
    shiftEnterNewLine: "Shift+Enter로 줄 바꿈",
    quickRepliesLabel: "빠른 답변",
    clearButton: "지우기",
    confirmClear: "확인?",
    defaultSuggestions: ["주문 추적", "상품 반품", "상담사 연결"],
    messageSingular: "개",
    messagePlural: "개",
  },

  ru: {
    alwaysOnline: "Поддержка FlowMart · Всегда онлайн",
    languageLabel: "Язык",
    autoDetected: "Авто",
    poweredBy: "Gemini 2.5 Flash",
    welcomeTitle: "Привет! 👋",
    welcomeSubtitle:
      "Я ShopAssist, ваш AI-агент поддержки FlowMart. Помогу с заказами, возвратами, оплатой и многим другим.",
    quickStarts: [
      { label: "📦  Отследить заказ", prompt: "Где мой заказ?" },
      { label: "↩️  Оформить возврат", prompt: "Я хочу вернуть товар" },
      { label: "💳  Проблема с оплатой", prompt: "У меня проблема с оплатой" },
      {
        label: "🕐  Время доставки",
        prompt: "Сколько времени занимает доставка?",
      },
    ],
    inputPlaceholder: "Спросите о заказе, возврате, оплате…",
    inputPlaceholderStreaming: "ShopAssist печатает…",
    enterToSend: "Enter для отправки",
    shiftEnterNewLine: "Shift+Enter для новой строки",
    quickRepliesLabel: "Быстрые ответы",
    clearButton: "Очистить",
    confirmClear: "Подтвердить?",
    defaultSuggestions: [
      "Отследить заказ",
      "Вернуть товар",
      "Поговорить с агентом",
    ],
    messageSingular: "сообщение",
    messagePlural: "сообщений",
  },
};

// ─── Public API ───────────────────────────────────────────────────

/** Returns UI strings for the given language, falls back to English. */
export function getStrings(langCode: string): UIStrings {
  return TRANSLATIONS[langCode] ?? TRANSLATIONS["en"];
}

/** Returns "3 msgs" / "3 件" / "3 رسائل" etc. */
export function formatMessageCount(count: number, langCode: string): string {
  const t = getStrings(langCode);
  const label = count === 1 ? t.messageSingular : t.messagePlural;
  return `${count} ${label}`;
}
