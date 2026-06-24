/**
 * components/LanguageSelector.tsx
 * ─────────────────────────────────────────────────────────────────
 * Compact language picker for the chat header.
 *
 * Trigger: [🇮🇳 HI ⚡]  (⚡ = auto-detected, not manual)
 * Dropdown: flag + native name + English name + RTL badge + check
 *
 * Keyboard: Escape closes panel
 * Pointer:  click outside closes panel
 * ─────────────────────────────────────────────────────────────────
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, Zap } from "lucide-react";
import {
  SUPPORTED_LANGUAGES,
  getLanguageInfo,
  type LanguageInfo,
} from "@/lib/i18n";

interface LanguageSelectorProps {
  activeLanguage: string;
  onLanguageChange: (code: string) => void;
  source: "auto" | "manual";
}

export default function LanguageSelector({
  activeLanguage,
  onLanguageChange,
  source,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLang = getLanguageInfo(activeLanguage);
  const showAutoTag = source === "auto" && activeLanguage !== "en";

  // ── Close on click outside ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // ── Close on Escape ───────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onLanguageChange(code);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* ── Trigger ───────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        title={`Language: ${currentLang.name}${showAutoTag ? " (auto-detected)" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select language — current: ${currentLang.name}`}
        className={`
          flex items-center gap-1.5 px-2 py-1.5 rounded-lg border
          text-[11px] font-medium transition-all duration-150
          ${
            isOpen
              ? "bg-slate-700 border-slate-500 text-slate-200"
              : "bg-slate-700/60 border-slate-600/40 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
          }
        `}
      >
        <span className="text-sm leading-none">{currentLang.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wider">
          {currentLang.code}
        </span>
        {/* Auto-detected bolt (hidden on mobile) */}
        {showAutoTag && (
          <Zap
            className="w-2.5 h-2.5 text-amber-400 hidden sm:block"
            fill="currentColor"
          />
        )}
        {/* Globe icon on mobile (no text) */}
        <Globe className="w-3 h-3 sm:hidden" />
      </button>

      {/* ── Dropdown ──────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select language"
          className="
            absolute right-0 top-full mt-1.5 z-50
            w-56 rounded-xl overflow-hidden
            bg-slate-800 border border-slate-600/50
            shadow-2xl shadow-black/50 animate-fade-in
          "
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700">
            <Globe className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide flex-1">
              Language
            </span>
            {showAutoTag && (
              <span className="flex items-center gap-1 text-[10px] text-amber-400">
                <Zap className="w-2.5 h-2.5" fill="currentColor" />
                Auto-detected
              </span>
            )}
          </div>

          {/* Language list */}
          <div className="max-h-72 overflow-y-auto scrollbar-thin py-1">
            {SUPPORTED_LANGUAGES.map((lang: LanguageInfo) => {
              const selected = lang.code === activeLanguage;
              return (
                <button
                  key={lang.code}
                  role="option"
                  aria-selected={selected}
                  onClick={() => handleSelect(lang.code)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2 text-left
                    transition-colors duration-100
                    ${
                      selected
                        ? "bg-blue-600/20 text-blue-300"
                        : "text-slate-300 hover:bg-slate-700/70"
                    }
                  `}
                >
                  {/* Flag */}
                  <span className="w-5 text-center text-base leading-none flex-none">
                    {lang.flag}
                  </span>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {lang.nativeName}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {lang.name}
                    </div>
                  </div>

                  {/* RTL badge */}
                  {lang.rtl && (
                    <span className="text-[9px] text-slate-500 border border-slate-600 rounded px-1 flex-none">
                      RTL
                    </span>
                  )}

                  {/* Selected check */}
                  {selected && (
                    <Check
                      className="w-3 h-3 text-blue-400 flex-none"
                      strokeWidth={2.5}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-700 text-[10px] text-slate-500 leading-relaxed">
            ShopAssist replies automatically in your language
          </div>
        </div>
      )}
    </div>
  );
}
