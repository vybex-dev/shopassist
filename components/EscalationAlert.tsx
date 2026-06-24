/**
 * components/EscalationAlert.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full escalation flow component.
 *
 * States (in order):
 *  "alerting"   → Banner just appeared. Shows reason + action buttons.
 *  "countdown"  → User clicked "I'll wait". 60s countdown fires auto-notify.
 *  "submitting" → POST /api/escalate in flight.
 *  "confirmed"  → Agent notified. Shows confirmation + collapses.
 *  "dismissed"  → User dismissed. Collapses to tiny "Agent notified" bar.
 *
 * User actions available:
 *  - "Call Now"          → tel: link (immediate, no API call)
 *  - "Email & Wait"      → shows email input, POST /api/escalate on submit
 *  - "I'll wait"         → starts countdown, auto-submits after 60s
 *  - Dismiss (×)         → collapses to slim bar
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  X,
  ChevronDown,
  Loader2,
  Headphones,
  ArrowRight,
} from "lucide-react";
import type { Message, SentimentScore } from "@/types";

// ─── Props ────────────────────────────────────────────────────────

interface EscalationAlertProps {
  conversationId: string;
  sessionId: string;
  messages: Message[];
  sentiment: SentimentScore;
  reason?: string;
}

// ─── Constants ───────────────────────────────────────────────────

const COUNTDOWN_SECONDS = 60;
const SUPPORT_PHONE = "1-800-356-9627"; // 1-800-FLOWMART

type EscalationState =
  | "alerting"
  | "email-form"
  | "countdown"
  | "submitting"
  | "confirmed"
  | "dismissed";

// ─── Helpers ─────────────────────────────────────────────────────

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
}

// ─── Component ───────────────────────────────────────────────────

export default function EscalationAlert({
  conversationId,
  sessionId,
  messages,
  sentiment,
  reason = "Escalation triggered",
}: EscalationAlertProps) {
  const [state, setState] = useState<EscalationState>("alerting");
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [escalationId, setEscalationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const hasSubmitted = useRef(false);

  // ── POST to escalation API ────────────────────────────────────
  const submitEscalation = useCallback(
    async (contactEmail?: string) => {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;
      setState("submitting");
      setError(null);

      try {
        const response = await fetch("/api/escalate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            sessionId,
            messages,
            sentiment,
            reason,
            contactEmail: contactEmail || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Failed to notify agent");
        }

        setEscalationId(data.escalationId);
        setState("confirmed");
      } catch (err) {
        hasSubmitted.current = false; // allow retry
        setError(
          err instanceof Error
            ? err.message
            : "Could not reach support servers. Please try the phone number above.",
        );
        setState("alerting");
      }
    },
    [conversationId, sessionId, messages, sentiment, reason],
  );

  // ── Countdown logic ───────────────────────────────────────────
  useEffect(() => {
    if (state !== "countdown") {
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          submitEscalation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [state, submitEscalation]);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ── Email validation ──────────────────────────────────────────
  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleEmailSubmit = () => {
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    submitEscalation(email);
  };

  // ── Countdown progress (0–1) ──────────────────────────────────
  const countdownProgress = countdown / COUNTDOWN_SECONDS;

  // ─────────────────────────────────────────────────────────────
  // RENDER: Dismissed state — just a slim bar
  // ─────────────────────────────────────────────────────────────
  if (state === "dismissed") {
    return (
      <div className="flex-none bg-red-950/40 border-b border-red-800/30 px-4 py-1.5 animate-fade-in">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            <span>Agent notified — expect a response within 5 minutes</span>
          </div>
          {escalationId && (
            <span className="text-red-600 text-[10px] font-mono">
              #{escalationId.slice(0, 8)}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Confirmed state
  // ─────────────────────────────────────────────────────────────
  if (state === "confirmed") {
    return (
      <div className="flex-none bg-emerald-950/40 border-b-2 border-emerald-600/40 px-4 py-3 animate-fade-in">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-300">
                Agent notified successfully
              </p>
              <p className="text-xs text-emerald-500 mt-0.5">
                A FlowMart specialist will reach out within 3–5 minutes. Keep
                this chat open for fastest service.
              </p>
              {escalationId && (
                <p className="text-[10px] text-emerald-700 mt-1 font-mono">
                  Reference: #{escalationId.slice(0, 8)}
                </p>
              )}
            </div>
            <button
              onClick={() => setState("dismissed")}
              className="text-emerald-600 hover:text-emerald-400 transition-colors"
              aria-label="Collapse notification"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER: Main alert panel (alerting / email-form / countdown / submitting)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex-none border-b-2 border-red-500/60 animate-fade-in"
      style={{
        background: "linear-gradient(135deg, #1a0a0a 0%, #1f0f0f 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto px-4 py-3">
        {/* ── Header row ──────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Pulsing alert icon */}
          <div className="escalate-pulse w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle
              className="w-4.5 h-4.5 text-red-400"
              strokeWidth={2.5}
            />
          </div>

          {/* Title + subtitle */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-red-300">
                Human agent requested
              </p>
              <span
                className={`
                px-1.5 py-px rounded text-[10px] font-semibold uppercase tracking-wide
                ${
                  sentiment.label === "angry"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }
              `}
              >
                {sentiment.label === "angry" ? "😤 Angry" : "😟 Frustrated"}
              </span>
            </div>
            <p className="text-xs text-red-400/70 mt-0.5 leading-relaxed">
              {reason.length > 80 ? reason.slice(0, 80) + "…" : reason}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={() => setState("dismissed")}
            aria-label="Dismiss escalation alert"
            className="text-red-600 hover:text-red-400 transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Error message ────────────────────────────────────── */}
        {error && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* ── Phone bar (always visible) ───────────────────────── */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-red-800/30">
          <Headphones className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-xs text-red-300/70 flex-1">
            Speak to an agent now:
          </span>
          <a
            href={`tel:${SUPPORT_PHONE.replace(/-/g, "")}`}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg
              bg-red-500 hover:bg-red-400 active:bg-red-600
              text-white text-xs font-bold transition-colors shadow-lg
              shadow-red-500/20
            "
          >
            <Phone className="w-3 h-3" strokeWidth={2.5} />
            {SUPPORT_PHONE}
          </a>
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/* STATE: alerting — show action buttons                  */}
        {/* ══════════════════════════════════════════════════════ */}
        {state === "alerting" && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <p className="text-xs text-red-400/60 flex-1 min-w-[140px]">
              Or notify a specialist digitally:
            </p>
            <button
              onClick={() => setState("email-form")}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-slate-700 border border-slate-600 text-slate-300
                hover:bg-slate-600 hover:text-white transition-colors
              "
            >
              <Mail className="w-3 h-3" />
              Email transcript
            </button>
            <button
              onClick={() => setState("countdown")}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-red-500/20 border border-red-500/40 text-red-300
                hover:bg-red-500/30 transition-colors
              "
            >
              <Clock className="w-3 h-3" />
              Notify &amp; wait
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* STATE: email-form                                      */}
        {/* ══════════════════════════════════════════════════════ */}
        {state === "email-form" && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-red-400/70">
              We'll email the conversation transcript to your agent and CC you:
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  placeholder="your@email.com (optional)"
                  autoFocus
                  className="
                    w-full px-3 py-2 rounded-lg text-xs bg-slate-800 border
                    text-slate-200 placeholder-slate-500 focus:outline-none
                    focus:ring-1 focus:ring-red-500/50
                    transition-colors
                    ${emailError ? 'border-red-500' : 'border-slate-600'}
                  "
                />
                {emailError && (
                  <p className="text-[10px] text-red-400 mt-1">{emailError}</p>
                )}
              </div>
              <button
                onClick={handleEmailSubmit}
                className="
                  px-3 py-2 rounded-lg text-xs font-semibold
                  bg-red-500 hover:bg-red-400 text-white transition-colors
                  whitespace-nowrap
                "
              >
                Notify agent
              </button>
              <button
                onClick={() => setState("alerting")}
                className="px-2 py-2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label="Cancel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* STATE: countdown                                        */}
        {/* ══════════════════════════════════════════════════════ */}
        {state === "countdown" && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs text-red-400/70">
                Notifying agent automatically in…
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-300 tabular-nums font-mono">
                  {formatCountdown(countdown)}
                </span>
                <button
                  onClick={() => {
                    if (countdownRef.current)
                      clearInterval(countdownRef.current);
                    setState("alerting");
                    setCountdown(COUNTDOWN_SECONDS);
                  }}
                  className="text-xs text-red-600 hover:text-red-400 underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 rounded-full bg-red-900/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${countdownProgress * 100}%` }}
              />
            </div>

            <p className="text-[10px] text-red-600/60 mt-1.5">
              Agent will receive the full conversation transcript.
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/* STATE: submitting                                       */}
        {/* ══════════════════════════════════════════════════════ */}
        {state === "submitting" && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Notifying support team and preparing transcript…</span>
          </div>
        )}
      </div>
    </div>
  );
}
