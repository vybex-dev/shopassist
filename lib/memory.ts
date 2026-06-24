/**
 * lib/memory.ts
 * ─────────────────────────────────────────────────────────────────
 * Conversation memory management for ShopAssist.
 *
 * Responsibilities:
 *  - Estimate token usage for messages (no API call needed)
 *  - Trim conversation history to stay within a safe token budget
 *    using a sliding window that always preserves the system context
 *  - Provide conversation metadata helpers
 *
 * Why not use Gemini's full 1M-token window?
 *  - Cost & latency grow linearly with context length
 *  - For customer support, 20–30 turns is always enough
 *  - Keeping context tight makes responses faster and more focused
 * ─────────────────────────────────────────────────────────────────
 */

import type { Message, SentimentLabel } from "@/types";

// ─── Tunable constants ────────────────────────────────────────────

export const MEMORY_CONFIG = {
  /**
   * Maximum token budget for conversation history passed to Gemini.
   * The system prompt + KB uses ~2 000 tokens.
   * Gemini 1.5 Flash has a 1M token input window; we stay well under
   * to keep latency low and costs minimal.
   */
  MAX_HISTORY_TOKENS: 6_000,

  /**
   * Hard cap on number of message turns kept (regardless of tokens).
   * One "turn" = one message (user or assistant).
   * 30 turns ≈ 15 back-and-forth exchanges — plenty for support.
   */
  MAX_TURNS: 30,

  /**
   * When trimming, we always keep this many of the MOST RECENT turns
   * even if they push us slightly over the token budget.
   * Prevents losing the last thing the user said.
   */
  MIN_RECENT_TURNS: 6,

  /**
   * Rough characters-per-token ratio for English text.
   * Gemini uses ~4 chars/token on average.
   */
  CHARS_PER_TOKEN: 4,

  /**
   * sessionStorage key for the conversation ID.
   */
  SESSION_STORAGE_KEY: "shopassist_conversation_id",
} as const;

// ─── Token estimation ─────────────────────────────────────────────

/**
 * Estimates token count for a string.
 * Deliberately simple — we don't need an exact count, just a
 * conservative upper bound to avoid sending too much context.
 *
 * @param text  Any string
 * @returns     Estimated token count
 */
export function estimateTokens(text: string): number {
  // Add 20% safety margin on top of the char÷4 estimate
  return Math.ceil((text.length / MEMORY_CONFIG.CHARS_PER_TOKEN) * 1.2);
}

/**
 * Estimates total tokens for an array of messages.
 *
 * @param messages  Conversation history
 * @returns         Cumulative estimated token count
 */
export function estimateHistoryTokens(messages: Message[]): number {
  return messages.reduce((total, msg) => {
    // 4 tokens of overhead per message (role label, separators)
    return total + estimateTokens(msg.content) + 4;
  }, 0);
}

// ─── History trimming ─────────────────────────────────────────────

/**
 * Trims conversation history to stay within the token budget.
 *
 * Strategy — sliding window from the end:
 *  1. Always keep the MIN_RECENT_TURNS most recent messages
 *  2. Work backwards from there, adding older messages as long as
 *     the cumulative token count stays under MAX_HISTORY_TOKENS
 *  3. Never exceed MAX_TURNS regardless of token count
 *
 * This guarantees the AI always sees the latest exchange (most
 * important for context) and as much history as budget allows.
 *
 * @param messages  Full conversation history
 * @param budget    Token budget (defaults to MEMORY_CONFIG.MAX_HISTORY_TOKENS)
 * @returns         Trimmed history safe to send to Gemini
 */
export function trimHistory(
  messages: Message[],
  budget: number = MEMORY_CONFIG.MAX_HISTORY_TOKENS,
): Message[] {
  // Filter out incomplete streaming messages — never send them
  const completed = messages.filter(
    (m) => !m.isStreaming && m.content.trim().length > 0,
  );

  // Hard turn cap
  const cappedByTurns = completed.slice(-MEMORY_CONFIG.MAX_TURNS);

  // If we're comfortably within budget, return as-is
  const totalTokens = estimateHistoryTokens(cappedByTurns);
  if (totalTokens <= budget) {
    return cappedByTurns;
  }

  // Sliding window: start with the minimum recent messages,
  // then try to add older ones from right to left
  const minRecent = cappedByTurns.slice(-MEMORY_CONFIG.MIN_RECENT_TURNS);
  const candidates = cappedByTurns.slice(0, -MEMORY_CONFIG.MIN_RECENT_TURNS);
  let usedTokens = estimateHistoryTokens(minRecent);
  const extraToKeep: Message[] = [];

  // Walk backwards through older messages
  for (let i = candidates.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(candidates[i].content) + 4;
    if (usedTokens + msgTokens <= budget) {
      extraToKeep.unshift(candidates[i]);
      usedTokens += msgTokens;
    } else {
      // No point continuing — older messages are even larger cumulatively
      break;
    }
  }

  return [...extraToKeep, ...minRecent];
}

// ─── Conversation metadata ────────────────────────────────────────

/**
 * Returns a compact debug string summarising the current context.
 * Used for console logging only.
 *
 * Example output: "8 msgs | ~1 240 tokens | last: user"
 */
export function buildContextSummary(messages: Message[]): string {
  const trimmed = trimHistory(messages);
  const tokens = estimateHistoryTokens(trimmed);
  const last = trimmed[trimmed.length - 1]?.role ?? "none";
  return `${trimmed.length} msgs | ~${tokens.toLocaleString()} tokens | last: ${last}`;
}

/**
 * Returns the dominant sentiment across all messages for logging.
 * Used later by the DB layer (Step 10).
 */
export function getDominantSentiment(messages: Message[]): SentimentLabel {
  const counts: Record<SentimentLabel, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
    angry: 0,
  };

  for (const msg of messages) {
    if (msg.sentiment?.label) {
      counts[msg.sentiment.label]++;
    }
  }

  // Priority: angry > negative > neutral > positive
  if (counts.angry > 0) return "angry";
  if (counts.negative > 0) return "negative";
  if (counts.neutral > 0) return "neutral";
  return "positive";
}

/**
 * Detects the most recently used language in the conversation.
 * Falls back to "en" if no language tag is available.
 */
export function getActiveLanguage(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].language) return messages[i].language!;
  }
  return "en";
}

// ─── Conversation ID ──────────────────────────────────────────────

/**
 * Gets or creates a stable conversation UUID for the current session.
 * Stored in sessionStorage so it survives page refreshes within the
 * same tab but resets when the tab is closed (correct behaviour).
 */
export function getOrCreateConversationId(): string {
  if (typeof window === "undefined") {
    // SSR fallback — generate ephemeral ID
    return crypto.randomUUID();
  }

  const KEY = MEMORY_CONFIG.SESSION_STORAGE_KEY;
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;

  const newId = crypto.randomUUID();
  sessionStorage.setItem(KEY, newId);
  return newId;
}

/**
 * Creates a brand-new conversation ID and writes it to sessionStorage.
 * Call this when the user clicks "Clear chat".
 */
export function createNewConversationId(): string {
  const newId = crypto.randomUUID();
  if (typeof window !== "undefined") {
    sessionStorage.setItem(MEMORY_CONFIG.SESSION_STORAGE_KEY, newId);
  }
  return newId;
}

/**
 * Clears the stored conversation ID from sessionStorage.
 */
export function clearConversationId(): void {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(MEMORY_CONFIG.SESSION_STORAGE_KEY);
  }
}
