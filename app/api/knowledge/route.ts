/**
 * app/api/knowledge/route.ts
 * ─────────────────────────────────────────────────────────────────
 * GET  /api/knowledge          → KB stats + cache status
 * POST /api/knowledge          → Force-reload KB cache
 * POST /api/knowledge?test=1   → Test RAG retrieval with a query
 * ─────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from "next/server";
import {
  loadKBChunks,
  invalidateKBCache,
  getKBCacheStatus,
} from "@/lib/gemini";
import { getKBStats, retrieveRelevantChunks } from "@/lib/rag";

export const runtime = "nodejs";

// ─── GET /api/knowledge ───────────────────────────────────────────
// Returns KB statistics and cache status.
// Safe to call from admin dashboard or health monitors.

export async function GET() {
  const cacheStatus = getKBCacheStatus();

  if (!cacheStatus.cached) {
    // Trigger a load so stats are always available
    loadKBChunks();
  }

  const chunks = loadKBChunks();
  const stats = getKBStats(chunks);

  return NextResponse.json(
    {
      status: "ok",
      cache: getKBCacheStatus(),
      kb: stats,
      ragConfig: {
        topK: 5,
        minScoreThreshold: 5,
        fallbackThreshold: 2,
        maxContextTokens: 3000,
      },
    },
    { status: 200 },
  );
}

// ─── POST /api/knowledge ──────────────────────────────────────────
// ?reload=1  → force-clear cache and reload from disk
// ?test=1    → test RAG retrieval with body.query

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Reload mode ───────────────────────────────────────────────
  if (searchParams.get("reload") === "1") {
    invalidateKBCache();
    const chunks = loadKBChunks(); // reload immediately
    const stats = getKBStats(chunks);

    return NextResponse.json(
      {
        success: true,
        message: "Knowledge base cache cleared and reloaded from disk.",
        kb: stats,
        cache: getKBCacheStatus(),
      },
      { status: 200 },
    );
  }

  // ── RAG test mode ─────────────────────────────────────────────
  if (searchParams.get("test") === "1") {
    let body: { query?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON with a `query` field." },
        { status: 400 },
      );
    }

    const { query } = body;
    if (!query || typeof query !== "string" || !query.trim()) {
      return NextResponse.json(
        { error: "`query` must be a non-empty string." },
        { status: 400 },
      );
    }

    const chunks = loadKBChunks();
    const result = retrieveRelevantChunks(query.trim(), chunks);

    return NextResponse.json(
      {
        query: query.trim(),
        queryTerms: result.queryTerms,
        topScore: result.topScore,
        usedChunks: result.usedChunks,
        totalChunks: result.totalChunks,
        retrievedChunks: result.chunks.map((c) => ({
          id: c.id,
          section: c.section,
          title: c.title,
          keywords: c.keywords,
          tokenEstimate: c.tokenEstimate,
          // Truncate content in the response for readability
          contentPreview:
            c.content.slice(0, 120) + (c.content.length > 120 ? "…" : ""),
        })),
        formattedContextLength: result.formattedContext.length,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      error:
        "Specify ?reload=1 to reload the KB or ?test=1 with a query body to test RAG.",
      usage: {
        reload: "POST /api/knowledge?reload=1",
        test: "POST /api/knowledge?test=1  body: { query: string }",
      },
    },
    { status: 400 },
  );
}
