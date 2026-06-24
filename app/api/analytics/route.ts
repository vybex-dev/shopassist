/**
 * app/api/analytics/route.ts
 * ─────────────────────────────────────────────────────────────────
 * GET /api/analytics?days=7   → full AnalyticsData
 * GET /api/analytics?summary=1 → today's counts only
 *
 * Returns seeded mock data when Supabase is not configured so the
 * admin dashboard always looks good during demos.
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { getAnalyticsData, checkSupabaseConnection } from "@/lib/supabase";
import type { AnalyticsData } from "@/types";

export const runtime = "nodejs";

// ─── Seed / demo data ─────────────────────────────────────────────
// Used when Supabase is not configured or returns no rows.
// Gives the admin dashboard realistic numbers for the demo video.

function generateSeedData(days: number): AnalyticsData {
  const dailyVolume = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    // Simulate realistic daily pattern (more on weekdays)
    const dow = d.getDay(); // 0=Sun
    const base = dow === 0 || dow === 6 ? 8 : 22;
    const count = base + Math.floor(Math.random() * 14);
    dailyVolume.push({ date, count });
  }

  const total = dailyVolume.reduce((s, d) => s + d.count, 0);
  const escalated = Math.floor(total * 0.12); // 12% escalation rate

  return {
    totalConversations: total,
    escalatedCount: escalated,
    resolutionRate: 88,
    avgMessagesPerChat: 6,
    sentimentBreakdown: {
      positive: Math.floor(total * 0.42),
      neutral: Math.floor(total * 0.31),
      negative: Math.floor(total * 0.19),
      angry: Math.floor(total * 0.08),
    },
    dailyVolume,
    topIssues: [
      { issue: "Order tracking", count: Math.floor(total * 0.31) },
      { issue: "Returns & refunds", count: Math.floor(total * 0.24) },
      { issue: "Payment issues", count: Math.floor(total * 0.17) },
      { issue: "Agent request", count: Math.floor(total * 0.12) },
      { issue: "Delivery delays", count: Math.floor(total * 0.09) },
    ],
    languageBreakdown: {
      en: Math.floor(total * 0.54),
      hi: Math.floor(total * 0.14),
      es: Math.floor(total * 0.11),
      fr: Math.floor(total * 0.07),
      de: Math.floor(total * 0.05),
      ar: Math.floor(total * 0.04),
      pt: Math.floor(total * 0.03),
      other: Math.floor(total * 0.02),
    },
  };
}

// ─── GET /api/analytics ───────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") ?? "7"), 90);
  const summary = searchParams.get("summary") === "1";

  // ── Check DB status ───────────────────────────────────────────
  const dbStatus = await checkSupabaseConnection();

  let data: AnalyticsData | null = null;
  let source: "supabase" | "seed" = "seed";

  // ── Try Supabase ──────────────────────────────────────────────
  if (dbStatus.connected && dbStatus.tableExists) {
    data = await getAnalyticsData(days);
    source = "supabase";
  }

  // ── Fall back to seed data ────────────────────────────────────
  // Also use seed if Supabase returned 0 conversations (new project)
  if (!data || data.totalConversations === 0) {
    data = generateSeedData(days);
    source = "seed";
  }

  // ── Summary mode: just today's numbers ───────────────────────
  if (summary) {
    const today = new Date().toISOString().slice(0, 10);
    const todayVol = data.dailyVolume.find((d) => d.date === today)?.count ?? 0;

    return NextResponse.json(
      {
        today: {
          conversations: todayVol,
          escalations: Math.round(todayVol * 0.12),
          resolvedRate: data.resolutionRate,
        },
        source,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      ...data,
      meta: {
        days,
        source,
        dbStatus,
        generatedAt: new Date().toISOString(),
      },
    },
    { status: 200 },
  );
}
