/**
 * app/admin/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Admin analytics dashboard for ShopAssist.
 *
 * Features:
 *  - Simple password gate (ADMIN_PASSWORD env var)
 *  - 4 stat cards (total, escalated, resolution rate, avg messages)
 *  - Daily volume AreaChart
 *  - Sentiment breakdown donut PieChart
 *  - Language distribution horizontal BarChart
 *  - Top issues vertical BarChart
 *  - Live escalations table (auto-refresh 30s)
 *  - "7d / 14d / 30d" range selector
 *  - Data source badge (Supabase vs demo seed)
 *  - Mobile responsive (cards stack on small screens)
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ShoppingBag,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";
import {
  StatCard,
  VolumeChart,
  SentimentChart,
  LanguageChart,
  TopIssuesChart,
  EscalationsTable,
} from "@/components/AdminChart";
import type { AnalyticsData } from "@/types";

// ─── Password gate ────────────────────────────────────────────────
// Simple client-side check — good enough for a hackathon demo.
// For production, replace with NextAuth server-side session check.

const DEMO_PASSWORD = "shopassist2026";

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const envPw = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? DEMO_PASSWORD;
    if (value === envPw || value === DEMO_PASSWORD) {
      sessionStorage.setItem("admin_unlocked", "1");
      onUnlock();
    } else {
      setError(true);
      setValue("");
    }
  };

  return (
    <div className="min-h-dvh bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl mb-4">
            <ShoppingBag className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
          <h1 className="text-xl font-bold text-white">ShopAssist Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Analytics Dashboard</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
        >
          <div className="flex items-center gap-2 mb-5">
            <Lock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-300 font-medium">
              Enter admin password
            </span>
          </div>

          <div className="relative mb-4">
            <input
              type={visible ? "text" : "password"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Password"
              autoFocus
              className={`
                w-full px-4 py-2.5 rounded-xl text-sm bg-slate-700
                text-slate-100 placeholder-slate-500 focus:outline-none
                focus:ring-2 transition-colors border
                ${
                  error
                    ? "border-red-500/60 focus:ring-red-500/30"
                    : "border-slate-600 focus:ring-blue-500/30"
                }
              `}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {visible ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 mb-3 animate-fade-in">
              Incorrect password — try again.
            </p>
          )}

          <button
            type="submit"
            className="
              w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500
              text-white text-sm font-semibold transition-colors
              active:bg-blue-700 shadow-lg shadow-blue-500/20
            "
          >
            Unlock Dashboard
          </button>

          <p className="text-[11px] text-slate-500 text-center mt-4">
            Default password:{" "}
            <code className="text-slate-400">shopassist2026</code>
          </p>
        </form>
      </div>
    </div>
  );
}

// ─── Range selector ───────────────────────────────────────────────

const RANGES: { label: string; days: number }[] = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
];

// ─── Dashboard ────────────────────────────────────────────────────

function Dashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(7);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [dataSource, setDataSource] = useState<"supabase" | "seed">("seed");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(
    async (days: number, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const r = await fetch(`/api/analytics?days=${days}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const json = await r.json();
        setData(json);
        setDataSource(json.meta?.source ?? "seed");
        setLastRefresh(new Date().toLocaleTimeString());
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load analytics",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  // Initial load + range changes
  useEffect(() => {
    fetchAnalytics(range);
  }, [range, fetchAnalytics]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchAnalytics(range, true), 30_000);
    return () => clearInterval(interval);
  }, [range, fetchAnalytics]);

  // ── Loading skeleton ──────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 flex items-center justify-center animate-pulse">
            <ShoppingBag className="w-6 h-6 text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm">Loading analytics…</p>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────
  if (error || !data) {
    return (
      <div className="min-h-dvh bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm mb-3">
            {error ?? "No data available"}
          </p>
          <button
            onClick={() => fetchAnalytics(range)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Trend helpers ─────────────────────────────────────────────
  const escalationRate =
    data.totalConversations > 0
      ? Math.round((data.escalatedCount / data.totalConversations) * 100)
      : 0;

  return (
    <div className="min-h-dvh bg-slate-900">
      {/* ═══════════════ HEADER ═══════════════════════════════════ */}
      <header
        className="
        sticky top-0 z-20
        bg-slate-900/80 backdrop-blur-xl
        border-b border-slate-700/50
        px-4 sm:px-6 py-3
      "
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
              <ShoppingBag className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-sm">ShopAssist</span>
                <span className="text-[10px] px-1.5 py-px bg-slate-700 text-slate-400 rounded font-medium">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Analytics Dashboard
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Data source badge */}
            <div
              className={`
              hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium border
              ${
                dataSource === "supabase"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-amber-500/10  border-amber-500/20  text-amber-400"
              }
            `}
            >
              <Database className="w-2.5 h-2.5" />
              {dataSource === "supabase" ? "Live data" : "Demo data"}
            </div>

            {/* Range selector */}
            <div className="flex rounded-xl border border-slate-700 overflow-hidden">
              {RANGES.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setRange(days)}
                  className={`
                    px-2.5 py-1.5 text-xs font-medium transition-colors
                    ${
                      range === days
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={() => fetchAnalytics(range, true)}
              disabled={refreshing}
              title={lastRefresh ? `Last updated ${lastRefresh}` : "Refresh"}
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                bg-slate-800 border border-slate-700 text-slate-400
                hover:text-slate-200 hover:bg-slate-700
                disabled:opacity-50 transition-colors
              "
            >
              <RefreshCw
                className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Back to chat */}
            <a
              href="/chat"
              className="
                flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs
                bg-blue-600/10 border border-blue-600/20 text-blue-400
                hover:bg-blue-600/20 transition-colors
              "
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden sm:inline">Open Chat</span>
            </a>
          </div>
        </div>
      </header>

      {/* ═══════════════ MAIN CONTENT ══════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Stat cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Conversations"
            value={data.totalConversations.toLocaleString()}
            subtitle={`Past ${range} days`}
            icon={<MessageSquare className="w-4 h-4" />}
            trend="up"
            accent="blue"
          />
          <StatCard
            title="Escalations"
            value={data.escalatedCount}
            subtitle={`${escalationRate}% of total`}
            icon={<AlertTriangle className="w-4 h-4" />}
            trend={escalationRate > 15 ? "down" : "neutral"}
            accent="red"
          />
          <StatCard
            title="Resolution Rate"
            value={`${data.resolutionRate}%`}
            subtitle="Resolved without escalation"
            icon={<CheckCircle className="w-4 h-4" />}
            trend={data.resolutionRate > 80 ? "up" : "down"}
            accent="green"
          />
          <StatCard
            title="Avg Messages"
            value={data.avgMessagesPerChat}
            subtitle="Per conversation"
            icon={<Clock className="w-4 h-4" />}
            trend="neutral"
            accent="purple"
          />
        </div>

        {/* ── Volume chart (full width) ──────────────────────────── */}
        <VolumeChart data={data.dailyVolume} />

        {/* ── Sentiment + Language side by side ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SentimentChart data={data.sentimentBreakdown} />
          <LanguageChart data={data.languageBreakdown} />
        </div>

        {/* ── Top issues (full width) ────────────────────────────── */}
        <TopIssuesChart data={data.topIssues} />

        {/* ── Live escalations queue ─────────────────────────────── */}
        <EscalationsTable />

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="text-center pb-4">
          <p className="text-[10px] text-slate-600">
            ShopAssist Admin · Data refreshes every 30s
            {lastRefresh && ` · Last updated ${lastRefresh}`}
            {dataSource === "seed" && (
              <span className="text-amber-600/60">
                {" "}
                · Demo mode — connect Supabase for live data
              </span>
            )}
          </p>
        </footer>
      </main>
    </div>
  );
}

// ─── Page with gate ───────────────────────────────────────────────

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem("admin_unlocked") === "1") {
      setUnlocked(true);
    }
  }, []);

  if (!unlocked) {
    return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  }

  return <Dashboard />;
}
