/**
 * components/SuggestedReplies.tsx  (Step 9 — full upgrade)
 * ─────────────────────────────────────────────────────────────────
 * Features added in this step:
 *  - isLoading prop → 3 skeleton ghost chips while Gemini is streaming
 *  - Staggered entrance animation (80 ms gap between chips)
 *  - Category colour-coding via lib/suggestions.ts
 *  - Horizontal scroll with hidden scrollbar (mobile overflow)
 *  - Keyboard navigation (← → Arrow keys, Enter, Escape to dismiss)
 *  - Dismiss (×) button — collapses the entire strip
 *  - Animation key reset — chips re-animate when suggestions change
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useEffect, useRef, useCallback, useId } from "react";
import { X, Sparkles } from "lucide-react";
import {
  categorizeSuggestions,
  getCategoryConfig,
  type CategorizedSuggestion,
} from "@/lib/suggestions";

// ─── Props ────────────────────────────────────────────────────────

interface SuggestedRepliesProps {
  suggestions: string[];
  onSelect: (text: string) => void;
  label?: string;
  isLoading?: boolean; // show skeleton while streaming
}

// ─── Skeleton chip ────────────────────────────────────────────────

const SKELETON_WIDTHS = ["w-28", "w-36", "w-24"] as const;

function SkeletonChips() {
  return (
    <div
      aria-hidden="true"
      aria-label="Loading suggestions"
      className="flex items-center gap-2"
    >
      {SKELETON_WIDTHS.map((width, i) => (
        <div
          key={i}
          className={`
            ${width} h-7 rounded-full skeleton-shimmer
            border border-indigo-900/40
          `}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
      {/* "AI thinking" label */}
      <div
        className="flex items-center gap-1 ml-1 text-[10px]"
        style={{ color: "#64748b" }}
      >
        <Sparkles className="w-2.5 h-2.5" style={{ color: "#a78bfa" }} />
        <span className="hidden sm:inline">AI thinking…</span>
      </div>
    </div>
  );
}

// ─── Single chip ──────────────────────────────────────────────────

interface ChipProps {
  item: CategorizedSuggestion;
  index: number;
  onSelect: (text: string) => void;
  chipRef: (el: HTMLButtonElement | null) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => void;
}

function SuggestionChip({
  item,
  index,
  onSelect,
  chipRef,
  onKeyDown,
}: ChipProps) {
  const cfg = getCategoryConfig(item.category);

  return (
    <button
      ref={chipRef}
      onClick={() => onSelect(item.text)}
      onKeyDown={(e) => onKeyDown(e, index)}
      aria-label={`${cfg.label}: ${item.text}`}
      className={`
        animate-chip-in
        flex-none flex items-center gap-1.5
        px-3 py-1.5 rounded-full text-xs font-medium
        border transition-all duration-150
        active:scale-95 whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1
        ${cfg.bg} ${cfg.border} ${cfg.text} ${cfg.hoverBg}
      `}
      style={{
        animationDelay: `${index * 80}ms`,
        animationFillMode: "both",
      }}
    >
      {/* Category colour dot */}
      <span
        aria-hidden="true"
        className={`w-1.5 h-1.5 rounded-full flex-none ${cfg.dot}`}
      />

      {/* Chip text */}
      <span>{item.text}</span>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────

export default function SuggestedReplies({
  suggestions,
  onSelect,
  label = "Quick replies",
  isLoading = false,
}: SuggestedRepliesProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  // Refs for keyboard navigation
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const id = useId();

  // Re-animate chips when suggestions content changes
  useEffect(() => {
    if (suggestions.length > 0) {
      setIsDismissed(false);
      setAnimationKey((k) => k + 1);
    }
  }, [suggestions.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard navigation between chips
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown": {
          e.preventDefault();
          const next = chipRefs.current[(index + 1) % suggestions.length];
          next?.focus();
          break;
        }
        case "ArrowLeft":
        case "ArrowUp": {
          e.preventDefault();
          const prev =
            chipRefs.current[
              (index - 1 + suggestions.length) % suggestions.length
            ];
          prev?.focus();
          break;
        }
        case "Escape": {
          setIsDismissed(true);
          break;
        }
        default:
          break;
      }
    },
    [suggestions.length],
  );

  // Don't render if dismissed (and not loading)
  if (isDismissed && !isLoading) return null;

  // Don't render if no content and not loading
  if (!isLoading && suggestions.length === 0) return null;

  const categorized = categorizeSuggestions(suggestions);

  return (
    <div
      role="region"
      aria-label="Suggested replies"
      aria-live="polite"
      className="
        flex-none backdrop-blur-md
        border-t
        px-4 py-2.5
        animate-fade-in
      "
      style={{
        background: "rgba(2,8,24,0.97)",
        borderColor: "rgba(99,102,241,0.15)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        {/* ── Header row ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "#94a3b8" }}
          >
            {isLoading ? "Preparing suggestions…" : label}
          </p>

          {/* Dismiss — hidden while loading */}
          {!isLoading && suggestions.length > 0 && (
            <button
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss suggestions"
              className="
                w-5 h-5 rounded-full flex items-center justify-center
                transition-colors
              "
              style={{ color: "#475569" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#94a3b8")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#475569")
              }
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* ── Chip row — horizontally scrollable ───────────────── */}
        <div
          id={id}
          className="
            flex items-center gap-2
            overflow-x-auto
            pb-0.5               /* room for focus ring */
            scrollbar-none       /* hide scrollbar cross-browser */
            [&::-webkit-scrollbar]:hidden
            [-ms-overflow-style:none]
            [scrollbar-width:none]
          "
        >
          {isLoading ? (
            <SkeletonChips />
          ) : (
            /* key resets animation when suggestions change */
            <div key={animationKey} className="flex items-center gap-2">
              {categorized.map((item, i) => (
                <SuggestionChip
                  key={`${item.text}-${i}`}
                  item={item}
                  index={i}
                  onSelect={onSelect}
                  chipRef={(el) => {
                    chipRefs.current[i] = el;
                  }}
                  onKeyDown={handleKeyDown}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Scroll hint (mobile) — fades out after 3s ─────────── */}
        {!isLoading && suggestions.length > 2 && <ScrollHint />}
      </div>
    </div>
  );
}

// ─── Scroll hint ──────────────────────────────────────────────────
// Appears briefly on mobile to hint that chips are scrollable.

function ScrollHint() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <p
      className="
        sm:hidden text-[9px] text-slate-300 mt-1 text-right
        animate-fade-in
      "
      aria-hidden="true"
    >
      ← scroll for more →
    </p>
  );
}
