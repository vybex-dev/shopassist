/**
 * app/chat/page.tsx  (Step 10 — Supabase fire-and-forget save)
 * ─────────────────────────────────────────────────────────────────
 * Changes from Step 8:
 *  - saveConversationToServer() fires after every "done" SSE event
 *  - Uses conversationId as the upsert key
 *  - Non-blocking: errors are logged but never surface to user
 *  - isSaving state shows subtle "Saving…" indicator (dev mode)
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ChatWindow from "@/components/ChatWindow";
import {
  trimHistory,
  buildContextSummary,
  getOrCreateConversationId,
  createNewConversationId,
  estimateHistoryTokens,
} from "@/lib/memory";
import type { Message, SentimentScore } from "@/types";

const INITIAL_SUGGESTIONS = [
  "Track my order",
  "Return an item",
  "Payment help",
];

// ─── Helpers ──────────────────────────────────────────────────────

function deriveEscalationReason(
  sentiment: SentimentScore | null,
  messageText: string,
): string {
  if (!sentiment) return "Escalation triggered by support system";
  const lower = messageText.toLowerCase();
  if (
    lower.includes("lawyer") ||
    lower.includes("legal") ||
    lower.includes("sue")
  )
    return "Customer mentioned legal action";
  if (lower.includes("chargeback") || lower.includes("dispute"))
    return "Customer mentioned a payment dispute";
  if (
    lower.includes("manager") ||
    lower.includes("supervisor") ||
    lower.includes("human")
  )
    return "Customer requested a human agent";
  if (sentiment.label === "angry")
    return `High frustration detected — sentiment score ${sentiment.score}`;
  return "Repeated negative sentiment across conversation turns";
}

// ─── DB save helper ───────────────────────────────────────────────

async function saveConversationToServer(params: {
  conversationId: string;
  sessionId: string;
  messages: Message[];
  isEscalated: boolean;
  conversationSentiment: SentimentScore;
  activeLanguage: string;
}): Promise<void> {
  try {
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: params.conversationId,
        sessionId: params.sessionId,
        messages: params.messages,
        isEscalated: params.isEscalated,
        sentiment: params.conversationSentiment,
        language: params.activeLanguage,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.warn("[DB Save] Failed:", err.error ?? `HTTP ${response.status}`);
      return;
    }

    if (process.env.NODE_ENV === "development") {
      const data = await response.json();
      console.log(
        `[DB Save] ${data.persisted ? "✅ Persisted to Supabase" : "⚠️  Memory only"} — ` +
          `${data.messageCount} messages`,
      );
    }
  } catch (err) {
    // Never throw — this is fire-and-forget
    console.warn("[DB Save] Network error:", err);
  }
}

// ─── Page ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>(INITIAL_SUGGESTIONS);
  const [conversationId, setConversationId] = useState("");
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  const [escalationReason, setEscalationReason] = useState(
    "Escalation triggered",
  );
  const [conversationSentiment, setConversationSentiment] =
    useState<SentimentScore>({ label: "neutral", score: 0, escalate: false });
  const [activeLanguage, setActiveLanguage] = useState("en");
  const [languageSource, setLanguageSource] = useState<"auto" | "manual">(
    "auto",
  );

  const messagesRef = useRef<Message[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMsgRef = useRef<string>("");

  // Stable refs for fire-and-forget closure
  const conversationIdRef = useRef(conversationId);
  const isEscalatedRef = useRef(isEscalated);
  const conversationSentRef = useRef(conversationSentiment);
  const activeLanguageRef = useRef(activeLanguage);

  // Keep refs current
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);
  useEffect(() => {
    isEscalatedRef.current = isEscalated;
  }, [isEscalated]);
  useEffect(() => {
    conversationSentRef.current = conversationSentiment;
  }, [conversationSentiment]);
  useEffect(() => {
    activeLanguageRef.current = activeLanguage;
  }, [activeLanguage]);

  useEffect(() => {
    setConversationId(getOrCreateConversationId());
  }, []);

  const handleLanguageChange = useCallback((code: string) => {
    setActiveLanguage(code);
    setLanguageSource("manual");
  }, []);

  const applyMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        setEstimatedTokens(estimateHistoryTokens(trimHistory(next)));
        return next;
      });
    },
    [],
  );

  const clearConversation = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    messagesRef.current = [];
    setIsStreaming(false);
    setIsEscalated(false);
    setSuggestions(INITIAL_SUGGESTIONS);
    setEstimatedTokens(0);
    setConversationSentiment({ label: "neutral", score: 0, escalate: false });
    setEscalationReason("Escalation triggered");
    setActiveLanguage("en");
    setLanguageSource("auto");
    setConversationId(createNewConversationId());
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      lastUserMsgRef.current = trimmed;
      const historySnapshot = [...messagesRef.current];

      const userMsg: Message = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        timestamp: new Date().toISOString(),
      };

      const botMsgId = uuidv4();
      const botMsg: Message = {
        id: botMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };

      applyMessages((prev) => [...prev, userMsg, botMsg]);
      setSuggestions([]);
      setIsStreaming(true);

      const safeHistory = trimHistory([...historySnapshot, userMsg]);

      if (process.env.NODE_ENV === "development") {
        console.log(`[Memory] ${buildContextSummary(safeHistory)}`);
      }

      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            message: trimmed,
            conversationHistory: safeHistory,
            conversationId: conversationIdRef.current,
            sessionId: conversationIdRef.current,
          }),
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.error ?? `HTTP ${response.status}`);
        }
        if (!response.body) throw new Error("Empty response body");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Stable accumulation for the sentiment seen in this turn
        let turnSentiment: SentimentScore | null = null;
        let turnLanguage: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const raw of events) {
            if (!raw.startsWith("data: ")) continue;
            let event: {
              type: "chunk" | "metadata" | "done" | "error";
              content?: string;
              suggestions?: string[];
              isEscalated?: boolean;
              sentiment?: SentimentScore;
              language?: string;
              error?: string;
            };
            try {
              event = JSON.parse(raw.slice(6));
            } catch {
              continue;
            }

            switch (event.type) {
              case "chunk": {
                if (!event.content) break;
                applyMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: m.content + event.content }
                      : m,
                  ),
                );
                break;
              }

              case "metadata": {
                if (event.suggestions?.length)
                  setSuggestions(event.suggestions);

                if (event.language && languageSource !== "manual") {
                  setActiveLanguage(event.language);
                  turnLanguage = event.language;
                }

                if (event.isEscalated && !isEscalatedRef.current) {
                  setIsEscalated(true);
                  setEscalationReason(
                    deriveEscalationReason(
                      event.sentiment ?? null,
                      lastUserMsgRef.current,
                    ),
                  );
                }

                if (event.sentiment || event.language) {
                  applyMessages((prev) =>
                    prev.map((m) =>
                      m.id === userMsg.id
                        ? {
                            ...m,
                            sentiment: event.sentiment ?? m.sentiment,
                            language: event.language ?? m.language,
                          }
                        : m,
                    ),
                  );
                }

                if (event.sentiment) {
                  turnSentiment = event.sentiment;
                  setConversationSentiment((prev) => {
                    const updated = {
                      label: event.sentiment!.label,
                      score:
                        Math.round(
                          (prev.score * 0.6 + event.sentiment!.score * 0.4) *
                            100,
                        ) / 100,
                      escalate: prev.escalate || event.sentiment!.escalate,
                    };
                    conversationSentRef.current = updated;
                    return updated;
                  });
                }
                break;
              }

              case "done": {
                applyMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId ? { ...m, isStreaming: false } : m,
                  ),
                );
                setIsStreaming(false);

                // ── Fire-and-forget DB save ────────────────────────
                // Use refs so we capture the latest state values
                // without stale closure issues
                saveConversationToServer({
                  conversationId: conversationIdRef.current,
                  sessionId: conversationIdRef.current,
                  messages: messagesRef.current,
                  isEscalated: isEscalatedRef.current,
                  conversationSentiment: conversationSentRef.current,
                  activeLanguage: turnLanguage ?? activeLanguageRef.current,
                });
                break;
              }

              case "error": {
                const errText =
                  event.error ??
                  "I'm having trouble right now. Please try again.";
                applyMessages((prev) =>
                  prev.map((m) =>
                    m.id === botMsgId
                      ? { ...m, content: errText, isStreaming: false }
                      : m,
                  ),
                );
                setIsStreaming(false);
                setSuggestions([
                  "Try again",
                  "Track my order",
                  "Talk to a human agent",
                ]);
                break;
              }
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        applyMessages((prev) =>
          prev.map((m) =>
            m.id === botMsgId
              ? {
                  ...m,
                  content:
                    "Connection lost. Please check your network and try again.",
                  isStreaming: false,
                }
              : m,
          ),
        );
        setIsStreaming(false);
        setSuggestions(["Try again", "Track my order", "Contact support"]);
      }
    },
    [isStreaming, applyMessages, languageSource],
  );

  const handleSuggestion = useCallback(
    (text: string) => sendMessage(text),
    [sendMessage],
  );

  return (
    <ChatWindow
      messages={messages}
      onSendMessage={sendMessage}
      isStreaming={isStreaming}
      isEscalated={isEscalated}
      suggestions={suggestions}
      onSuggestionClick={handleSuggestion}
      onClearConversation={clearConversation}
      messageCount={messages.filter((m) => !m.isStreaming).length}
      estimatedTokens={estimatedTokens}
      conversationId={conversationId}
      conversationSentiment={conversationSentiment}
      escalationReason={escalationReason}
      activeLanguage={activeLanguage}
      onLanguageChange={handleLanguageChange}
      languageSource={languageSource}
    />
  );
}
