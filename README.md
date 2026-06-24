# 🛍️ ShopAssist — AI-Powered E-Commerce Support Chatbot

> **FlowZint AI Hackathon 2026 — Official Entry**

A production-quality, full-stack AI customer support chatbot built for modern e-commerce. Combines **RAG knowledge retrieval**, **real-time sentiment detection**, and **11-language support** to deliver instant, accurate, empathetic support — 24/7.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-1.5_Flash-blue?style=flat-square&logo=google)](https://aistudio.google.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-green?style=flat-square&logo=supabase)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)

---

## ✨ Features

| Feature                        | Description                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🧠 **RAG Knowledge Retrieval** | 24-chunk FAQ parsed from `knowledge-base.txt`, keyword-weighted scoring (Title ×5, Keywords ×3, Section ×2, Content ×1), Top-5 injection per query |
| 😤 **Sentiment Detection**     | 130+ keyword dictionary across 4 tiers, ALL CAPS amplification (1.6×), conversation context weighting, 30 hard escalation triggers                 |
| 🌍 **11 Languages**            | Unicode script-range detection + Latin word patterns, full RTL for Arabic, 176 translated UI strings, Gemini replies in detected language          |
| 🚨 **Auto-Escalation**         | 5-state UI (alerting → countdown → submitting → confirmed), 60s timer, email transcript form, `POST /api/escalate`                                 |
| 💬 **Suggested Replies**       | 6 colour-coded categories, staggered chip-in animation, keyboard navigation, skeleton loading during streaming                                     |
| 📊 **Admin Dashboard**         | Recharts: daily volume, sentiment donut, language bars, top issues, live escalation queue — seed data for demo                                     |
| 🗄️ **Supabase DB**             | Postgres with RLS, conversations + escalations tables, fire-and-forget upserts, graceful degradation                                               |
| 📱 **Mobile Responsive**       | `100dvh` keyboard-aware, safe-area insets, iOS zoom fix, overscroll-contain, 44px touch targets                                                    |
| ⚡ **SSE Streaming**           | Server buffers Gemini response, strips metadata markers, re-streams word-by-word at 14ms/token                                                     |

---

## 🎯 Hackathon Scoring Map

| Criterion                      | Weight | What we built                                                                               |
| ------------------------------ | ------ | ------------------------------------------------------------------------------------------- |
| **Model Innovation & Novelty** | 30%    | RAG pipeline + rule-based sentiment engine + multilingual NLP — three independent AI layers |
| **Real-World Applicability**   | 25%    | Full FlowMart e-commerce knowledge base, Supabase persistence, Vercel production deploy     |
| **Technical Architecture**     | 25%    | End-to-end TypeScript, SSE streaming, sliding context window, graceful DB degradation       |
| **Documentation Clarity**      | 20%    | This README, JSDoc on every file, architecture diagrams, full PPT presentation              |

---

## 🏗️ Tech Stack

```
Frontend  → Next.js 14 (App Router) + Tailwind CSS + Syne/DM Sans fonts
AI        → Google Gemini 1.5 Flash (free tier — 15 RPM, 1M TPM)
RAG       → lib/rag.ts — keyword scoring, chunk retrieval, token budgeting
Sentiment → lib/sentiment.ts — rule-based, zero latency, conversation-aware
Database  → Supabase (Postgres) — free tier, 500MB
Auth      → NextAuth.js (wired, extensible)
Deploy    → Vercel — Node.js runtime, 60s function timeout
Language  → TypeScript throughout — shared types across client/server/DB
Charts    → Recharts (AreaChart, PieChart, BarChart)
Icons     → Lucide React
```

---

## 📁 Project Structure

```
shopassist/
├── app/
│   ├── page.tsx                  # Landing page (Syne font, animated demo)
│   ├── chat/page.tsx             # Chat app — all state + SSE reader
│   ├── admin/page.tsx            # Analytics dashboard — password gated
│   └── api/
│       ├── chat/route.ts         # Gemini streaming endpoint (Node.js runtime)
│       ├── escalate/route.ts     # Escalation logger + Supabase persistence
│       ├── analytics/route.ts    # Stats aggregation + seed data fallback
│       ├── conversations/route.ts# Upsert conversation snapshots
│       └── knowledge/route.ts    # KB stats + RAG test + force-reload
├── components/
│   ├── ChatWindow.tsx            # Shell: header, messages, input, escalation
│   ├── MessageBubble.tsx         # User/bot bubbles, typing dots, sentiment dot
│   ├── SuggestedReplies.tsx      # Animated chip strip, keyboard nav, skeleton
│   ├── EscalationAlert.tsx       # 5-state escalation panel with countdown
│   ├── AdminChart.tsx            # All dashboard charts + escalation table
│   └── LanguageSelector.tsx      # Flag dropdown, auto-detect indicator
├── lib/
│   ├── gemini.ts                 # Gemini client, RAG-aware prompt, SSE stream
│   ├── rag.ts                    # KB parser, scorer, retriever, formatter
│   ├── sentiment.ts              # Keyword engine, language detector, scoring
│   ├── memory.ts                 # Sliding window, token budget, conversation ID
│   ├── supabase.ts               # DB clients, upsert, analytics queries
│   ├── i18n.ts                   # 11 × 16 UI string translations
│   └── suggestions.ts            # Category detection, colour config, fallbacks
├── data/
│   └── knowledge-base.txt        # 600+ word FlowMart FAQ (8 sections, 24 chunks)
├── types/
│   └── index.ts                  # Shared TypeScript interfaces
├── vercel.json                   # Function timeouts, SSE headers, region
└── .env.local                    # Your environment variables (see below)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- A free [Google AI Studio](https://aistudio.google.com/app/apikey) API key
- (Optional) A free [Supabase](https://supabase.com) project

### 1 — Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/shopassist.git
cd shopassist
npm install
```

### 2 — Environment Variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
# Required — get free key at aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — app works without these (memory-only mode)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required by next-auth (generate: openssl rand -base64 32)
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000

# Admin dashboard password
NEXT_PUBLIC_ADMIN_PASSWORD=shopassist2026
```

### 3 — Database Setup (optional but recommended)

In Supabase → **SQL Editor** → run the schema from [`docs/schema.sql`](docs/schema.sql):

```sql
create extension if not exists "pgcrypto";

create table conversations (
  id           uuid        primary key default gen_random_uuid(),
  session_id   text        not null,
  messages     jsonb       not null default '[]',
  is_escalated boolean     not null default false,
  sentiment    jsonb       not null default '{"label":"neutral","score":0,"escalate":false}',
  language     text        not null default 'en',
  message_count int        not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table escalations (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        references conversations(id) on delete cascade,
  reason          text        not null,
  sentiment_score float       not null default 0,
  sentiment_label text        not null default 'neutral',
  contact_email   text,
  message_count   int         not null default 0,
  resolved        boolean     not null default false,
  created_at      timestamptz not null default now()
);
```

### 4 — Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

| URL                     | Description                                      |
| ----------------------- | ------------------------------------------------ |
| `/`                     | Landing page                                     |
| `/chat`                 | AI chat interface                                |
| `/admin`                | Analytics dashboard (password: `shopassist2026`) |
| `/api/chat`             | Health check (GET)                               |
| `/api/knowledge`        | KB stats (GET)                                   |
| `/api/knowledge?test=1` | RAG test (POST `{query}`)                        |

---

## 🧠 How the AI Pipeline Works

```
User types: "My package arrived broken, I want a refund"
                    │
                    ▼
  ┌─────────────────────────────────┐
  │  lib/sentiment.ts               │
  │  analyzeSentiment()             │
  │  → label: "negative"           │
  │  → score: -0.45                │
  │  → escalate: false             │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  lib/sentiment.ts               │
  │  detectLanguage()               │
  │  → "en" (Latin default)        │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  lib/rag.ts                     │
  │  tokeniseQuery()                │
  │  → ["package","arrived",        │
  │     "broken","refund"]          │
  │                                 │
  │  retrieveRelevantChunks()       │
  │  → STORE INFORMATION (always)   │
  │  → RETURNS: damaged item (62)   │
  │  → RETURNS: how to return (44)  │
  │  → RETURNS: refund timing (38)  │
  │  3 of 24 chunks · 480 tokens   │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  lib/gemini.ts                  │
  │  buildSystemPrompt()            │
  │  → Personality + language rule  │
  │  → Emotional context for        │
  │    "negative" sentiment         │
  │  → Escalation rules             │
  │  → Injected KB chunks           │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  Google Gemini 1.5 Flash        │
  │  sendMessageStream()            │
  │  → Streams response tokens      │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  parseGeminiResponse()          │
  │  → Strip [ESCALATE] tag         │
  │  → Extract SUGGESTIONS: line    │
  │  → Clean content                │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  SSE → Client (14ms/token)      │
  │  {type:"chunk", content:"..."}  │
  │  {type:"metadata",              │
  │    suggestions:[...],           │
  │    isEscalated:false,           │
  │    sentiment:{...},             │
  │    language:"en"}               │
  │  {type:"done"}                  │
  └──────────────┬──────────────────┘
                 │
                 ▼
  ┌─────────────────────────────────┐
  │  POST /api/conversations        │
  │  (fire-and-forget)              │
  │  → upsertConversation()         │
  │  → Supabase Postgres            │
  └─────────────────────────────────┘
```

---

## 🌍 Supported Languages

| Language   | Code | Detection Method                                    |
| ---------- | ---- | --------------------------------------------------- |
| English    | `en` | Default fallback                                    |
| Hindi      | `hi` | `\u0900–\u097F` Devanagari Unicode range            |
| Arabic     | `ar` | `\u0600–\u06FF` Arabic Unicode range + RTL layout   |
| Chinese    | `zh` | `\u4E00–\u9FFF` CJK Unified Ideographs              |
| Japanese   | `ja` | Hiragana `\u3040–\u309F` + Katakana `\u30A0–\u30FF` |
| Korean     | `ko` | `\uAC00–\uD7AF` Hangul Syllables block              |
| Russian    | `ru` | `\u0400–\u04FF` Cyrillic block                      |
| Spanish    | `es` | Word patterns: hola, pedido, devolución…            |
| French     | `fr` | Word patterns: bonjour, commande, retour…           |
| German     | `de` | Word patterns: hallo, Bestellung, Rücksendung…      |
| Portuguese | `pt` | Word patterns: olá, pedido, devolução…              |

---

## 📊 API Reference

### `POST /api/chat`

Streams an AI response via Server-Sent Events.

**Request:**

```json
{
  "message": "Where is my order?",
  "conversationHistory": [],
  "conversationId": "uuid",
  "sessionId": "uuid"
}
```

**SSE Events:**

```
data: {"type":"chunk","content":"Your "}
data: {"type":"chunk","content":"order "}
data: {"type":"metadata","suggestions":["Track order","Return item","Talk to agent"],"isEscalated":false,"sentiment":{"label":"neutral","score":0},"language":"en"}
data: {"type":"done"}
```

---

### `POST /api/knowledge?test=1`

Tests the RAG retrieval pipeline.

```bash
curl -X POST "http://localhost:3000/api/knowledge?test=1" \
  -H "Content-Type: application/json" \
  -d '{"query": "my item arrived damaged"}'
```

---

### `POST /api/escalate`

Logs an escalation event.

```bash
curl -X POST http://localhost:3000/api/escalate \
  -H "Content-Type: application/json" \
  -d '{"conversationId":"uuid","reason":"Customer requested human agent","sentiment":{"label":"angry","score":-0.87,"escalate":true},"messages":[]}'
```

---

## 🧪 Testing Key Features

```bash
# 1. Health check
curl http://localhost:3000/api/chat

# 2. Stream a response (watch SSE events arrive)
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is your return policy?","conversationHistory":[]}'

# 3. Test multilingual (Hindi)
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"मेरा ऑर्डर कहाँ है?","conversationHistory":[]}'

# 4. Trigger escalation
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"I am furious and want to speak to a manager RIGHT NOW!!!","conversationHistory":[]}'

# 5. RAG test
curl -X POST "http://localhost:3000/api/knowledge?test=1" \
  -H "Content-Type: application/json" \
  -d '{"query":"refund damaged item"}'

# 6. KB stats
curl http://localhost:3000/api/knowledge

# 7. Force KB reload
curl -X POST "http://localhost:3000/api/knowledge?reload=1"
```

---

## 🚀 Deploy to Vercel

### 1 — Push to GitHub

```bash
git init && git add . && git commit -m "feat: ShopAssist hackathon entry"
git remote add origin https://github.com/YOUR_USERNAME/shopassist.git
git push -u origin main
```

### 2 — Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import the repo
2. Framework: **Next.js** (auto-detected)
3. **Add all environment variables** from `.env.local`
4. Set `NEXTAUTH_URL` to your Vercel URL: `https://your-project.vercel.app`
5. Click **Deploy**

### 3 — Verify

```bash
# Replace with your actual URL
curl https://your-project.vercel.app/api/chat
# Expected: {"status":"ok","hasApiKey":true,...}
```

---

## 📐 Architecture Decisions

### Why SSE over WebSockets?

SSE is unidirectional (server → client), which is all we need. It works over standard HTTP, requires no socket upgrade, and is supported natively in Next.js App Router with `ReadableStream`. WebSockets add complexity with no benefit for this use case.

### Why rule-based sentiment over ML?

Zero latency (no API call), no additional cost, interpretable (you can read the keyword dict), and accurate enough for customer support where the vocabulary is domain-specific and limited.

### Why accumulate-then-stream instead of raw passthrough?

Gemini appends `SUGGESTIONS:` and `[ESCALATE]` at the end of its responses. Raw passthrough would show these internal markers to users. We buffer the full response, strip markers, then re-stream clean content at 14ms/token — natural typing feel with no internal leakage.

### Why `100dvh` not `100vh`?

`100vh` on iOS Safari equals the full viewport height including the URL bar. When the URL bar hides or the keyboard appears, `100vh` doesn't update — the chat input gets hidden. `100dvh` (dynamic viewport height) shrinks automatically, keeping the input visible.

### Why fire-and-forget DB saves?

The user's streaming experience should never be blocked by a DB write. We fire `POST /api/conversations` after the `done` SSE event and never await it in the UI. If it fails, we log — but the conversation in the browser is unaffected.

---

## 🗂️ Knowledge Base Structure

`data/knowledge-base.txt` is parsed by `lib/rag.ts` into 24 KBChunk objects:

```
## STORE INFORMATION          → 1 chunk  (ALWAYS_INCLUDE)
## ORDERS & SHIPPING          → 5 chunks
## RETURNS & REFUNDS          → 5 chunks
## PAYMENTS & BILLING         → 5 chunks
## ACCOUNT & LOGIN            → 4 chunks
## PRODUCTS & INVENTORY       → 4 chunks  (partially)
## LOYALTY & PROMOTIONS       → (partial)
## TECHNICAL SUPPORT          → (partial)
## ESCALATION TRIGGERS        → EXCLUDED from RAG (handled separately)
```

To update the knowledge base:

1. Edit `data/knowledge-base.txt`
2. Hit `POST /api/knowledge?reload=1` to clear the cache
3. Next request auto-parses the new content

---

## 🔧 Environment Variables Reference

| Variable                        | Required    | Description                                                                                      |
| ------------------------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `GEMINI_API_KEY`                | ✅ Yes      | Google AI Studio API key — free at [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `NEXT_PUBLIC_SUPABASE_URL`      | ⬜ Optional | Your Supabase project URL                                                                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ⬜ Optional | Supabase anon/public key                                                                         |
| `SUPABASE_SERVICE_ROLE_KEY`     | ⬜ Optional | Supabase service role key (bypasses RLS)                                                         |
| `NEXTAUTH_SECRET`               | ✅ Yes      | Random 32-char secret (`openssl rand -base64 32`)                                                |
| `NEXTAUTH_URL`                  | ✅ Yes      | Your app URL (`http://localhost:3000` in dev)                                                    |
| `NEXT_PUBLIC_ADMIN_PASSWORD`    | ⬜ Optional | Admin dashboard password (default: `shopassist2026`)                                             |
| `NEXT_PUBLIC_APP_URL`           | ⬜ Optional | Public URL for OG tags                                                                           |

---

## 📦 Key Dependencies

```json
{
  "@google/generative-ai": "Gemini SDK — streaming, safety settings, chat history",
  "@supabase/supabase-js": "Supabase client — anon + service role singletons",
  "next-auth": "Auth framework — wired, extensible for production",
  "recharts": "Admin dashboard charts — AreaChart, PieChart, BarChart",
  "lucide-react": "Icon library — consistent stroke icons throughout",
  "uuid": "Conversation + message ID generation"
}
```

---

## 📝 15-Step Build Log

| Step | Feature             | Key files                                                                                       |
| ---- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 1    | Project scaffold    | `types/index.ts`, `tailwind.config.ts`, `globals.css`, `knowledge-base.txt`                     |
| 2    | Gemini streaming    | `lib/gemini.ts`, `app/api/chat/route.ts`                                                        |
| 3    | Chat UI             | `components/ChatWindow.tsx`, `MessageBubble.tsx`, `SuggestedReplies.tsx`, `EscalationAlert.tsx` |
| 4    | Conversation memory | `lib/memory.ts`, `app/chat/page.tsx` (sliding window, clear button)                             |
| 5    | RAG pipeline        | `lib/rag.ts`, `app/api/knowledge/route.ts` (KB parser, scorer, retriever)                       |
| 6    | Sentiment engine    | `lib/sentiment.ts`, `app/api/chat/route.ts` (130+ keywords, 4 tiers)                            |
| 7    | Escalation UI       | `components/EscalationAlert.tsx`, `app/api/escalate/route.ts` (5-state flow)                    |
| 8    | Multilingual        | `lib/i18n.ts`, `components/LanguageSelector.tsx` (11 langs, RTL, 176 strings)                   |
| 9    | Suggested replies   | `lib/suggestions.ts`, `components/SuggestedReplies.tsx` (categories, animation)                 |
| 10   | Supabase            | `lib/supabase.ts`, `app/api/conversations/route.ts` (schema, upsert, analytics)                 |
| 11   | Admin dashboard     | `components/AdminChart.tsx`, `app/admin/page.tsx`, `app/api/analytics/route.ts`                 |
| 12   | Landing page        | `app/page.tsx` (Syne font, animated demo, scoring-aware sections)                               |
| 13   | Mobile responsive   | `app/globals.css`, `ChatWindow.tsx` (dvh, safe-area, iOS fixes)                                 |
| 14   | Vercel deploy       | `vercel.json`, `next.config.mjs` (timeouts, SSE headers, Node.js runtime)                       |
| 15   | Docs                | `README.md`, `ShopAssist_Hackathon_2026.pptx`                                                   |

---

## 📄 License

MIT — built for the FlowZint AI Hackathon 2026.

---

<div align="center">
  <strong>ShopAssist</strong> · Built with ❤️ for FlowZint AI Hackathon 2026<br/>
  Next.js 14 · Gemini 1.5 Flash · Supabase · Vercel · TypeScript
</div>
