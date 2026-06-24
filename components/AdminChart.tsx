/**
 * components/AdminChart.tsx  (Step 13 fix — two bugs resolved)
 * ─────────────────────────────────────────────────────────────────
 * Fix 1: ResponsiveContainer.height only accepts number | `${number}%`.
 *   CSS variables are NOT valid.  Solution: wrap each chart in a <div>
 *   whose height is driven by the CSS variable, then set the container
 *   to height="100%" so it fills the wrapper.
 *
 * Fix 2: EscalationsTable was using require("react") to call hooks.
 *   Replaced with normal top-level imports — clean and type-safe.
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Languages,
} from "lucide-react";
import type { AnalyticsData } from "@/types";

// ─── Colour palette ───────────────────────────────────────────────

const SENTIMENT_COLOURS = {
  positive: "#10b981",
  neutral: "#94a3b8",
  negative: "#f59e0b",
  angry: "#ef4444",
};

const LANG_COLOURS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

// ─── Chart height wrapper ─────────────────────────────────────────
// ResponsiveContainer.height must be a number or "${n}%".
// We drive the actual pixel height via the --chart-height CSS variable
// (200px desktop → 150px mobile, defined in globals.css) on the
// parent <div>, then tell ResponsiveContainer to fill it 100%.

function ChartWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: "var(--chart-height, 200px)", width: "100%" }}>
      {children}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  accent: "blue" | "red" | "green" | "purple";
}

const ACCENT_CLASSES = {
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "text-blue-400",
    value: "text-blue-300",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: "text-red-400",
    value: "text-red-300",
  },
  green: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "text-emerald-400",
    value: "text-emerald-300",
  },
  purple: {
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    icon: "text-violet-400",
    value: "text-violet-300",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend = "neutral",
  accent,
}: StatCardProps) {
  const cls = ACCENT_CLASSES[accent];

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  const trendColour =
    trend === "up"
      ? "text-emerald-400"
      : trend === "down"
        ? "text-red-400"
        : "text-slate-500";

  return (
    <div
      className={`rounded-2xl border p-5 flex flex-col gap-3 ${cls.bg} ${cls.border} backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">
          {title}
        </p>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${cls.bg} ${cls.icon}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span
          className={`text-3xl font-bold tabular-nums tracking-tight ${cls.value}`}
        >
          {value}
        </span>
        <TrendIcon
          className={`w-4 h-4 mb-1.5 ${trendColour}`}
          strokeWidth={2.5}
        />
      </div>
      <p className="text-[11px] text-slate-500">{subtitle}</p>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600/50 rounded-xl px-3 py-2.5 shadow-2xl text-xs">
      {label && <p className="text-slate-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          {item.color && (
            <span
              className="w-2 h-2 rounded-full flex-none"
              style={{ background: item.color }}
            />
          )}
          <span className="text-slate-300 capitalize">{item.name}:</span>
          <span className="text-white font-bold ml-auto pl-3">
            {item.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── VolumeChart ──────────────────────────────────────────────────

export function VolumeChart({ data }: { data: AnalyticsData["dailyVolume"] }) {
  const formatted = data.map((d) => ({
    ...d,
    date: new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center gap-2 mb-5">
        <BarChart2 className="w-4 h-4 text-blue-400" />
        <h3 className="text-sm font-semibold text-slate-200">
          Daily Conversation Volume
        </h3>
      </div>

      {/* FIX 1: ChartWrapper drives height via CSS var; RC fills it at 100% */}
      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formatted}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="count"
              name="Conversations"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#volumeGrad)"
              dot={false}
              activeDot={{
                r: 5,
                fill: "#3b82f6",
                stroke: "#1e3a8a",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ─── SentimentChart ───────────────────────────────────────────────

export function SentimentChart({
  data,
}: {
  data: AnalyticsData["sentimentBreakdown"];
}) {
  const pieData = [
    {
      name: "Positive",
      value: data.positive,
      color: SENTIMENT_COLOURS.positive,
    },
    { name: "Neutral", value: data.neutral, color: SENTIMENT_COLOURS.neutral },
    {
      name: "Negative",
      value: data.negative,
      color: SENTIMENT_COLOURS.negative,
    },
    { name: "Angry", value: data.angry, color: SENTIMENT_COLOURS.angry },
  ].filter((d) => d.value > 0);

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-4 h-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-slate-200">
          Sentiment Breakdown
        </h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut — fixed pixel size, no CSS-var needed */}
        <div className="flex-none w-[120px] h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  const pct =
                    total > 0
                      ? Math.round(((item.value as number) / total) * 100)
                      : 0;
                  return (
                    <div className="bg-slate-800 border border-slate-600/50 rounded-lg px-2.5 py-1.5 text-xs shadow-xl">
                      <p className="text-slate-300">{item.name}</p>
                      <p className="text-white font-bold">{pct}%</p>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2.5">
          {pieData.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-none"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-slate-400 flex-1">
                  {item.name}
                </span>
                <span className="text-xs font-semibold text-slate-300 tabular-nums">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── LanguageChart ────────────────────────────────────────────────

export function LanguageChart({ data }: { data: Record<string, number> }) {
  const FLAG: Record<string, string> = {
    en: "🇺🇸",
    hi: "🇮🇳",
    es: "🇪🇸",
    fr: "🇫🇷",
    ar: "🇸🇦",
    de: "🇩🇪",
    pt: "🇧🇷",
    ja: "🇯🇵",
    zh: "🇨🇳",
    ko: "🇰🇷",
    ru: "🇷🇺",
  };

  const sorted = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([lang, count], i) => ({
      lang: `${FLAG[lang] ?? "🌐"} ${lang.toUpperCase()}`,
      count,
      fill: LANG_COLOURS[i % LANG_COLOURS.length],
    }));

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center gap-2 mb-5">
        <Languages className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-slate-200">
          Language Distribution
        </h3>
      </div>

      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="lang"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="Conversations"
              radius={[0, 6, 6, 0]}
              maxBarSize={18}
            >
              {sorted.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ─── TopIssuesChart ───────────────────────────────────────────────

export function TopIssuesChart({ data }: { data: AnalyticsData["topIssues"] }) {
  const coloured = data.map((d, i) => ({
    ...d,
    fill: LANG_COLOURS[i % LANG_COLOURS.length],
  }));

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-slate-200">Top Issues</h3>
      </div>

      <ChartWrapper>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={coloured}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#334155"
              vertical={false}
            />
            <XAxis
              dataKey="issue"
              tick={{ fill: "#64748b", fontSize: 9 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              tickFormatter={(v: string) =>
                v.length > 10 ? v.slice(0, 10) + "…" : v
              }
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              name="Issues"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
            >
              {coloured.map((entry, i) => (
                <Cell key={i} fill={entry.fill} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>
    </div>
  );
}

// ─── EscalationsTable ─────────────────────────────────────────────

interface EscalationRecord {
  id: string;
  conversationId: string;
  reason: string;
  sentimentLabel: string;
  messageCount: number;
  contactEmail?: string;
  createdAt: string;
  status: "open" | "in-progress" | "resolved";
}

export function EscalationsTable() {
  // FIX 2: use normal top-level imports instead of require("react")
  const [records, setRecords] = useState<EscalationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await fetch("/api/escalate?limit=10");
        const d = await r.json();
        setRecords(d.escalations ?? []);
        setLastFetch(new Date().toLocaleTimeString());
      } catch {
        // silently fail — escalations are non-critical
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, []);

  const SENTIMENT_DOT: Record<string, string> = {
    positive: "bg-emerald-400",
    neutral: "bg-slate-400",
    negative: "bg-amber-400",
    angry: "bg-red-500",
  };

  const STATUS_CLASSES: Record<string, string> = {
    open: "bg-red-500/15 text-red-400 border border-red-500/20",
    "in-progress": "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    resolved: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  };

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Live Escalations Queue
          </h3>
          {records.filter((r) => r.status === "open").length > 0 && (
            <span className="px-1.5 py-px rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
              {records.filter((r) => r.status === "open").length} open
            </span>
          )}
        </div>
        {lastFetch && (
          <div className="flex items-center gap-1 text-[10px] text-slate-500">
            <Clock className="w-3 h-3" />
            {lastFetch}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 rounded-lg skeleton-shimmer"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            No escalations — all clear! 🎉
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Trigger one from the chat to see it appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/50">
                {["ID", "Reason", "Sentiment", "Msgs", "Status", "Time"].map(
                  (h) => (
                    <th
                      key={h}
                      className="pb-2 text-left text-[10px] text-slate-500 font-medium uppercase tracking-wide pr-4 last:pr-0"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {records.map((r) => (
                <tr key={r.id} className="group">
                  <td className="py-2.5 pr-4 font-mono text-slate-500 text-[10px]">
                    #{r.id.slice(0, 6)}
                  </td>
                  <td className="py-2.5 pr-4 text-slate-300 max-w-[200px] truncate">
                    {r.reason}
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full flex-none ${SENTIMENT_DOT[r.sentimentLabel] ?? "bg-slate-400"}`}
                      />
                      <span className="text-slate-400 capitalize">
                        {r.sentimentLabel}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400 tabular-nums">
                    {r.messageCount}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_CLASSES[r.status] ?? STATUS_CLASSES.open}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500 tabular-nums whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
