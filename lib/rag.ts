/**
 * lib/rag.ts
 * ─────────────────────────────────────────────────────────────────
 * Retrieval-Augmented Generation pipeline for ShopAssist.
 *
 * The knowledge base text is parsed into discrete chunks at startup.
 * On every user message, the top-K most relevant chunks are retrieved
 * via keyword-weighted scoring and injected into the system prompt.
 *
 * Why keyword scoring instead of embeddings?
 *  - Zero latency (no embedding API call per turn)
 *  - No extra cost or rate limits
 *  - Works perfectly for structured FAQ content
 *  - Interpretable — easy to debug why a chunk was selected
 *
 * Chunk structure (maps to knowledge-base.txt headings):
 *  ## SECTION HEADER       → sets currentSection
 *  ### Subsection Title    → new chunk starts here
 *  <body text>             → chunk content
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────

export interface KBChunk {
  id: string;
  section: string; // top-level ## heading
  title: string; // ### subheading (the "question")
  content: string; // answer text
  keywords: string[]; // extracted terms for matching
  tokenEstimate: number; // rough token count (chars ÷ 4)
}

export interface RAGResult {
  chunks: KBChunk[];
  formattedContext: string;
  totalChunks: number; // total available in KB
  usedChunks: number; // how many were injected
  topScore: number; // 0–100, confidence of best match
  queryTerms: string[]; // tokenised query (for debugging)
}

// ─── Config ───────────────────────────────────────────────────────

export const RAG_CONFIG = {
  /** Maximum chunks injected per prompt. */
  TOP_K: 5,

  /** Minimum relevance score to include a chunk (0–100). */
  MIN_SCORE_THRESHOLD: 5,

  /**
   * If top score is below this, fall back to injecting ALL chunks
   * (treats it as a general/greeting query).
   */
  FALLBACK_THRESHOLD: 2,

  /** Token budget for RAG context inside the system prompt. */
  MAX_CONTEXT_TOKENS: 3_000,

  /**
   * Section names to ALWAYS include regardless of score.
   * The store info section is small and always useful.
   */
  ALWAYS_INCLUDE_SECTIONS: ["STORE INFORMATION"],

  /**
   * Section names to NEVER expose to the model via RAG.
   * Escalation triggers are handled separately in the prompt.
   */
  EXCLUDED_SECTIONS: [
    "ESCALATION TRIGGERS (INTERNAL — DO NOT SHARE WITH CUSTOMER)",
  ],

  /** Scoring weights for match location. */
  WEIGHTS: {
    titleMatch: 5, // match in the ### title
    keywordMatch: 3, // match in extracted keywords
    sectionMatch: 2, // match in ## section header
    contentMatch: 1, // match in body text
  },
} as const;

// ─── Stopwords ────────────────────────────────────────────────────
// Common English words that don't carry retrieval signal.

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "is",
  "it",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "and",
  "or",
  "but",
  "with",
  "your",
  "our",
  "my",
  "you",
  "we",
  "i",
  "can",
  "will",
  "do",
  "be",
  "have",
  "has",
  "had",
  "not",
  "this",
  "that",
  "are",
  "was",
  "were",
  "may",
  "how",
  "what",
  "when",
  "where",
  "why",
  "who",
  "if",
  "so",
  "as",
  "by",
  "from",
  "which",
  "about",
  "would",
  "could",
  "should",
  "get",
  "im",
  "ive",
  "id",
  "dont",
  "cant",
  "want",
  "need",
  "help",
  "please",
  "thank",
  "thanks",
  "ok",
  "okay",
  "yes",
  "no",
]);

// ─── Keyword extraction ───────────────────────────────────────────

/**
 * Extracts meaningful keywords from a text string.
 * Strips stopwords, punctuation, short tokens, and deduplicates.
 *
 * @param text  Raw text to extract from
 * @returns     Array of unique meaningful terms
 */
export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i) // unique
    .slice(0, 40); // hard cap
}

/**
 * Tokenises a query string into search terms.
 * More aggressive filtering than keyword extraction —
 * removes numbers and very short words.
 */
export function tokeniseQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    .filter((w, i, arr) => arr.indexOf(w) === i);
}

// ─── KB Parser ────────────────────────────────────────────────────

/**
 * Parses knowledge-base.txt into an array of KBChunk objects.
 *
 * Parsing rules:
 *  - Lines starting with `#` (but not `##`) are ignored (file header)
 *  - Lines starting with `## ` set the current section
 *  - Lines starting with `### ` start a new chunk
 *  - All other lines are accumulated as chunk content
 *  - Chunks in EXCLUDED_SECTIONS are dropped
 *
 * @param text  Raw knowledge base file content
 * @returns     Array of parsed, enriched chunks
 */
export function parseKnowledgeBase(text: string): KBChunk[] {
  const chunks: KBChunk[] = [];
  const lines = text.split("\n");

  let currentSection = "";
  let currentTitle = "";
  let contentLines: string[] = [];
  let chunkCounter = 0;

  const flushChunk = () => {
    const content = contentLines.join("\n").trim();
    if (!content || !currentTitle) return;

    // Skip excluded sections
    const isExcluded = RAG_CONFIG.EXCLUDED_SECTIONS.some((ex) =>
      currentSection.includes(ex),
    );
    if (isExcluded) return;

    const keywords = extractKeywords(
      `${currentSection} ${currentTitle} ${content}`,
    );

    chunks.push({
      id: `chunk-${++chunkCounter}`,
      section: currentSection,
      title: currentTitle,
      content,
      keywords,
      tokenEstimate: Math.ceil(content.length / 4),
    });
  };

  for (const line of lines) {
    // File-level header comment — skip
    if (line.startsWith("#") && !line.startsWith("##")) continue;

    // Section header: ##
    if (line.startsWith("## ")) {
      flushChunk();
      currentSection = line.slice(3).trim();
      currentTitle = "";
      contentLines = [];
      continue;
    }

    // Subsection / chunk start: ###
    if (line.startsWith("### ")) {
      flushChunk();
      currentTitle = line.slice(4).trim();
      contentLines = [];
      continue;
    }

    // Blank lines between chunks — keep for readability in output
    if (currentTitle) {
      contentLines.push(line);
    }
  }

  // Flush any trailing chunk
  flushChunk();

  return chunks;
}

// ─── Chunk scorer ─────────────────────────────────────────────────

/**
 * Scores a single chunk against query terms.
 *
 * Scoring breakdown (higher = more relevant):
 *  - Each query term found in chunk title    +5 points
 *  - Each query term found in chunk keywords +3 points
 *  - Each query term found in section header +2 points
 *  - Each query term found in chunk content  +1 point
 *
 * Result is normalised 0–100.
 *
 * @param chunk       KB chunk to score
 * @param queryTerms  Tokenised user query
 * @returns           Score 0–100
 */
export function scoreChunk(chunk: KBChunk, queryTerms: string[]): number {
  if (queryTerms.length === 0) return 0;

  const { WEIGHTS } = RAG_CONFIG;
  let raw = 0;

  const titleLow = chunk.title.toLowerCase();
  const sectionLow = chunk.section.toLowerCase();
  const contentLow = chunk.content.toLowerCase();

  for (const term of queryTerms) {
    if (titleLow.includes(term)) raw += WEIGHTS.titleMatch;
    if (chunk.keywords.includes(term)) raw += WEIGHTS.keywordMatch;
    if (sectionLow.includes(term)) raw += WEIGHTS.sectionMatch;
    if (contentLow.includes(term)) raw += WEIGHTS.contentMatch;

    // Bonus: full phrase match in title (e.g., "track order")
    if (queryTerms.length > 1 && titleLow.includes(queryTerms.join(" "))) {
      raw += 10;
    }
  }

  // Normalise: max possible score per term = titleMatch + keywordMatch + sectionMatch + contentMatch
  const maxPerTerm =
    WEIGHTS.titleMatch +
    WEIGHTS.keywordMatch +
    WEIGHTS.sectionMatch +
    WEIGHTS.contentMatch;
  const maxRaw = queryTerms.length * maxPerTerm + 10; // +10 for phrase bonus
  return Math.min(Math.round((raw / maxRaw) * 100), 100);
}

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Returns true if the given section name is in ALWAYS_INCLUDE_SECTIONS.
 *
 * RAG_CONFIG is `as const`, so ALWAYS_INCLUDE_SECTIONS is inferred as a
 * readonly string-literal tuple. TypeScript's Array.includes() on such a
 * tuple only accepts the exact literal type as its argument — passing a
 * plain `string` is a type error. Widening to `readonly string[]` at the
 * call site is the standard fix.
 */
function isAlwaysIncludedSection(section: string): boolean {
  return (RAG_CONFIG.ALWAYS_INCLUDE_SECTIONS as readonly string[]).includes(
    section,
  );
}

// ─── Retriever ────────────────────────────────────────────────────

/**
 * Retrieves the top-K most relevant chunks for a user query.
 *
 * Strategy:
 *  1. Score every chunk against the tokenised query
 *  2. Always include ALWAYS_INCLUDE_SECTIONS chunks (store info)
 *  3. Sort by score, take top-K above MIN_SCORE_THRESHOLD
 *  4. If top score < FALLBACK_THRESHOLD → return all chunks (general query)
 *  5. Respect MAX_CONTEXT_TOKENS budget — drop lowest-scoring chunks first
 *
 * @param query   Raw user message text
 * @param chunks  Parsed KB chunk array
 * @returns       RAGResult with selected chunks + metadata
 */
export function retrieveRelevantChunks(
  query: string,
  chunks: KBChunk[],
): RAGResult {
  const queryTerms = tokeniseQuery(query);

  // ── 1. Score all chunks ────────────────────────────────────────
  const scored = chunks.map((chunk) => ({
    chunk,
    score: scoreChunk(chunk, queryTerms),
  }));

  // ── 2. Sort by score ───────────────────────────────────────────
  scored.sort((a, b) => b.score - a.score);

  const topScore = scored[0]?.score ?? 0;

  // ── 3. Fallback: general query → include all chunks ────────────
  if (topScore < RAG_CONFIG.FALLBACK_THRESHOLD) {
    const allFormatted = formatChunksForPrompt(chunks);
    return {
      chunks: chunks,
      formattedContext: allFormatted,
      totalChunks: chunks.length,
      usedChunks: chunks.length,
      topScore: 0,
      queryTerms,
    };
  }

  // ── 4. Always-include sections ─────────────────────────────────
  const alwaysInclude = chunks.filter((c) =>
    isAlwaysIncludedSection(c.section),
  );

  // ── 5. Top-K relevant chunks (above threshold) ─────────────────
  const topRelevant = scored
    .filter(
      (s) =>
        s.score >= RAG_CONFIG.MIN_SCORE_THRESHOLD &&
        !isAlwaysIncludedSection(s.chunk.section),
    )
    .slice(0, RAG_CONFIG.TOP_K)
    .map((s) => s.chunk);

  // ── 6. Merge, deduplicate, respect token budget ────────────────
  const merged = deduplicateChunks([...alwaysInclude, ...topRelevant]);
  const budgeted = applyTokenBudget(merged, RAG_CONFIG.MAX_CONTEXT_TOKENS);
  const formatted = formatChunksForPrompt(budgeted);

  return {
    chunks: budgeted,
    formattedContext: formatted,
    totalChunks: chunks.length,
    usedChunks: budgeted.length,
    topScore,
    queryTerms,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function deduplicateChunks(chunks: KBChunk[]): KBChunk[] {
  const seen = new Set<string>();
  return chunks.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
}

function applyTokenBudget(chunks: KBChunk[], budget: number): KBChunk[] {
  let used = 0;
  return chunks.filter((c) => {
    if (used + c.tokenEstimate <= budget) {
      used += c.tokenEstimate;
      return true;
    }
    return false;
  });
}

/**
 * Formats selected chunks into a clean string for the system prompt.
 * Groups chunks by section to avoid repetitive headers.
 */
export function formatChunksForPrompt(chunks: KBChunk[]): string {
  if (chunks.length === 0)
    return "No specific knowledge base sections matched.";

  // Group by section
  const bySection = new Map<string, KBChunk[]>();
  for (const chunk of chunks) {
    if (!bySection.has(chunk.section)) bySection.set(chunk.section, []);
    bySection.get(chunk.section)!.push(chunk);
  }

  const parts: string[] = [];
  for (const [section, sectionChunks] of bySection) {
    parts.push(`## ${section}`);
    for (const chunk of sectionChunks) {
      parts.push(`### ${chunk.title}`);
      parts.push(chunk.content.trim());
    }
  }

  return parts.join("\n\n");
}

// ─── KB Stats ────────────────────────────────────────────────────

export interface KBStats {
  totalChunks: number;
  sections: string[];
  totalCharacters: number;
  estimatedTokens: number;
  chunksBySection: Record<string, number>;
}

export function getKBStats(chunks: KBChunk[]): KBStats {
  const sections = [...new Set(chunks.map((c) => c.section))];
  const totalCharacters = chunks.reduce((s, c) => s + c.content.length, 0);
  const chunksBySection: Record<string, number> = {};

  for (const s of sections) {
    chunksBySection[s] = chunks.filter((c) => c.section === s).length;
  }

  return {
    totalChunks: chunks.length,
    sections,
    totalCharacters,
    estimatedTokens: Math.ceil(totalCharacters / 4),
    chunksBySection,
  };
}
