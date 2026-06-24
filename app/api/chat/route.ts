/**
 * app/api/chat/route.ts  (Step 6 — Sentiment integration)
 * ─────────────────────────────────────────────────────────────────
 * Changes from Step 2:
 *  - Import analyzeSentiment, detectLanguage
 *  - Run both synchronously before calling Gemini
 *  - Pass { sentiment, language } to createGeminiStream
 *  - Dev logging for sentiment results
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import { createGeminiStream } from "@/lib/gemini";
import { analyzeSentiment, detectLanguage } from "@/lib/sentiment";
import type { ChatRequest } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  // ── 1. API key check ─────────────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY is not configured.",
        hint: "Add GEMINI_API_KEY=your_key to .env.local and restart.",
        docsUrl: "https://aistudio.google.com/app/apikey",
      },
      { status: 500 },
    );
  }

  // ── 2. Parse body ────────────────────────────────────────────────
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const { message, conversationHistory = [], sessionId } = body;

  // ── 3. Validate ──────────────────────────────────────────────────
  if (!message?.trim()) {
    return NextResponse.json(
      { error: "`message` must be a non-empty string." },
      { status: 400 },
    );
  }
  if (message.trim().length > 2000) {
    return NextResponse.json(
      {
        error: "Message exceeds 2000-character limit.",
        length: message.length,
      },
      { status: 400 },
    );
  }
  if (!Array.isArray(conversationHistory)) {
    return NextResponse.json(
      { error: "`conversationHistory` must be an array." },
      { status: 400 },
    );
  }

  const trimmedMessage = message.trim();

  // ── 4. Sentiment analysis ────────────────────────────────────────
  // Run synchronously — no async needed, ~0ms overhead
  const sentiment = analyzeSentiment(trimmedMessage, conversationHistory);
  const language = detectLanguage(trimmedMessage);

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Sentiment] "${trimmedMessage.slice(0, 50)}${trimmedMessage.length > 50 ? "…" : ""}"` +
        ` → ${sentiment.label} (${sentiment.score > 0 ? "+" : ""}${sentiment.score})` +
        ` | escalate: ${sentiment.escalate}` +
        ` | language: ${language}` +
        ` | session: ${sessionId ?? "anon"}`,
    );
  }

  // ── 5. Create Gemini stream (with sentiment + language context) ──
  let stream: ReadableStream<Uint8Array>;
  try {
    stream = await createGeminiStream(trimmedMessage, conversationHistory, {
      sentiment,
      language,
    });
  } catch (error) {
    console.error("[Chat API] Failed to create stream:", error);
    return NextResponse.json(
      { error: "Failed to initialise AI response stream. Please try again." },
      { status: 500 },
    );
  }

  // ── 6. Return SSE response ───────────────────────────────────────
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ShopAssist Chat API",
      model: "gemini-1.5-flash",
      hasApiKey: !!process.env.GEMINI_API_KEY,
      runtime: "nodejs",
      features: ["rag", "sentiment", "multilingual", "streaming", "escalation"],
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
