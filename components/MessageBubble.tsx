/**
 * components/MessageBubble.tsx
 * ─────────────────────────────────────────────────────────────────
 * Renders a single chat message bubble.
 *
 * States handled:
 *  - User message       → right-aligned, blue gradient bubble
 *  - Bot message        → left-aligned, white bubble with avatar
 *  - Streaming (empty)  → typing indicator (three bouncing dots)
 *  - Streaming (partial)→ text with blinking cursor at end
 *  - Complete           → text + formatted timestamp
 *
 * Formatting:
 *  - Newlines → line breaks
 *  - Numbered lists (^1. ) → rendered as proper list items
 *  - Bold (**text**) → <strong>
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import React from "react";
import { ShoppingBag, User } from "lucide-react";
import type { Message } from "@/types";

// ─── Props ────────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: Message;
  isLatest: boolean;
  isRTL?: boolean; // ← NEW: right-to-left text direction
}
// ─── Helpers ──────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Inline markdown: bold + line breaks + numbered list items
function formatContent(text: string): React.ReactNode[] {
  const lines = text.split("\n");

  return lines.map((line, lineIdx) => {
    const isLast = lineIdx === lines.length - 1;
    const isNumList = /^\d+\.\s/.test(line.trim());

    // Tokenise the line into bold / plain spans
    const tokens = line.split(/(\*\*[^*]+\*\*)/g);
    const richLine = tokens.map((token, i) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold">
            {token.slice(2, -2)}
          </strong>
        );
      }
      return <React.Fragment key={i}>{token}</React.Fragment>;
    });

    return (
      <React.Fragment key={lineIdx}>
        {isNumList ? (
          <span className="flex gap-2">
            <span className="shrink-0 font-semibold opacity-60">
              {line.match(/^(\d+\.)/)?.[1]}
            </span>
            <span>
              {richLine.map(
                (t) => (t as React.ReactElement).props?.children ?? t,
              )}
            </span>
          </span>
        ) : (
          richLine
        )}
        {!isLast && <br />}
      </React.Fragment>
    );
  });
}

// ─── Typing indicator ─────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      <span
        className="w-2 h-2 rounded-full dot-1"
        style={{ background: "#818cf8" }}
      />
      <span
        className="w-2 h-2 rounded-full dot-2"
        style={{ background: "#818cf8" }}
      />
      <span
        className="w-2 h-2 rounded-full dot-3"
        style={{ background: "#818cf8" }}
      />
    </div>
  );
}

// ─── Bubble component ─────────────────────────────────────────────

export default function MessageBubble({
  message,
  isLatest,
  isRTL = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmpty = !message.content && message.isStreaming;

  return (
    <div
      className={`
        flex items-end gap-2 animate-slide-up
        ${isUser ? "flex-row-reverse" : "flex-row"}
      `}
    >
      {/* ── Avatar ─────────────────────────────────────────────── */}
      <div
        className={`
          flex-none w-7 h-7 rounded-lg flex items-center justify-center
          shadow-sm mb-0.5 shrink-0
          ${isUser ? "bg-slate-700" : ""}
        `}
        style={
          !isUser
            ? {
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 0 14px rgba(99,102,241,0.5)",
              }
            : undefined
        }
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        ) : (
          <ShoppingBag className="w-3.5 h-3.5 text-white" strokeWidth={2} />
        )}
      </div>

      {/* ── Bubble + timestamp ────────────────────────────────── */}
      <div
        className={`
          flex flex-col gap-1
          ${isUser ? "items-end" : "items-start"}
          max-w-[78%] sm:max-w-[68%]
        `}
      >
        {/* Bubble */}
        <div
          className={`
            px-4 py-2.5 text-sm leading-relaxed
            ${isEmpty ? "min-w-[60px]" : ""}
            ${
              isUser
                ? `
                bg-gradient-to-br from-blue-500 to-blue-700
                text-white shadow-md
                rounded-2xl rounded-br-sm
              `
                : `
                rounded-2xl rounded-bl-sm
              `
            }
          `}
          style={
            !isUser
              ? {
                  background:
                    "linear-gradient(135deg, rgba(15,20,45,0.96) 0%, rgba(22,32,68,0.96) 100%)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  boxShadow:
                    "0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
                  color: "#e2e8f0",
                }
              : undefined
          }
        >
          {/* Content states */}
          {isEmpty ? (
            <TypingDots />
          ) : (
            <span
              dir={isRTL ? "rtl" : "ltr"}
              className="whitespace-pre-wrap break-words"
            >
              {formatContent(message.content)}
              {message.isStreaming && (
                <span className="streaming-cursor" aria-hidden="true" />
              )}
            </span>
          )}
        </div>

        {/* Timestamp + sentiment indicator */}
        {!message.isStreaming && !isEmpty && (
          <div className="flex items-center gap-1.5 px-1">
            <time
              dateTime={message.timestamp}
              className="text-[10px] tabular-nums"
              style={{ color: "#64748b" }}
            >
              {formatTime(message.timestamp)}
            </time>

            {/* Sentiment dot — only on completed user messages */}
            {isUser &&
              message.sentiment &&
              message.sentiment.label !== "neutral" && (
                <span
                  title={`Sentiment: ${message.sentiment.label} (${message.sentiment.score})`}
                  aria-label={message.sentiment.label}
                  className={`
          inline-block w-1.5 h-1.5 rounded-full flex-none
          ${message.sentiment.label === "positive" ? "bg-emerald-400" : ""}
          ${message.sentiment.label === "negative" ? "bg-amber-400" : ""}
          ${message.sentiment.label === "angry" ? "bg-red-500" : ""}
        `}
                />
              )}
          </div>
        )}
      </div>
    </div>
  );
}
