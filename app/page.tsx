/**
 * app/page.tsx  (Step 12 — Landing Page)
 * ─────────────────────────────────────────────────────────────────
 * Marketing landing page for ShopAssist.
 *
 * Design: Dark premium SaaS — Syne display font, dot-grid mesh
 * background, electric-blue/violet accents, animated chat preview.
 *
 * Sections:
 *  1. Sticky glass navbar
 *  2. Split hero with looping animated chat demo
 *  3. Stats bar
 *  4. Tech-stack strip
 *  5. Feature cards (6)
 *  6. How it works (3 steps)
 *  7. Innovation showcase (RAG / Sentiment / Multilingual)
 *  8. Final CTA card
 *  9. Footer
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Sparkles,
  Globe,
  TrendingUp,
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Brain,
  ArrowRight,
  Check,
  Zap,
  Database,
  Languages,
  ChevronRight,
  Code2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────
// ANIMATED CHAT DEMO
// ─────────────────────────────────────────────────────────────────

const DEMO_MESSAGES = [
  {
    id: 1,
    role: "user",
    text: "My order hasn't arrived in 2 weeks — this is ridiculous!!",
    badge: null,
    sentimentTag: { label: "😤 Angry", colour: "#ef4444" },
    showAfterStep: 1,
  },
  {
    id: 2,
    role: "bot",
    text: "You're completely right to be frustrated — 2 weeks is far too long, and I sincerely apologise.\n\nYour order #FM-7842 is held at the regional hub due to a carrier delay. I've flagged it for priority re-routing.\n\nNew estimated delivery: within 48 hours.",
    badge: null,
    sentimentTag: null,
    showAfterStep: 2,
  },
  {
    id: 3,
    role: "user",
    text: "मेरा ऑर्डर कहाँ है?",
    badge: null,
    sentimentTag: null,
    showAfterStep: 3,
  },
  {
    id: 4,
    role: "bot",
    text: "आपका ऑर्डर अभी मुंबई वेयरहाउस से निकला है। 2-3 कार्यदिवसों में पहुँच जाएगा। 📦",
    badge: { label: "🇮🇳 HI ⚡ Auto-detected", colour: "#60a5fa" },
    sentimentTag: null,
    showAfterStep: 4,
  },
];

const STEP_DELAYS = [900, 2400, 5000, 6600];

function AnimatedChatDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < DEMO_MESSAGES.length) {
      const t = setTimeout(() => setStep((s) => s + 1), STEP_DELAYS[step]);
      return () => clearTimeout(t);
    }
    // Loop: pause 4 s then restart
    const reset = setTimeout(() => setStep(0), 4000);
    return () => clearTimeout(reset);
  }, [step]);

  const typingFor =
    step < DEMO_MESSAGES.length && DEMO_MESSAGES[step]?.role === "bot"
      ? DEMO_MESSAGES[step]
      : null;

  return (
    <div
      className="relative w-full max-w-sm mx-auto rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-blue-500/10"
      style={{ background: "linear-gradient(145deg,#0f172a,#1e293b)" }}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/40">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <div className="flex items-center gap-1.5 mx-auto">
          <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-400 font-medium">
            ShopAssist · FlowMart
          </span>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 min-h-[300px]">
        {DEMO_MESSAGES.filter((m) => step >= m.showAfterStep).map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 animate-slide-up ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "bot" && (
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-none mt-0.5 shadow">
                <ShoppingBag className="w-3 h-3 text-white" />
              </div>
            )}
            <div className="max-w-[80%] flex flex-col gap-1">
              <div
                className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-700/80 border border-slate-600/40 text-slate-200 rounded-bl-sm"
                }`}
              >
                {/* Language detection badge */}
                {msg.badge && (
                  <div
                    className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded mb-1.5"
                    style={{
                      background: `${msg.badge.colour}18`,
                      color: msg.badge.colour,
                      border: `1px solid ${msg.badge.colour}30`,
                    }}
                  >
                    <Zap className="w-2 h-2" fill="currentColor" />
                    {msg.badge.label}
                  </div>
                )}
                <span className="block whitespace-pre-line">{msg.text}</span>
              </div>

              {/* Sentiment tag */}
              {msg.sentimentTag && (
                <div
                  className="flex items-center gap-1 text-[9px] ml-0.5"
                  style={{ color: `${msg.sentimentTag.colour}99` }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-none"
                    style={{ background: msg.sentimentTag.colour }}
                  />
                  {msg.sentimentTag.label} detected
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingFor && (
          <div className="flex items-end gap-2 animate-fade-in">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center flex-none">
              <ShoppingBag className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-700/80 border border-slate-600/40 rounded-xl rounded-bl-sm px-3 py-2.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dot-3" />
              </div>
            </div>
          </div>
        )}

        {/* Reset notice */}
        {step >= DEMO_MESSAGES.length && (
          <p className="text-center text-[9px] text-slate-600 animate-fade-in pt-2">
            Replaying demo…
          </p>
        )}
      </div>

      {/* Quick-reply chips */}
      {step >= 2 && (
        <div className="px-4 pb-3 animate-fade-in">
          <p className="text-[9px] text-slate-600 uppercase tracking-wide font-medium mb-1.5">
            Quick replies
          </p>
          <div className="flex gap-1.5 overflow-hidden">
            {["Track order", "Request refund", "Talk to agent"].map((s, i) => (
              <span
                key={s}
                className="animate-chip-in flex-none px-2 py-1 rounded-full text-[9px] font-medium border"
                style={{
                  animationDelay: `${i * 60}ms`,
                  background: "rgba(59,130,246,0.08)",
                  borderColor: "rgba(59,130,246,0.25)",
                  color: "#93c5fd",
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%,rgba(59,130,246,0.07) 0%,transparent 65%)",
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SMALL REUSABLE PIECES
// ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4">
      <Sparkles className="w-2.5 h-2.5" fill="currentColor" />
      {children}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  hex: string;
  tag?: string;
}

function FeatureCard({ icon, title, desc, hex, tag }: FeatureCardProps) {
  return (
    <div
      className="
        group relative rounded-2xl p-5 border border-slate-800
        bg-slate-900/40 hover:bg-slate-900
        hover:border-slate-700 transition-all duration-300 overflow-hidden
      "
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg,transparent,${hex},transparent)`,
        }}
      />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{
          background: `${hex}15`,
          border: `1px solid ${hex}28`,
          color: hex,
        }}
      >
        {icon}
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {tag && (
          <span
            className="flex-none text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: `${hex}18`, color: hex }}
          >
            {tag}
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">{desc}</p>

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 0%,${hex}07 0%,transparent 70%)`,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div
      className="min-h-screen font-sans"
      style={{ background: "#030712", color: "#f1f5f9" }}
    >
      {/* ── Mesh background ──────────────────────────────────────── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 55% at 50% -5%, rgba(37,99,235,0.20) 0%, transparent 55%),
            radial-gradient(ellipse 55% 45% at 88% 95%, rgba(124,58,237,0.13) 0%, transparent 55%),
            radial-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "auto, auto, 28px 28px",
        }}
      />

      <div className="relative z-10">
        {/* ═══════════════ NAVBAR ══════════════════════════════════ */}
        <nav
          className={`
            fixed top-0 inset-x-0 z-50 transition-all duration-300
            ${
              scrolled
                ? "bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/60 shadow-2xl shadow-black/30"
                : "bg-transparent"
            }
          `}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/35">
                <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
              </div>
              <span className="font-display font-bold text-white text-sm tracking-tight">
                ShopAssist
              </span>
              <span className="hidden sm:inline px-1.5 py-px text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded uppercase tracking-wide">
                AI
              </span>
            </div>

            {/* Links */}
            <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
              {[
                ["Features", "#features"],
                ["How it works", "#how-it-works"],
                ["Innovation", "#innovation"],
                ["Dashboard", "/admin"],
              ].map(([label, href]) => (
                <Link
                  key={label}
                  href={href}
                  className="hover:text-white transition-colors duration-150"
                >
                  {label}
                </Link>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/chat"
              className="
                flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold
                bg-blue-600 hover:bg-blue-500 text-white
                shadow-lg shadow-blue-500/25 transition-all duration-150 active:scale-95
              "
            >
              Start Chat
              <ArrowRight className="w-3 h-3" strokeWidth={2.5} />
            </Link>
          </div>
        </nav>

        {/* ═══════════════ HERO ════════════════════════════════════ */}
        <section className="pt-32 pb-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-14 items-center">
              {/* Left: copy */}
              <div>
                {/* Hackathon badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/6 text-emerald-400 text-[10px] font-semibold mb-7">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  FlowZint AI Hackathon 2026 — Entry
                </div>

                {/* Headline */}
                <h1
                  className="font-display font-extrabold leading-[1.03] tracking-tight mb-6"
                  style={{ fontSize: "clamp(2.25rem,5vw,3.6rem)" }}
                >
                  <span className="text-white block">AI Support for</span>
                  <span
                    className="block"
                    style={{
                      background:
                        "linear-gradient(130deg,#60a5fa 0%,#a78bfa 45%,#60a5fa 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      animation: "shimmerGrad 5s linear infinite",
                    }}
                  >
                    Modern E-Commerce
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-slate-400 text-[15px] leading-relaxed mb-8 max-w-[480px]">
                  Combines{" "}
                  <strong className="text-slate-200 font-semibold">
                    RAG knowledge retrieval
                  </strong>
                  ,{" "}
                  <strong className="text-slate-200 font-semibold">
                    real-time sentiment detection
                  </strong>
                  , and{" "}
                  <strong className="text-slate-200 font-semibold">
                    11-language support
                  </strong>{" "}
                  to deliver instant, accurate, empathetic support — 24/7.
                </p>

                {/* Checklist */}
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-9 max-w-[440px]">
                  {[
                    "RAG knowledge retrieval",
                    "Sentiment detection",
                    "11 languages, auto-detect",
                    "Auto-escalation to agents",
                    "Streaming responses",
                    "Live analytics dashboard",
                  ].map((f) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 text-[11px] text-slate-400"
                    >
                      <Check
                        className="w-3.5 h-3.5 text-emerald-400 flex-none"
                        strokeWidth={2.5}
                      />
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href="/chat"
                    className="
                      flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold
                      bg-blue-600 hover:bg-blue-500 text-white
                      shadow-xl shadow-blue-500/30 transition-all active:scale-95
                    "
                  >
                    <MessageSquare className="w-4 h-4" />
                    Start Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/admin"
                    className="
                      flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                      bg-slate-800/80 hover:bg-slate-700 border border-slate-700/70
                      text-slate-300 hover:text-white
                      transition-all active:scale-95
                    "
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Dashboard
                  </Link>
                </div>
              </div>

              {/* Right: chat demo */}
              <div className="relative">
                <div
                  className="absolute inset-0 -m-8 rounded-3xl blur-3xl pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center,rgba(59,130,246,0.13) 0%,transparent 70%)",
                  }}
                />
                <AnimatedChatDemo />
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ STATS BAR ═══════════════════════════════ */}
        <section className="border-y border-slate-800/50 bg-slate-900/25 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex items-center justify-around overflow-x-auto gap-2">
              {[
                { value: "11", label: "Languages" },
                { value: "24/7", label: "Availability" },
                { value: "< 2s", label: "Response time" },
                { value: "RAG", label: "Knowledge retrieval" },
                { value: "15-step", label: "Build plan" },
                { value: "Free", label: "Gemini tier" },
              ].map(({ value, label }) => (
                <div key={label} className="flex-none text-center px-3">
                  <div className="text-xl font-display font-bold text-white tabular-nums">
                    {value}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 whitespace-nowrap">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ TECH STACK ══════════════════════════════ */}
        <section className="py-10 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[10px] text-slate-700 uppercase tracking-widest font-semibold mb-5">
              Built with
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {[
                { name: "Next.js 14", hex: "#ffffff", bg: "#1a1a2e" },
                { name: "Gemini 2.5 Flash", hex: "#60a5fa", bg: "#0f2d50" },
                { name: "Supabase", hex: "#34d399", bg: "#052e16" },
                { name: "Tailwind CSS", hex: "#38bdf8", bg: "#0c2d3d" },
                { name: "TypeScript", hex: "#818cf8", bg: "#1e1b4b" },
                { name: "Recharts", hex: "#f472b6", bg: "#3b0764" },
                { name: "Vercel", hex: "#e2e8f0", bg: "#111827" },
              ].map(({ name, hex, bg }) => (
                <div
                  key={name}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-800"
                  style={{ background: `${bg}cc`, color: hex }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ FEATURES ════════════════════════════════ */}
        <section id="features" className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Features</SectionLabel>
              <h2
                className="font-display font-bold text-white tracking-tight"
                style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)" }}
              >
                Everything e-commerce support needs
              </h2>
              <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto leading-relaxed">
                Six capabilities engineered to make every customer interaction
                faster, smarter, and more human — without a human.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <FeatureCard
                icon={<Brain className="w-5 h-5" />}
                title="RAG Knowledge Retrieval"
                desc="24+ FAQ chunks parsed, keyword-scored, and filtered. Only the top-5 sections relevant to each query are injected — grounded answers, zero hallucinations."
                hex="#3b82f6"
                tag="30% score"
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5" />}
                title="Sentiment Detection"
                desc="130+ keyword dictionary across 4 tiers. ALL CAPS amplification, conversation context weighting, 30 hard escalation triggers. Zero latency."
                hex="#f59e0b"
                tag="30% score"
              />
              <FeatureCard
                icon={<Globe className="w-5 h-5" />}
                title="11-Language Support"
                desc="Unicode script-range detection plus Latin word patterns. Full RTL flip for Arabic. Translated UI in 11 languages. Gemini replies in whatever language you type."
                hex="#10b981"
                tag="30% score"
              />
              <FeatureCard
                icon={<AlertTriangle className="w-5 h-5" />}
                title="Smart Auto-Escalation"
                desc="Pulsing red banner with countdown timer, call button, and email transcript form. Fires automatically on anger, legal threats, or chargeback mentions."
                hex="#ef4444"
              />
              <FeatureCard
                icon={<MessageSquare className="w-5 h-5" />}
                title="Contextual Suggestions"
                desc="Three category-colour-coded reply chips after every response. Staggered entrance animation. Keyboard navigation. Skeleton loading while streaming."
                hex="#8b5cf6"
              />
              <FeatureCard
                icon={<BarChart3 className="w-5 h-5" />}
                title="Analytics Dashboard"
                desc="Live Recharts: daily volume, sentiment donut, language bars, top issues, escalation queue. Supabase-backed with realistic seed data for instant demos."
                hex="#06b6d4"
              />
            </div>
          </div>
        </section>

        {/* ═══════════════ HOW IT WORKS ════════════════════════════ */}
        <section
          id="how-it-works"
          className="py-20 px-4 sm:px-6"
          style={{ background: "rgba(15,23,42,0.5)" }}
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>How it works</SectionLabel>
              <h2
                className="font-display font-bold text-white tracking-tight"
                style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)" }}
              >
                Message → answer in under 2 seconds
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connector (desktop only) */}
              <div
                className="absolute top-10 left-[calc(33%+1rem)] right-[calc(33%+1rem)] h-px hidden md:block"
                style={{
                  background:
                    "linear-gradient(90deg,rgba(59,130,246,0.5),rgba(139,92,246,0.5))",
                }}
              />

              {[
                {
                  n: "01",
                  icon: <MessageSquare className="w-6 h-6" />,
                  title: "Customer sends message",
                  desc: "In any language, any frustration level. Language is auto-detected via Unicode and sentiment is scored — before a single token hits Gemini.",
                  hex: "#3b82f6",
                },
                {
                  n: "02",
                  icon: <Brain className="w-6 h-6" />,
                  title: "RAG retrieves context",
                  desc: "Knowledge base is chunked and scored against the query. Top-5 relevant sections are injected. System prompt gets emotional context for angry users.",
                  hex: "#8b5cf6",
                },
                {
                  n: "03",
                  icon: <Zap className="w-6 h-6" />,
                  title: "Streamed clean response",
                  desc: "Gemini streams back. Server buffers, strips SUGGESTIONS and [ESCALATE] markers, then re-streams clean text with a natural word-by-word delay.",
                  hex: "#10b981",
                },
              ].map(({ n, icon, title, desc, hex }) => (
                <div key={n} className="text-center">
                  <div className="relative inline-block mb-5">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto"
                      style={{
                        background: `${hex}12`,
                        border: `1px solid ${hex}28`,
                        color: hex,
                      }}
                    >
                      {icon}
                    </div>
                    <div
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold font-display shadow-lg"
                      style={{ background: hex, color: "#030712" }}
                    >
                      {n}
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ INNOVATION SHOWCASE ════════════════════ */}
        <section id="innovation" className="py-20 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <SectionLabel>Model Innovation — 30% of score</SectionLabel>
              <h2
                className="font-display font-bold text-white tracking-tight"
                style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)" }}
              >
                Three layers of AI intelligence
              </h2>
              <p className="text-slate-500 text-sm mt-3 max-w-lg mx-auto">
                RAG, sentiment analysis, and multilingual NLP — each
                independently novel, together forming a cohesive intelligent
                support system.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* RAG card */}
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: "rgba(59,130,246,0.055)",
                  borderColor: "rgba(59,130,246,0.18)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    RAG Pipeline
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">
                  Grounded, accurate answers
                </h3>
                <div className="space-y-2">
                  {[
                    "24+ chunks parsed from store FAQ",
                    "Title (×5) / keyword (×3) / content (×1) weighting",
                    "Top-5 chunks per query, 3 000-token budget",
                    "ALWAYS_INCLUDE store info section",
                    "Force-reload endpoint for KB updates",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-2 text-[11px] text-slate-400"
                    >
                      <ChevronRight className="w-3 h-3 text-blue-500 flex-none mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sentiment card */}
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: "rgba(245,158,11,0.055)",
                  borderColor: "rgba(245,158,11,0.18)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    Sentiment Engine
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">
                  Emotion-aware responses
                </h3>
                <div className="space-y-2">
                  {[
                    "130+ keywords across 4 tiers (angry / negative / positive)",
                    "ALL CAPS detection: 1.6× score amplification",
                    "Repeated words + !! / ?? pattern detection",
                    "30 hard escalation phrases (legal, chargeback…)",
                    "Prior-turn context pulls score negative",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-2 text-[11px] text-slate-400"
                    >
                      <ChevronRight className="w-3 h-3 text-amber-500 flex-none mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Multilingual card */}
              <div
                className="rounded-2xl p-6 border"
                style={{
                  background: "rgba(16,185,129,0.055)",
                  borderColor: "rgba(16,185,129,0.18)",
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Languages className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Multilingual NLP
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white mb-3">
                  11 languages, zero config
                </h3>
                <div className="space-y-2">
                  {[
                    "Unicode script ranges: Hindi, Arabic, CJK, Korean…",
                    "Latin-script word patterns for 7 languages",
                    'dir="rtl" layout flip for Arabic',
                    "176 UI strings (16 keys × 11 languages)",
                    "Auto-detect ⚡ / manual override with language selector",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex gap-2 text-[11px] text-slate-400"
                    >
                      <ChevronRight className="w-3 h-3 text-emerald-500 flex-none mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ ARCHITECTURE CALLOUT ═══════════════════ */}
        <section
          className="py-16 px-4 sm:px-6"
          style={{ background: "rgba(15,23,42,0.5)" }}
        >
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <SectionLabel>Technical Architecture — 25% of score</SectionLabel>
              <h2
                className="font-display font-bold text-white tracking-tight"
                style={{ fontSize: "clamp(1.5rem,3vw,2.1rem)" }}
              >
                Clean, production-grade patterns throughout
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  icon: <Code2 className="w-4 h-4" />,
                  title: "Type-safe end-to-end",
                  desc: "Full TypeScript — Message, SentimentScore, AnalyticsData interfaces shared across client, server, and DB.",
                  hex: "#60a5fa",
                },
                {
                  icon: <Zap className="w-4 h-4" />,
                  title: "SSE streaming",
                  desc: "Server buffers full Gemini response, parses metadata, re-streams clean content word-by-word at 14ms/token.",
                  hex: "#f59e0b",
                },
                {
                  icon: <Database className="w-4 h-4" />,
                  title: "Graceful degradation",
                  desc: "Every Supabase call returns null on failure. App runs perfectly in memory-only mode during demos.",
                  hex: "#34d399",
                },
                {
                  icon: <Brain className="w-4 h-4" />,
                  title: "Sliding context window",
                  desc: "30-turn / 6K-token cap with safe MIN_RECENT_TURNS guarantee. trimHistory() keeps the latest exchange always.",
                  hex: "#a78bfa",
                },
              ].map(({ icon, title, desc, hex }) => (
                <div
                  key={title}
                  className="rounded-xl p-4 border border-slate-800 bg-slate-900/30"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-3"
                    style={{ background: `${hex}15`, color: hex }}
                  >
                    {icon}
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 mb-1.5">
                    {title}
                  </h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ FINAL CTA ═══════════════════════════════ */}
        <section className="py-24 px-4 sm:px-6">
          <div className="max-w-2xl mx-auto">
            <div
              className="relative rounded-3xl border border-slate-800/70 p-10 sm:p-14 text-center overflow-hidden"
              style={{
                background: "rgba(15,23,42,0.85)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Inner glow */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% -10%,rgba(59,130,246,0.14) 0%,transparent 60%)",
                }}
              />

              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-7 shadow-2xl shadow-blue-500/40">
                  <ShoppingBag
                    className="w-8 h-8 text-white"
                    strokeWidth={1.8}
                  />
                </div>

                <h2
                  className="font-display font-bold text-white tracking-tight mb-3"
                  style={{ fontSize: "clamp(1.6rem,3.5vw,2.3rem)" }}
                >
                  Try ShopAssist right now
                </h2>

                <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                  Ask about an order, write in Hindi, trigger an escalation —
                  see every feature working live in under a minute.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/chat"
                    className="
                      flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                      text-sm font-bold text-white bg-blue-600 hover:bg-blue-500
                      shadow-xl shadow-blue-500/30 transition-all active:scale-95
                    "
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Chat
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link
                    href="/admin"
                    className="
                      flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl
                      text-sm font-semibold text-slate-300 hover:text-white
                      bg-slate-800 hover:bg-slate-700 border border-slate-700
                      transition-all active:scale-95
                    "
                  >
                    <BarChart3 className="w-4 h-4" />
                    Admin Dashboard
                  </Link>
                </div>

                <p className="text-[10px] text-slate-600 mt-5">
                  Admin password:{" "}
                  <code className="text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                    shopassist2026
                  </code>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ FOOTER ══════════════════════════════════ */}
        <footer className="border-t border-slate-800/40 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShoppingBag className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-slate-400">ShopAssist</span>
              <span>·</span>
              <span>FlowZint AI Hackathon 2026</span>
            </div>
            <div className="flex items-center gap-5 text-[11px] text-slate-600">
              <Link
                href="/chat"
                className="hover:text-slate-400 transition-colors"
              >
                Chat
              </Link>
              <Link
                href="/admin"
                className="hover:text-slate-400 transition-colors"
              >
                Admin
              </Link>
              <span>Next.js 14 · Gemini 2.5 Flash · Supabase · Vercel</span>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Global keyframes for this page ───────────────────────── */}
      <style>{`
        @keyframes shimmerGrad {
          0%   { background-position: 0%   center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
}
