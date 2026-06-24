/**
 * lib/gemini.ts  (Step 6 — Sentiment context in prompts)
 * ─────────────────────────────────────────────────────────────────
 * Changes from Step 5:
 *  - StreamOptions interface: { sentiment?, language? }
 *  - createGeminiStream accepts StreamOptions
 *  - buildSystemPrompt(userMessage?, sentiment?) injects emotional
 *    context for angry/negative users so Gemini adjusts its tone
 *  - GeminiSSEEvent metadata now includes sentiment + language
 * ─────────────────────────────────────────────────────────────────
 */

import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import type { Content } from "@google/generative-ai";
import fs from "fs";
import path from "path";

import {
  parseKnowledgeBase,
  retrieveRelevantChunks,
  formatChunksForPrompt,
  type KBChunk,
} from "@/lib/rag";
import type { Message, SentimentScore } from "@/types";

// ─── Gemini client ────────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
};

// ─── KB Cache ─────────────────────────────────────────────────────

let _kbTextCache: string | null = null;
let _kbChunkCache: KBChunk[] | null = null;
let _kbLoadedAt: Date | null = null;

export function loadKnowledgeBase(): string {
  if (_kbTextCache) return _kbTextCache;
  try {
    const kbPath = path.join(process.cwd(), "data", "knowledge-base.txt");
    _kbTextCache = fs.readFileSync(kbPath, "utf-8");
    _kbLoadedAt = new Date();
    _kbChunkCache = parseKnowledgeBase(_kbTextCache);
    console.log(
      `[RAG] KB loaded — ${_kbTextCache.length.toLocaleString()} chars | ${_kbChunkCache.length} chunks`,
    );
    return _kbTextCache;
  } catch (err) {
    console.error("[RAG] ⚠️  Could not load knowledge base:", err);
    return "Knowledge base temporarily unavailable.";
  }
}

export function loadKBChunks(): KBChunk[] {
  if (_kbChunkCache) return _kbChunkCache;
  loadKnowledgeBase();
  return _kbChunkCache ?? [];
}

export function invalidateKBCache(): void {
  _kbTextCache = null;
  _kbChunkCache = null;
  _kbLoadedAt = null;
  console.log("[RAG] KB cache cleared");
}

export function getKBCacheStatus() {
  return {
    cached: _kbTextCache !== null,
    loadedAt: _kbLoadedAt?.toISOString() ?? null,
    totalChunks: _kbChunkCache?.length ?? 0,
    totalChars: _kbTextCache?.length ?? 0,
  };
}

// ─── Emotional context builder ────────────────────────────────────

/**
 * Generates an internal emotional context note for the system prompt.
 * This is NOT shown to the user — it only guides Gemini's tone.
 */
function buildEmotionalContext(sentiment?: SentimentScore): string {
  if (!sentiment) return "";

  switch (sentiment.label) {
    case "angry":
      return `

## ⚠️  INTERNAL EMOTIONAL CONTEXT — DO NOT SHARE WITH CUSTOMER
Sentiment analysis: ANGRY (score: ${sentiment.score}).
This customer is very frustrated. Mandatory response adjustments:
1. Open with a sincere, specific apology — not a generic one
2. Acknowledge the specific issue they raised BEFORE any solution
3. Use a slower, more deliberate tone — avoid rushed bullet-point style
4. Offer a proactive resolution or compensation without being asked
5. If you cannot fully resolve this in one turn, append [ESCALATE] immediately
6. Never use phrases like "I understand your frustration" — it reads as dismissive
   Instead use: "You're absolutely right to feel this way" or "That's completely unacceptable and I'm sorry"`;

    case "negative":
      return `

## ⚠️  INTERNAL EMOTIONAL CONTEXT — DO NOT SHARE WITH CUSTOMER
Sentiment analysis: NEGATIVE (score: ${sentiment.score}).
This customer is frustrated or disappointed. Response adjustments:
1. Acknowledge their frustration warmly before jumping to solutions
2. Be extra patient and thorough — don't rush
3. Use a reassuring, calm tone throughout`;

    default:
      return "";
  }
}

// ─── System Prompt Builder ────────────────────────────────────────

/**
 * Builds the full system prompt with RAG context + optional emotional context.
 *
 * @param userMessage  Current user message (for RAG retrieval)
 * @param sentiment    Detected sentiment (for tone adjustment)
 */
export function buildSystemPrompt(
  userMessage?: string,
  sentiment?: SentimentScore,
): string {
  const chunks = loadKBChunks();
  let kbContext: string;
  let ragInfo = "";

  if (userMessage && chunks.length > 0) {
    const result = retrieveRelevantChunks(userMessage, chunks);
    kbContext = result.formattedContext;
    ragInfo = `\n[Context: ${result.usedChunks} of ${result.totalChunks} KB sections matched — score ${result.topScore}/100]`;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[RAG] "${userMessage.slice(0, 50)}…"` +
          ` | chunks: ${result.usedChunks}/${result.totalChunks}` +
          ` | score: ${result.topScore}` +
          ` | terms: [${result.queryTerms.join(", ")}]`,
      );
    }
  } else {
    kbContext = formatChunksForPrompt(chunks);
    ragInfo = `\n[Context: full KB — ${chunks.length} chunks]`;
  }

  const emotionalContext = buildEmotionalContext(sentiment);

  return `You are ShopAssist, an intelligent and empathetic AI customer support agent for FlowMart — a modern, fast-growing e-commerce store.

## PERSONALITY & TONE
- Warm, professional, and solution-focused at all times
- Acknowledge the customer's emotion BEFORE offering a solution
- Be concise and plain-spoken — no corporate filler phrases
- Use the customer's name naturally if they provide it
- Never start a response with "I" — vary your sentence openers

## ⚠️  CRITICAL LANGUAGE RULE — NON-NEGOTIABLE
- Detect the language of every incoming customer message automatically
- ALWAYS reply in the EXACT same language the customer used
- If the customer switches language mid-conversation, you switch immediately
- This applies to all supported languages: English, Hindi, Spanish, French, Arabic, German, Portuguese, and more

## YOUR CAPABILITIES
- Answer questions about orders, shipping, returns, payments, and accounts using the knowledge base
- Provide empathetic, step-by-step guidance for any issue
- Identify frustrated customers and respond with extra care
- Seamlessly escalate to human agents when needed

## ESCALATION RULES — INTERNAL / INVISIBLE TO CUSTOMER
Append the exact tag [ESCALATE] as the very last line when ANY of these apply:
1. Customer asks to speak with a human / live agent
2. Abusive language or extreme anger for 2+ turns
3. Mentions legal action, chargebacks, or fraud
4. Same issue unresolved for 3+ turns
5. Order value over $500 with unresolved complaint
6. Safety, health, or medical concern about a product
7. Suspected account security breach
CRITICAL: Never mention [ESCALATE] to the customer.

## MANDATORY SUGGESTIONS FORMAT
Every response MUST end with:
SUGGESTIONS: <option 1> | <option 2> | <option 3>
- Exactly 3 options, pipe-separated
- Max 7 words each, contextually relevant
- If escalating, one must be "Talk to a human agent"

## GROUNDING RULE
Only use information in the KNOWLEDGE BASE below.
If unsure, say "Let me get a specialist for that" and append [ESCALATE].

## HARD CONSTRAINTS
- Under 220 words (unless process genuinely requires more)
- ALWAYS include SUGGESTIONS — non-negotiable
- Stay in character as ShopAssist${emotionalContext}

## KNOWLEDGE BASE CONTEXT${ragInfo}

${kbContext}
`;
}

// ─── Response Parser ──────────────────────────────────────────────

export interface ParsedGeminiResponse {
  cleanContent: string;
  suggestions: string[];
  isEscalated: boolean;
  rawContent: string;
}

export function parseGeminiResponse(fullText: string): ParsedGeminiResponse {
  let content = fullText.trim();
  const rawContent = content;

  const isEscalated = content.includes("[ESCALATE]");
  content = content.replace(/\[ESCALATE\]/g, "").trim();

  let suggestions: string[] = [];
  const match = content.match(/^SUGGESTIONS:\s*(.+)$/im);
  if (match) {
    suggestions = match[1]
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 3);
    content = content.replace(/^SUGGESTIONS:\s*(.+)$/im, "").trim();
  }

  if (suggestions.length === 0) {
    suggestions = ["Track my order", "Return an item", "Talk to a human agent"];
  }

  const cleanContent = content.replace(/\n{3,}/g, "\n\n").trim();
  return { cleanContent, suggestions, isEscalated, rawContent };
}

// ─── History Converter ────────────────────────────────────────────

export function buildGeminiHistory(messages: Message[]): Content[] {
  return messages
    .filter((m) => !m.isStreaming && m.content.trim().length > 0)
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }));
}

// ─── SSE Event ────────────────────────────────────────────────────

export interface GeminiSSEEvent {
  type: "chunk" | "metadata" | "done" | "error";
  content?: string;
  suggestions?: string[];
  isEscalated?: boolean;
  sentiment?: SentimentScore; // ← NEW: user message sentiment
  language?: string; // ← NEW: detected language BCP-47
  error?: string;
}

// ─── Stream Options ───────────────────────────────────────────────

export interface StreamOptions {
  sentiment?: SentimentScore;
  language?: string;
}

// ─── Main Streaming Function ──────────────────────────────────────

export async function createGeminiStream(
  userMessage: string,
  conversationHistory: Message[],
  options: StreamOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const { sentiment, language = "en" } = options;

  const emit = (
    ctrl: ReadableStreamDefaultController<Uint8Array>,
    event: GeminiSSEEvent,
  ) => ctrl.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const geminiHistory = buildGeminiHistory(conversationHistory);

        // RAG + emotional context system prompt
        const systemPrompt = buildSystemPrompt(userMessage, sentiment);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          systemInstruction: systemPrompt,
          safetySettings: SAFETY_SETTINGS,
          generationConfig: GENERATION_CONFIG,
        });

        const chat = model.startChat({ history: geminiHistory });
        const result = await chat.sendMessageStream(userMessage);
        let fullText = "";

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) fullText += text;
        }

        const { cleanContent, suggestions, isEscalated } =
          parseGeminiResponse(fullText);

        // Re-stream word-by-word
        const tokens = cleanContent.split(/(\s+)/);
        for (const token of tokens) {
          if (token) {
            emit(controller, { type: "chunk", content: token });
            await new Promise((r) => setTimeout(r, 14));
          }
        }

        // Metadata now includes sentiment + language
        emit(controller, {
          type: "metadata",
          suggestions,
          isEscalated,
          sentiment,
          language,
        });

        if (isEscalated) console.log("[Gemini] 🚨 Escalation triggered");
        emit(controller, { type: "done" });
      } catch (error) {
        console.error("[Gemini] Stream error:", error);

        let errorMsg =
          "I'm having a little trouble — please try again in a moment.";
        if (error instanceof Error) {
          const m = error.message.toLowerCase();
          if (m.includes("api_key") || m.includes("api key"))
            errorMsg =
              "API configuration error. Please contact the store administrator.";
          else if (m.includes("quota") || m.includes("rate limit"))
            errorMsg =
              "I'm experiencing high demand. Please wait a few seconds and try again.";
          else if (m.includes("safety"))
            errorMsg =
              "I wasn't able to generate a response. Please rephrase and try again.";
        }

        emit(controller, { type: "error", error: errorMsg });
      } finally {
        controller.close();
      }
    },
  });
}
