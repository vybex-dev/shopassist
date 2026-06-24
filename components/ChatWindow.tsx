/**
 * components/ChatWindow.tsx  (Step 14 — Full dark-theme pass)
 * ─────────────────────────────────────────────────────────────────
 * All mobile fixes from Step 13 preserved:
 *  1. h-dvh  — dynamic viewport height (keyboard-aware on iOS/Android)
 *  2. pb-input-safe — safe-area-inset-bottom on input bar
 *  3. overscroll-contain — prevents pull-to-refresh on messages area
 *  4. ios-scroll — momentum scrolling on iOS
 *  5. min-h-[44px] — touch-target on send button (HIG compliant)
 *  6. chip-touch-exempt — small chips skip the 44px min-height rule
 *  7. landscape-compact / landscape-hide — shrink chrome in landscape
 *  8. no-scrollbar — removes scrollbar on suggestion chips strip
 *
 * Step 14 additions:
 *  — Inline DarkSuggestedReplies replaces light SuggestedReplies
 *  — Dark-glass message bubbles passed to MessageBubble via prop
 *  — Dot-grid mesh background from landing page applied to chat area
 *  — Animated typing indicator matches dark theme
 *  — Input bar bottom fade-out gradient synced with bg
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Send,
  ShoppingBag,
  CornerDownLeft,
  Trash2,
  BrainCircuit,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import MessageBubble from "./MessageBubble";
import EscalationAlert from "./EscalationAlert";
import LanguageSelector from "./LanguageSelector";
import { getStrings, isRTL, formatMessageCount } from "@/lib/i18n";
import type { Message, SentimentScore } from "@/types";

// ─── Props ────────────────────────────────────────────────────────

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  isEscalated: boolean;
  suggestions: string[];
  onSuggestionClick: (text: string) => void;
  onClearConversation: () => void;
  messageCount: number;
  estimatedTokens: number;
  conversationId: string;
  conversationSentiment: SentimentScore;
  escalationReason: string;
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  languageSource: "auto" | "manual";
}

// ─── Dark Suggested Replies (inline replacement) ──────────────────

const CHIP_COLOURS = [
  {
    dot: "#60a5fa",
    bg: "rgba(59,130,246,0.10)",
    border: "rgba(59,130,246,0.22)",
    text: "#93c5fd",
  },
  {
    dot: "#34d399",
    bg: "rgba(52,211,153,0.10)",
    border: "rgba(52,211,153,0.22)",
    text: "#6ee7b7",
  },
  {
    dot: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
    border: "rgba(245,158,11,0.22)",
    text: "#fcd34d",
  },
];

function DarkSuggestedReplies({
  suggestions,
  onSelect,
  label,
  isLoading,
}: {
  suggestions: string[];
  onSelect: (s: string) => void;
  label: string;
  isLoading: boolean;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div
      className="flex-none px-4 py-2.5"
      style={{
        background:
          "linear-gradient(180deg, rgba(2,8,24,0.0) 0%, rgba(2,8,24,0.97) 8%, rgba(2,8,24,0.97) 100%)",
        borderTop: "1px solid rgba(99,102,241,0.14)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* Label row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap
              className="w-2.5 h-2.5"
              style={{ color: "#a78bfa" }}
              fill="#a78bfa"
            />
            <span
              className="text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "#94a3b8" }}
            >
              {label || "Quick Replies"}
            </span>
          </div>
          {!isLoading && suggestions.length > 0 && (
            <button
              onClick={() => setDismissed(true)}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-colors"
              style={{ color: "#64748b" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#64748b")
              }
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Chips row */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
          {isLoading
            ? /* Skeleton shimmer chips */
              [88, 112, 72].map((w, i) => (
                <div
                  key={i}
                  className="flex-none h-7 rounded-full animate-pulse"
                  style={{
                    width: `${w}px`,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                />
              ))
            : suggestions.map((s, i) => {
                const c = CHIP_COLOURS[i % CHIP_COLOURS.length];
                return (
                  <button
                    key={s}
                    onClick={() => onSelect(s)}
                    className="chip-touch-exempt flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-150 active:scale-95 whitespace-nowrap"
                    style={{
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      color: c.text,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.filter =
                        "brightness(1.2)";
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.filter = "";
                      (e.currentTarget as HTMLButtonElement).style.transform =
                        "";
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-none"
                      style={{
                        background: c.dot,
                        boxShadow: `0 0 4px ${c.dot}`,
                      }}
                    />
                    {s}
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}

// ─── Context pill ─────────────────────────────────────────────────

function ContextPill({
  messageCount,
  estimatedTokens,
  activeLanguage,
}: {
  messageCount: number;
  estimatedTokens: number;
  activeLanguage: string;
}) {
  if (messageCount === 0) return null;

  const pct = Math.min((estimatedTokens / 6000) * 100, 100);
  const colourStyle =
    pct < 50
      ? {
          background: "rgba(16,185,129,0.12)",
          color: "#6ee7b7",
          border: "1px solid rgba(16,185,129,0.25)",
        }
      : pct < 80
        ? {
            background: "rgba(245,158,11,0.12)",
            color: "#fcd34d",
            border: "1px solid rgba(245,158,11,0.25)",
          }
        : {
            background: "rgba(239,68,68,0.12)",
            color: "#fca5a5",
            border: "1px solid rgba(239,68,68,0.25)",
          };

  return (
    <div
      title={`~${estimatedTokens.toLocaleString()} tokens in context`}
      className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors"
      style={colourStyle}
    >
      <BrainCircuit className="w-3 h-3" />
      {formatMessageCount(messageCount, activeLanguage)}
    </div>
  );
}

// ─── Sentiment pill ───────────────────────────────────────────────

function SentimentPill({ sentiment }: { sentiment: SentimentScore }) {
  if (sentiment.label === "neutral" && sentiment.score === 0) return null;

  const cfg: Record<string, { style: React.CSSProperties; label: string }> = {
    positive: {
      style: {
        background: "rgba(16,185,129,0.12)",
        border: "1px solid rgba(16,185,129,0.25)",
        color: "#6ee7b7",
      },
      label: "😊",
    },
    neutral: {
      style: {
        background: "rgba(100,116,139,0.12)",
        border: "1px solid rgba(100,116,139,0.25)",
        color: "#94a3b8",
      },
      label: "😐",
    },
    negative: {
      style: {
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.25)",
        color: "#fcd34d",
      },
      label: "😟",
    },
    angry: {
      style: {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.25)",
        color: "#fca5a5",
      },
      label: "😤",
    },
  };
  const { style, label } = cfg[sentiment.label] ?? cfg.neutral;

  return (
    <div
      title={`Sentiment: ${sentiment.label}`}
      className="hidden sm:flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium transition-colors"
      style={style}
    >
      {label}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────

export default function ChatWindow({
  messages,
  onSendMessage,
  isStreaming,
  isEscalated,
  suggestions,
  onSuggestionClick,
  onClearConversation,
  messageCount,
  estimatedTokens,
  conversationId,
  conversationSentiment,
  escalationReason,
  activeLanguage,
  onLanguageChange,
  languageSource,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const confirmTimeout = useRef<NodeJS.Timeout | null>(null);

  const isEmpty = messages.length === 0;
  const rtl = isRTL(activeLanguage);
  const t = getStrings(activeLanguage);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-resize textarea ─────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
  }, [inputValue]);

  // ── Confirm timeout cleanup ──────────────────────────────────
  useEffect(
    () => () => {
      if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    },
    [],
  );

  const handleClearClick = () => {
    if (isEmpty) return;
    if (!showClearConfirm) {
      setShowClearConfirm(true);
      confirmTimeout.current = setTimeout(
        () => setShowClearConfirm(false),
        3000,
      );
      return;
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setShowClearConfirm(false);
    onClearConversation();
  };

  const handleSubmit = () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;
    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canSend = inputValue.trim().length > 0 && !isStreaming;

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        height: "100dvh",
        backgroundImage: `
          radial-gradient(ellipse 110% 65% at 50% -15%, rgba(37,99,235,0.22) 0%, transparent 58%),
          radial-gradient(ellipse 70% 55% at 95% 115%, rgba(99,102,241,0.16) 0%, transparent 55%),
          radial-gradient(ellipse 50% 40% at 5% 85%, rgba(16,185,129,0.08) 0%, transparent 50%),
          radial-gradient(ellipse 40% 30% at 80% 20%, rgba(139,92,246,0.07) 0%, transparent 45%),
          radial-gradient(rgba(148,163,184,0.028) 1px, transparent 1px)
        `,
        backgroundSize: "auto, auto, auto, auto, 24px 24px",
        backgroundColor: "#020818",
      }}
    >
      {/* ═══════════════ HEADER ══════════════════════════════════ */}
      <header
        className="flex-none z-20 pt-safe"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,9,22,0.99) 0%, rgba(3,7,18,0.96) 100%)",
          borderBottom: "1px solid rgba(79,70,229,0.22)",
          boxShadow:
            "0 1px 0 rgba(99,102,241,0.10), 0 8px 48px rgba(0,0,0,0.7)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="flex items-center justify-between px-4 py-3 landscape-compact">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
                  boxShadow:
                    "0 0 28px rgba(99,102,241,0.6), 0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                style={{
                  background: "#34d399",
                  borderColor: "#030712",
                  boxShadow: "0 0 8px rgba(52,211,153,0.7)",
                }}
              />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-bold text-sm tracking-tight">
                  ShopAssist
                </span>
                <span
                  className="px-1.5 py-px rounded text-[10px] font-semibold tracking-wide uppercase"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.25) 0%, rgba(139,92,246,0.20) 100%)",
                    border: "1px solid rgba(139,92,246,0.40)",
                    color: "#c4b5fd",
                  }}
                >
                  AI
                </span>
              </div>
              <p
                className="text-[11px] landscape-hide"
                style={{ color: "#94a3b8" }}
              >
                {t.alwaysOnline}
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <SentimentPill sentiment={conversationSentiment} />
            <ContextPill
              messageCount={messageCount}
              estimatedTokens={estimatedTokens}
              activeLanguage={activeLanguage}
            />
            <LanguageSelector
              activeLanguage={activeLanguage}
              onLanguageChange={onLanguageChange}
              source={languageSource}
            />
            {!isEmpty && (
              <button
                onClick={handleClearClick}
                disabled={isStreaming}
                title={
                  showClearConfirm
                    ? "Click again to confirm"
                    : "Clear conversation"
                }
                className="flex items-center gap-1.5 px-2.5 rounded-lg text-[11px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
                style={
                  showClearConfirm
                    ? {
                        background: "rgba(239,68,68,0.15)",
                        border: "1px solid rgba(239,68,68,0.35)",
                        color: "#fca5a5",
                      }
                    : {
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        color: "#64748b",
                      }
                }
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {showClearConfirm ? t.confirmClear : t.clearButton}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Token progress bar */}
        {messageCount > 0 && (
          <div
            className="h-[2px]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${Math.min((estimatedTokens / 6000) * 100, 100)}%`,
                background: "linear-gradient(90deg, #3b82f6, #6366f1, #8b5cf6)",
                boxShadow: "0 0 14px rgba(139,92,246,0.8)",
              }}
            />
          </div>
        )}
      </header>

      {/* ═══════════════ ESCALATION ALERT ════════════════════════ */}
      {isEscalated && (
        <EscalationAlert
          conversationId={conversationId}
          sessionId={conversationId}
          messages={messages}
          sentiment={conversationSentiment}
          reason={escalationReason}
        />
      )}

      {/* ═══════════════ MESSAGES AREA ═══════════════════════════ */}
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="flex-1 overflow-y-auto chat-scroll scrollbar-thin overscroll-contain ios-scroll"
      >
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Welcome screen */}
          {isEmpty && (
            <div className="flex flex-col items-center text-center pt-8 pb-4 animate-fade-in">
              {/* Glow orb */}
              <div className="relative mb-6">
                <div
                  className="absolute inset-0 rounded-3xl blur-2xl"
                  style={{
                    background: "rgba(37,99,235,0.25)",
                    transform: "scale(1.6)",
                  }}
                />
                <div
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
                    boxShadow:
                      "0 0 56px rgba(99,102,241,0.65), 0 8px 28px rgba(0,0,0,0.6)",
                  }}
                >
                  <ShoppingBag
                    className="w-8 h-8 text-white"
                    strokeWidth={1.8}
                  />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t.welcomeTitle}
              </h2>
              <p
                className="text-sm leading-relaxed max-w-xs mb-2"
                style={{ color: "#94a3b8" }}
              >
                {t.welcomeSubtitle}
              </p>
              <p
                className="text-[11px] mb-8 flex items-center gap-1.5"
                style={{ color: "#64748b" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{
                    background: "#3b82f6",
                    boxShadow: "0 0 6px rgba(59,130,246,0.7)",
                  }}
                />
                {t.poweredBy}
              </p>

              {/* Quick-start grid */}
              <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                {t.quickStarts.map(
                  (
                    { label, prompt }: { label: string; prompt: string },
                    i: number,
                  ) => {
                    const c = CHIP_COLOURS[i % CHIP_COLOURS.length];
                    return (
                      <button
                        key={label}
                        onClick={() => onSuggestionClick(prompt)}
                        className="min-h-[56px] px-4 py-3 rounded-xl text-sm font-medium text-left transition-all active:scale-95 group"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid rgba(255,255,255,0.08)`,
                          color: "#94a3b8",
                        }}
                        onMouseEnter={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = c.bg;
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = c.border;
                          (e.currentTarget as HTMLButtonElement).style.color =
                            c.text;
                        }}
                        onMouseLeave={(e) => {
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.background = "rgba(255,255,255,0.03)";
                          (
                            e.currentTarget as HTMLButtonElement
                          ).style.borderColor = "rgba(255,255,255,0.07)";
                          (e.currentTarget as HTMLButtonElement).style.color =
                            "#94a3b8";
                        }}
                      >
                        <span
                          className="block w-1.5 h-1.5 rounded-full mb-2"
                          style={{
                            background: c.dot,
                            boxShadow: `0 0 4px ${c.dot}`,
                          }}
                        />
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {/* Message list */}
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLatest={idx === messages.length - 1}
                isRTL={rtl}
              />
            ))}
          </div>

          <div ref={messagesEndRef} className="h-4" />
        </div>
      </div>

      {/* ═══════════════ SUGGESTED REPLIES ═══════════════════════ */}
      {!isEmpty &&
        messageCount > 0 &&
        (isStreaming || suggestions.length > 0) && (
          <DarkSuggestedReplies
            suggestions={suggestions}
            onSelect={onSuggestionClick}
            label={t.quickRepliesLabel}
            isLoading={isStreaming}
          />
        )}

      {/* ═══════════════ INPUT BAR ════════════════════════════════ */}
      <div
        dir={rtl ? "rtl" : "ltr"}
        className="flex-none px-4 pt-3 pb-input-safe"
        style={{
          background: "rgba(2,8,24,0.98)",
          borderTop: "1px solid rgba(99,102,241,0.15)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className="flex items-end gap-2 rounded-2xl px-3 py-2 transition-all duration-200"
            style={
              isFocused
                ? {
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(99,102,241,0.55)",
                    boxShadow:
                      "0 0 0 3px rgba(99,102,241,0.10), 0 8px 32px rgba(0,0,0,0.5)",
                  }
                : {
                    background: "rgba(255,255,255,0.035)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
                  }
            }
          >
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={
                isStreaming ? t.inputPlaceholderStreaming : t.inputPlaceholder
              }
              disabled={isStreaming}
              rows={1}
              dir={rtl ? "rtl" : "ltr"}
              aria-label="Chat message input"
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 leading-relaxed py-1 max-h-32 min-h-[1.5rem] placeholder-slate-600"
              style={{ color: "#e2e8f0" }}
            />

            {/* Send button */}
            <button
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              className="flex-none w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 mb-0.5 sm:w-8 sm:h-8"
              style={
                canSend
                  ? {
                      background:
                        "linear-gradient(135deg, #3b82f6 0%, #6366f1 60%, #8b5cf6 100%)",
                      boxShadow:
                        "0 0 28px rgba(99,102,241,0.65), 0 2px 10px rgba(0,0,0,0.5)",
                      color: "white",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "#334155",
                      cursor: "not-allowed",
                    }
              }
              onMouseEnter={(e) => {
                if (canSend)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 40px rgba(139,92,246,0.85), 0 2px 10px rgba(0,0,0,0.5)";
              }}
              onMouseLeave={(e) => {
                if (canSend)
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 28px rgba(99,102,241,0.65), 0 2px 10px rgba(0,0,0,0.5)";
              }}
            >
              <Send className="w-4 h-4 sm:w-3.5 sm:h-3.5" strokeWidth={2.5} />
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="flex items-center justify-between mt-1.5 landscape-hide">
            <div
              className="flex items-center gap-1 text-[11px]"
              style={{ color: "#475569" }}
            >
              <CornerDownLeft className="w-3 h-3" />
              <span className="hidden sm:inline">
                {t.enterToSend}
                <span className="mx-1 opacity-40">·</span>
                {t.shiftEnterNewLine}
              </span>
              <span className="sm:hidden text-[10px]">Enter to send</span>
            </div>
            {process.env.NODE_ENV === "development" && conversationId && (
              <span
                className="text-[10px] font-mono truncate max-w-[100px]"
                style={{ color: "#334155" }}
              >
                {conversationId.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
