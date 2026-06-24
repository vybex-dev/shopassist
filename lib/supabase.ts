/**
 * lib/supabase.ts
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  Message,
  SentimentScore,
  AnalyticsData,
  DailyVolume,
  TopIssue,
  SentimentBreakdown,
} from "@/types";

// ─── Environment check ────────────────────────────────────────────

function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function isServerSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// ─── Client singletons ───────────────────────────────────────────

let _anonClient: SupabaseClient | null = null;
let _serverClient: SupabaseClient | null = null;

export function getAnonClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (_anonClient) return _anonClient;
  _anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } },
  );
  return _anonClient;
}

export function getServerClient(): SupabaseClient | null {
  if (!isServerSupabaseConfigured()) return null;
  if (_serverClient) return _serverClient;
  _serverClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
  return _serverClient;
}

// ─── Row types ────────────────────────────────────────────────────

interface ConversationRow {
  id: string;
  session_id: string;
  user_id: string | null;
  messages: Message[];
  is_escalated: boolean;
  sentiment: SentimentScore;
  language: string;
  message_count: number;
  created_at: string;
  updated_at: string;
}

interface EscalationRow {
  id: string;
  conversation_id: string | null;
  reason: string;
  sentiment_score: number;
  sentiment_label: string;
  contact_email: string | null;
  message_count: number;
  resolved: boolean;
  created_at: string;
}

// ─── Upsert conversation ─────────────────────────────────────────

export interface UpsertConversationData {
  id: string;
  sessionId: string;
  userId?: string;
  messages: Message[];
  isEscalated: boolean;
  sentiment: SentimentScore;
  language: string;
}

export async function upsertConversation(
  data: UpsertConversationData,
): Promise<ConversationRow | null> {
  const db = getServerClient();
  if (!db) {
    console.warn("[Supabase] Not configured — skipping conversation save");
    return null;
  }

  const row = {
    id: data.id,
    session_id: data.sessionId,
    user_id: data.userId ?? null,
    messages: data.messages,
    is_escalated: data.isEscalated,
    sentiment: data.sentiment,
    language: data.language,
    message_count: data.messages.length,
    updated_at: new Date().toISOString(),
  };

  const { data: result, error } = await db
    .from("conversations")
    .upsert(row, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Failed to upsert conversation:", error.message);
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Supabase] ✅ Conversation saved — id: ${data.id.slice(0, 8)}` +
        ` | msgs: ${data.messages.length}` +
        ` | lang: ${data.language}` +
        ` | escalated: ${data.isEscalated}`,
    );
  }

  return result as ConversationRow;
}

// ─── Save escalation ──────────────────────────────────────────────

export interface SaveEscalationData {
  conversationId: string;
  reason: string;
  sentimentScore: number;
  sentimentLabel: string;
  contactEmail?: string;
  messageCount: number;
}

export async function saveEscalation(
  data: SaveEscalationData,
): Promise<EscalationRow | null> {
  const db = getServerClient();
  if (!db) {
    console.warn("[Supabase] Not configured — skipping escalation save");
    return null;
  }

  const { data: result, error } = await db
    .from("escalations")
    .insert({
      conversation_id: data.conversationId,
      reason: data.reason,
      sentiment_score: data.sentimentScore,
      sentiment_label: data.sentimentLabel,
      contact_email: data.contactEmail ?? null,
      message_count: data.messageCount,
      resolved: false,
    })
    .select()
    .single();

  if (error) {
    console.error("[Supabase] Failed to save escalation:", error.message);
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Supabase] 🚨 Escalation saved — id: ${result.id.slice(0, 8)}` +
        ` | conv: ${data.conversationId.slice(0, 8)}` +
        ` | reason: ${data.reason.slice(0, 40)}`,
    );
  }

  return result as EscalationRow;
}

// ─── Get conversation ─────────────────────────────────────────────

export async function getConversationById(
  id: string,
): Promise<ConversationRow | null> {
  const db = getServerClient();
  if (!db) return null;

  const { data, error } = await db
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code !== "PGRST116") {
      console.error("[Supabase] Failed to fetch conversation:", error.message);
    }
    return null;
  }

  return data as ConversationRow;
}

// ─── Analytics queries ────────────────────────────────────────────

export async function getAnalyticsData(
  days: number = 7,
): Promise<AnalyticsData | null> {
  const db = getServerClient();
  if (!db) return null;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Conversations in window
    const { data: conversations, error: convError } = await db
      .from("conversations")
      .select(
        "id, is_escalated, sentiment, language, message_count, created_at",
      )
      .gte("created_at", since)
      .order("created_at", { ascending: true });

    if (convError) throw convError;

    // ── FIX: correct Pick<> generic — was split across lines with a
    //    stray semicolon, making TypeScript treat Pick as a value reference
    //    instead of a generic type.
    const convs = (conversations ?? []) as Pick<
      ConversationRow,
      | "id"
      | "is_escalated"
      | "sentiment"
      | "language"
      | "message_count"
      | "created_at"
    >[];

    // 2. Escalation count
    const { count: escalatedCount, error: escCountErr } = await db
      .from("escalations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);

    if (escCountErr) throw escCountErr;

    // 3. Escalation reasons for top-issues bucketing
    const { data: escalations, error: escError } = await db
      .from("escalations")
      .select("reason")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (escError) throw escError;

    // Derive stats
    const total = convs.length;

    const resolvedRate =
      total > 0
        ? Math.round(((total - (escalatedCount ?? 0)) / total) * 100)
        : 0;

    const avgMessages =
      total > 0
        ? Math.round(
            convs.reduce((s, c) => s + (c.message_count ?? 0), 0) / total,
          )
        : 0;

    const sentimentBreakdown: SentimentBreakdown = {
      positive: 0,
      neutral: 0,
      negative: 0,
      angry: 0,
    };
    for (const c of convs) {
      const label = (c.sentiment as SentimentScore | null)?.label ?? "neutral";
      sentimentBreakdown[label]++;
    }

    const volumeMap = new Map<string, number>();
    for (const c of convs) {
      const day = c.created_at.slice(0, 10);
      volumeMap.set(day, (volumeMap.get(day) ?? 0) + 1);
    }
    const dailyVolume: DailyVolume[] = Array.from(volumeMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const langMap: Record<string, number> = {};
    for (const c of convs) {
      const lang = c.language ?? "en";
      langMap[lang] = (langMap[lang] ?? 0) + 1;
    }

    const issueMap = new Map<string, number>();
    for (const e of escalations ?? []) {
      const reason = (e as { reason: string }).reason;
      const key = reason.toLowerCase().includes("legal")
        ? "Legal threat"
        : reason.toLowerCase().includes("payment")
          ? "Payment dispute"
          : reason.toLowerCase().includes("human")
            ? "Agent request"
            : reason.toLowerCase().includes("angry")
              ? "Customer anger"
              : reason.toLowerCase().includes("negative")
                ? "Repeated frustration"
                : reason.toLowerCase().includes("chargeback")
                  ? "Chargeback threat"
                  : "Other escalation";
      issueMap.set(key, (issueMap.get(key) ?? 0) + 1);
    }
    const topIssues: TopIssue[] = Array.from(issueMap.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalConversations: total,
      escalatedCount: escalatedCount ?? 0,
      resolutionRate: resolvedRate,
      avgMessagesPerChat: avgMessages,
      sentimentBreakdown,
      dailyVolume,
      topIssues,
      languageBreakdown: langMap,
    };
  } catch (err) {
    console.error("[Supabase] Analytics query failed:", err);
    return null;
  }
}

// ─── Health check ─────────────────────────────────────────────────

export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  configured: boolean;
  tableExists: boolean;
  error?: string;
}> {
  if (!isServerSupabaseConfigured()) {
    return { connected: false, configured: false, tableExists: false };
  }

  const db = getServerClient();
  if (!db) {
    return {
      connected: false,
      configured: true,
      tableExists: false,
      error: "Failed to create client",
    };
  }

  try {
    const { error } = await db
      .from("conversations")
      .select("id", { count: "exact", head: true });

    if (error) {
      return {
        connected: true,
        configured: true,
        tableExists: false,
        error: error.message,
      };
    }

    return { connected: true, configured: true, tableExists: true };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      tableExists: false,
      error: String(err),
    };
  }
}
