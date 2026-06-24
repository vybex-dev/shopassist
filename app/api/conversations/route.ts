/**
 * app/api/conversations/route.ts
 * ─────────────────────────────────────────────────────────────────
 * POST /api/conversations  — upsert a full conversation snapshot
 * GET  /api/conversations  — health check + Supabase status
 * GET  /api/conversations/:id — fetch a single conversation
 *
 * Called by the client after every streaming turn completes
 * (fire-and-forget: client doesn't wait for this response).
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { upsertConversation, checkSupabaseConnection } from "@/lib/supabase";
import type { UpsertConversationData } from "@/lib/supabase";
import type { Message, SentimentScore } from "@/types";

export const runtime = "nodejs";

// ─── POST /api/conversations ─────────────────────────────────────

export async function POST(request: NextRequest) {
  let body: Partial<{
    id: string;
    sessionId: string;
    userId: string;
    messages: Message[];
    isEscalated: boolean;
    sentiment: SentimentScore;
    language: string;
  }>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { id, sessionId, messages, isEscalated, sentiment, language } = body;

  // ── Validate required fields ──────────────────────────────────
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "`id` is required and must be a UUID string." },
      { status: 400 },
    );
  }
  if (!sessionId || typeof sessionId !== "string") {
    return NextResponse.json(
      { error: "`sessionId` is required." },
      { status: 400 },
    );
  }
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: "`messages` must be an array." },
      { status: 400 },
    );
  }

  // ── Strip streaming flags before storing ──────────────────────
  // Never persist a message that is still in streaming state
  const cleanMessages: Message[] = messages
    .filter((m: Message) => !m.isStreaming && m.content?.trim())
    .map((m: Message) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      sentiment: m.sentiment,
      language: m.language,
    }));

  const data: UpsertConversationData = {
    id,
    sessionId,
    userId: body.userId,
    messages: cleanMessages,
    isEscalated: isEscalated ?? false,
    sentiment: sentiment ?? { label: "neutral", score: 0, escalate: false },
    language: language ?? "en",
  };

  const result = await upsertConversation(data);

  // Return success even if Supabase is not configured
  // (app should degrade gracefully)
  return NextResponse.json(
    {
      success: true,
      persisted: result !== null,
      conversationId: id,
      messageCount: cleanMessages.length,
    },
    { status: 200 },
  );
}

// ─── GET /api/conversations ───────────────────────────────────────

export async function GET() {
  const dbStatus = await checkSupabaseConnection();

  return NextResponse.json(
    {
      status: "ok",
      service: "ShopAssist Conversations API",
      database: dbStatus,
      note: dbStatus.configured
        ? dbStatus.connected
          ? "Supabase connected and ready"
          : "Supabase configured but connection failed — check credentials"
        : "Supabase not configured — running in memory-only mode",
    },
    { status: 200 },
  );
}
