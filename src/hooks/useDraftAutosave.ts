import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Draft autosave for multi-step forms.
 *
 * Saves a snapshot of form state to localStorage a few seconds after the last
 * change (debounced). Drafts expire after 48 hours and are keyed per user +
 * per form, so two accounts on the same device never see each other's drafts.
 *
 * Photos/files are deliberately NOT saved — on both forms they live on the
 * last step (Photos & Verify / Price & Photos), so on resume the user lands
 * there with everything else already filled in. Payment state is also never
 * restored.
 */

export const DRAFT_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

interface DraftEnvelope<T> {
  savedAt: number;
  data: T;
}

/** Remove stale/expired drafts for this user across known form keys. */
export function cleanupExpiredDrafts(formKeys: string[], userId?: string | null) {
  if (typeof window === 'undefined') return;
  try {
    for (const formKey of formKeys) {
      const key = draftKey(formKey, userId);
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        const env = JSON.parse(raw) as DraftEnvelope<unknown>;
        if (!env || typeof env.savedAt !== 'number' || Date.now() - env.savedAt > DRAFT_TTL_MS) {
          localStorage.removeItem(key);
        }
      } catch {
        // Corrupted draft — drop it
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage unavailable (private mode) — ignore
  }
}

function draftKey(formKey: string, userId?: string | null): string {
  return userId ? `form_draft:${formKey}:${userId}` : `form_draft:${formKey}:anonymous`;
}

export interface UseDraftAutosaveOptions {
  /** Stable identifier for the form, e.g. 'post-enquiry'. */
  formKey: string;
  /** Signed-in user id — drafts are scoped per account. */
  userId?: string | null;
  /** Everything worth restoring (text fields, selections, step index…). */
  getDraft: () => unknown;
  /** Debounce before writing after a change (ms). */
  debounceMs?: number;
  /** Disable saving while true (e.g. form submitted / success screen). */
  disabled?: boolean;
}

export interface UseDraftAutosaveResult<T> {
  /** The restored draft (null when none exists or it was discarded/expired). */
  draft: T | null;
  /** Human-friendly time of the saved draft, e.g. "2:14 PM". */
  savedAtLabel: string | null;
  /** Call once on mount, after initial state has been set. */
  restore: () => void;
  /** Permanently deletes the draft (on successful submit or explicit discard). */
  clearDraft: () => void;
  /** True once the draft has been consumed by restore()/clearDraft(). */
  resolved: boolean;
}

export function useDraftAutosave<T>(
  values: unknown,
  { formKey, userId, getDraft, debounceMs = 2000, disabled = false }: UseDraftAutosaveOptions
): UseDraftAutosaveResult<T> {
  const [draft, setDraft] = useState<T | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);
  const key = draftKey(formKey, userId);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const getDraftRef = useRef(getDraft);
  getDraftRef.current = getDraft;

  // Load any existing draft (within TTL) so restore() can consume it.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const env = JSON.parse(raw) as DraftEnvelope<T>;
      if (!env || typeof env.savedAt !== 'number' || Date.now() - env.savedAt > DRAFT_TTL_MS) {
        localStorage.removeItem(key);
        return;
      }
      setDraft(env.data ?? null);
      setSavedAt(env.savedAt);
    } catch {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }
    // Reload if the key ever changes (user switch mid-mount is an edge case).
  }, [key]);

  // Debounced autosave whenever `values` changes (after the draft is resolved,
  // so we never overwrite a pending resume with initial blank state).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (disabled || !resolved) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      try {
        const data = getDraftRef.current();
        if (!data || (typeof data === 'object' && Object.keys(data as object).length === 0)) {
          // Nothing filled — drop any stale draft instead of saving blanks.
          localStorage.removeItem(key);
          setSavedAt(null);
          return;
        }
        const now = Date.now();
        localStorage.setItem(key, JSON.stringify({ savedAt: now, data }));
        setSavedAt(now);
      } catch {
        // Quota exceeded / private mode — saving is best-effort.
      }
    }, debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, disabled, resolved, key, debounceMs]);

  const restore = useCallback(() => {
    setResolved(true);
    // Draft stays in memory for the caller to apply; storage is cleared so a
    // later reload doesn't offer the same draft again after edits begin.
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  const clearDraft = useCallback(() => {
    setResolved(true);
    setDraft(null);
    setSavedAt(null);
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }, [key]);

  const savedAtLabel = savedAt
    ? new Date(savedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null;

  return { draft, savedAtLabel, restore, clearDraft, resolved };
}
