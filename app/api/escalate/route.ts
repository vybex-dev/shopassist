/**
 * app/api/escalate/route.ts  (Step 10 — Supabase persistence added)
 * ─────────────────────────────────────────────────────────────────
 * POST /api/escalate  — log escalation to memory queue + Supabase
 * GET  /api/escalate  — list recent escalations
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { saveEscalation } from "@/lib/supabase";
import type { EscalationRequest } from "@/types";

export const runtime = "nodejs";

// ─── In-memory queue (still used as fast fallback) ────────────────

interface EscalationRecord {
  id: string;
  conversationId: string;
  sessionId: string;
  reason: string;
  sentimentScore: number;
  sentimentLabel: string;
  messageCount: number;
  contactEmail?: string;
  createdAt: string;
  status: "open" | "in-progress" | "resolved";
  persistedToDb: boolean;
}

const escalationQueue: EscalationRecord[] = [];

// ─── POST /api/escalate ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Partial<EscalationRequest & { contactEmail?: string }>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const {
    conversationId,
    sessionId,
    messages = [],
    sentiment,
    reason,
    contactEmail,
  } = body;

  if (!conversationId || !reason) {
    return NextResponse.json(
      { error: "`conversationId` and `reason` are required." },
      { status: 400 },
    );
  }

  // ── 1. Save to in-memory queue (instant, always succeeds) ─────
  const record: EscalationRecord = {
    id: crypto.randomUUID(),
    conversationId: conversationId ?? "unknown",
    sessionId: sessionId ?? "unknown",
    reason: reason ?? "manual",
    sentimentScore: sentiment?.score ?? 0,
    sentimentLabel: sentiment?.label ?? "neutral",
    messageCount: messages.length,
    contactEmail,
    createdAt: new Date().toISOString(),
    status: "open",
    persistedToDb: false,
  };

  escalationQueue.push(record);
  if (escalationQueue.length > 200) escalationQueue.shift();

  console.log(
    `[Escalate] 🚨 #${record.id.slice(0, 8)}` +
      ` | reason: ${record.reason.slice(0, 50)}` +
      ` | sentiment: ${record.sentimentLabel} (${record.sentimentScore})`,
  );

  // ── 2. Persist to Supabase (non-blocking) ────────────────────
  saveEscalation({
    conversationId: conversationId!,
    reason: reason!,
    sentimentScore: sentiment?.score ?? 0,
    sentimentLabel: sentiment?.label ?? "neutral",
    contactEmail,
    messageCount: messages.length,
  })
    .then((saved) => {
      if (saved) {
        record.persistedToDb = true;
        console.log(
          `[Supabase] Escalation persisted — db id: ${saved.id.slice(0, 8)}`,
        );
      }
    })
    .catch((err) => {
      console.error("[Supabase] Failed to persist escalation:", err);
    });

  return NextResponse.json(
    {
      success: true,
      escalationId: record.id,
      estimatedWait: 3,
      agentName: "Support Team",
      message:
        "A FlowMart specialist has been notified and will reach out shortly.",
    },
    { status: 201 },
  );
}

// ─── GET /api/escalate ────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | EscalationRecord["status"]
    | null;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  const filtered = status
    ? escalationQueue.filter((r) => r.status === status)
    : escalationQueue;

  const results = filtered.slice(-limit).reverse();

  return NextResponse.json(
    {
      count: results.length,
      total: escalationQueue.length,
      escalations: results,
    },
    { status: 200 },
  );
}
