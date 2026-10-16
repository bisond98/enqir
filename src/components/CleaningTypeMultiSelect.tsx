import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";

import { CLEANING_SERVICE_TYPES } from "@/constants/categories";
import { cn } from "@/lib/utils";

interface CleaningTypeMultiSelectProps {
  /** Selected cleaning types (labels). Controlled by the parent form. */
  value: string[];
  onChange: (next: string[]) => void;
}

// A–Z, case-insensitive — "Other" sorts into place, Cancel stays pinned last
const OPTIONS = [...CLEANING_SERVICE_TYPES, "Other"].sort((a, b) =>
  a.localeCompare(b, undefined, { sensitivity: "base" })
);

/**
 * Compact multi-select for the Cleaning Services category.
 * Tap rows to pick several (panel stays open); "Other" is just another
 * option; Cancel and any outside tap close the panel, keeping the selection.
 */
export function CleaningTypeMultiSelect({ value, onChange }: CleaningTypeMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, width: 0 });

  // Portal'd panel position — pinned below the trigger (flips above / clamps
  // into the viewport like the sale-listing share popup) and kept in place on
  // scroll/resize so it never detaches from the field.
  useLayoutEffect(() => {
    if (!open) return;
    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const panelHeight = 224; // max-h-56
      const margin = 8;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      let top: number;
      if (spaceBelow >= panelHeight + margin) {
        top = rect.bottom + 6;
      } else if (spaceAbove >= panelHeight + margin) {
        top = rect.top - panelHeight - 6;
      } else {
        top = Math.min(Math.max(rect.bottom + 6, margin), Math.max(margin, window.innerHeight - panelHeight - margin));
      }
      const left = Math.min(
        Math.max(rect.left, margin),
        Math.max(margin, window.innerWidth - rect.width - margin)
      );
      setPanelPos({ top, left, width: rect.width });
    };
    compute();
    const onMove = () => compute();
    window.addEventListener("scroll", onMove, { passive: true, capture: true });
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, { capture: true });
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  // Outside click or Escape dismisses the dropdown — selection is kept.
  // Same pattern as the share popup: defer one tick so the opening click is
  // never caught, and ignore clicks on the trigger or inside the portal menu.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (rootRef.current?.contains(target)) return;
      if (target.closest("[data-cleaning-menu]")) return;
      setOpen(false);
    };
    const id = setTimeout(() => {
      document.addEventListener("click", handleClick);
    }, 0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (t: string) => {
    onChange(value.includes(t) ? value.filter((v) => v !== t) : [...value, t]);
  };

  // Custom 3px scroll indicator. The native scrollbar is hidden because Chrome
  // (121+) prefers the standard `scrollbar-width` property over ::-webkit-scrollbar
  // and renders `thin` on macOS as the fat system overlay pill — which is exactly
  // what the user saw. A hand-drawn thumb is identical on every platform.
  const scrollRowRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const row = scrollRowRef.current;
    const thumb = thumbRef.current;
    if (!row || !thumb) return;
    // Indicator is only visible WHILE scrolling — fades out after it settles.
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const sync = () => {
      const track = row.clientWidth;
      const content = row.scrollWidth;
      if (content <= track + 1) {
        thumb.style.display = 'none';
        return;
      }
      const thumbW = Math.max(20, Math.round((track / content) * track));
      const progress = row.scrollLeft / (content - track);
      thumb.style.display = 'block';
      thumb.style.width = `${thumbW}px`;
      thumb.style.transform = `translateX(${Math.round(progress * (track - thumbW - 12))}px)`;
    };
    const onScroll = () => {
      sync();
      thumb.style.opacity = '1';
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        thumb.style.opacity = '0';
      }, 900);
    };
    const ro = new ResizeObserver(sync);
    ro.observe(row);
    row.addEventListener('scroll', onScroll, { passive: true });
    sync();
    return () => {
      clearTimeout(hideTimer);
      ro.disconnect();
      row.removeEventListener('scroll', onScroll);
    };
  }, [value]);

  const summary =
    value.length === 0
      ? "Select cleaning types"
      : value.length === 1
        ? value[0]
        : `${value.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      {/* Compact grey trigger */}
      <button
        type="button"
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "w-full rounded-xl h-9 sm:h-10 text-xs sm:text-[13px] font-bold border border-gray-400 bg-gray-200 pl-3 pr-8 flex items-center justify-between gap-2 transition-colors hover:bg-gray-300 focus:outline-none focus:border-black",
          value.length === 0 ? "text-[11px] font-semibold text-gray-900" : "text-black"
        )}
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform", open && "rotate-180")} />
      </button>

      {/* Selected cleanings — small chips in one line */}
      {value.length > 0 && (
        <div className="relative mt-1.5">
          <div
            ref={scrollRowRef}
            className="flex items-center gap-1 overflow-x-auto bg-gray-100 rounded-lg px-1.5 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {value.map((t) => (
              <span
                key={t}
                className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gray-300 border border-gray-400 pl-1.5 pr-2 py-px text-[9px] font-bold text-gray-700"
              >
                {t}
                <button
                  type="button"
                  aria-label={`Remove ${t}`}
                  onClick={() => onChange(value.filter((v) => v !== t))}
                  className="!min-h-0 !min-w-0 !p-0 flex items-center justify-center rounded-full text-gray-500 hover:text-black"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            ))}
          </div>
          {/* Hand-drawn indicator: 3px tall, black, rounded — platform-independent */}
          <div
            ref={thumbRef}
            aria-hidden="true"
            className="absolute left-1.5 bottom-0.5 h-[3px] w-0 rounded-full bg-black transition-opacity duration-300"
            style={{ display: 'none', opacity: 0 }}
          />
        </div>
      )}

      {/* Blur/dim backdrop + option panel — portaled to document.body so the
          backdrop covers the FULL screen exactly like the sale-listing share
          popup (an in-page backdrop gets clipped by transformed ancestors). */}
      {open &&
        createPortal(
          <>
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-[3px]"
              style={{ zIndex: 9998 }}
              aria-hidden="true"
              onClick={() => setOpen(false)}
            />
            <div
              role="listbox"
              data-cleaning-menu
              className="fixed z-[9999] max-h-56 overflow-y-auto rounded-xl border-2 border-black bg-white shadow-[0_4px_0_0_rgba(0,0,0,0.2)]"
              style={{ top: panelPos.top, left: panelPos.left, width: panelPos.width }}
            >
          {OPTIONS.map((t) => {
            const selected = value.includes(t);
            return (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => toggle(t)}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold border-b border-slate-100 transition-colors",
                  selected ? "bg-gray-200 text-black" : "text-black hover:bg-gray-100"
                )}
              >
                <span>{t}</span>
                <Check className={cn("h-3.5 w-3.5 shrink-0", selected ? "text-black" : "text-transparent")} />
              </button>
            );
          })}
          {/* Cancel always last */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-xs font-bold text-gray-500 hover:bg-gray-100"
          >
            <span>Cancel</span>
            <X className="h-3.5 w-3.5" />
          </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
}
