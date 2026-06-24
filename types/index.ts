// ─── Message & Conversation ───────────────────────────────────────────────

export type SentimentLabel = "positive" | "neutral" | "negative" | "angry";
export type MessageRole = "user" | "assistant";

export interface SentimentScore {
  label: SentimentLabel;
  score: number; // normalised –1.0 → +1.0
  escalate: boolean;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string; // ISO string (safe to serialise)
  sentiment?: SentimentScore;
  language?: string; // BCP-47 tag e.g. "en", "hi", "fr"
  suggestedReplies?: string[];
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  userId?: string;
  sessionId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  isEscalated: boolean;
  sentiment: SentimentScore;
  language: string;
}

// ─── API Request / Response ───────────────────────────────────────────────

export interface ChatRequest {
  message: string;
  conversationHistory: Message[];
  conversationId?: string;
  sessionId?: string;
}

export interface ChatResponse {
  message: string;
  suggestedReplies: string[];
  sentiment: SentimentScore;
  isEscalated: boolean;
  language: string;
  conversationId: string;
}

export interface EscalationRequest {
  conversationId: string;
  sessionId: string;
  messages: Message[];
  sentiment: SentimentScore;
  reason: string;
}

// ─── Analytics & Admin ────────────────────────────────────────────────────

export interface DailyVolume {
  date: string; // "YYYY-MM-DD"
  count: number;
}

export interface TopIssue {
  issue: string;
  count: number;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
  angry: number;
}

export interface AnalyticsData {
  totalConversations: number;
  escalatedCount: number;
  resolutionRate: number; // 0–100
  avgMessagesPerChat: number;
  sentimentBreakdown: SentimentBreakdown;
  dailyVolume: DailyVolume[];
  topIssues: TopIssue[];
  languageBreakdown: Record<string, number>;
}

export interface AdminStats {
  today: {
    conversations: number;
    escalations: number;
    resolvedRate: number;
  };
  weekly: AnalyticsData;
}

// ─── Supabase row shapes ──────────────────────────────────────────────────

export interface ConversationRow {
  id: string;
  session_id: string;
  user_id: string | null;
  messages: Message[];
  is_escalated: boolean;
  sentiment: SentimentScore;
  language: string;
  created_at: string;
  updated_at: string;
}

export interface EscalationRow {
  id: string;
  conversation_id: string;
  reason: string;
  sentiment_score: number;
  created_at: string;
  resolved: boolean;
}
