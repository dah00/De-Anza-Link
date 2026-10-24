import type { NavigatorResponse } from "@/lib/navigator/types";

// Saved answers for repeated first questions, so common ones skip Claude.
//
// Lives in server memory: it empties on every restart and deploy, which also
// keeps it in step with docs/resources.md (only read at startup). On serverless
// hosting each instance has its own copy, so expect fewer hits there. Not stored
// in Supabase on purpose: any signed-in user can write to tables with our key,
// so they could plant fake answers for everyone.

const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 500;

type Entry = { response: NavigatorResponse; savedAt: number };

const entries = new Map<string, Entry>();

/** "Where can I get FREE food?!" and "where can i get free food" share a key. */
export function cacheKey(question: string): string {
  return question
    .toLocaleLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9']+/g, " ")
    .trim();
}

export function getSavedAnswer(key: string): NavigatorResponse | null {
  const entry = entries.get(key);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > TTL_MS) {
    entries.delete(key);
    return null;
  }
  return structuredClone(entry.response);
}

/**
 * Only saves answers worth reusing: confident ones, and not events, since
 * "is X happening" changes from day to day.
 */
export function saveAnswer(key: string, response: NavigatorResponse) {
  if (!key || response.confidence === "low" || response.event) return;

  // Maps keep insertion order, so the first key is the oldest entry.
  if (entries.size >= MAX_ENTRIES && !entries.has(key)) {
    const oldest = entries.keys().next().value;
    if (oldest !== undefined) entries.delete(oldest);
  }
  entries.set(key, {
    response: structuredClone(response),
    savedAt: Date.now(),
  });
}
