/**
 * Dev tools — `window.__vocabDevTools`
 *
 * Exposes a typed helper for querying the current user's word-learning
 * metadata (interval, easeFactor, q-value, status, etc.) from the browser
 * console.  Only available in non-production environments.
 */

export type WordMetaStatus =
  | "LEARNING"
  | "FAMILIAR"
  | "MASTERED";

export interface WordMeta {
  id: string;
  bookId: string;
  wordRank: number;
  headWord: string;
  /** Human-readable status derived from interval */
  status: WordMetaStatus;
  /** Current review interval in days */
  interval: number;
  /** SM-2 ease factor */
  easeFactor: number;
  /** Number of successful repetitions */
  repetitions: number;
  /** ISO date string of last review, or null */
  nextReviewDate: string | null;
  /** Whether the word-detail panel was opened at least once */
  detailViewed: boolean;
  /** How many times this word has been reviewed */
  reviewCount: number;
  /** ISO date string of last review, or null */
  lastReviewedAt: string | null;
  /** ISO date string when the word was first added */
  createdAt: string;
}

/** Shorthand key used in batch queries: "bookId:wordRank" */
export type WordKey = string;

export interface VocabDevTools {
  /**
   * Look up metadata for a single word.
   *
   * @example
   * __vocabDevTools.getWord("CET4luan_1", 1)
   * // → Promise<WordMeta>
   */
  getWord(bookId: string, wordRank: number): Promise<WordMeta | null>;

  /**
   * Look up metadata for multiple words in one request.
   *
   * @example
   * // Single call:
   * await __vocabDevTools.getWords("CET4luan_1:1", "CET4luan_1:2")
   *
   * // Batch across books:
   * await __vocabDevTools.getWords("CET4luan_1:1", "CET6luan_1:42")
   */
  getWords(...keys: WordKey[]): Promise<WordMeta[]>;

  /** List all words for the current user (full metadata). */
  listAll(options?: {
    bookId?: string;
    status?: WordMetaStatus;
    limit?: number;
  }): Promise<WordMeta[]>;
}

function buildDevTools(): VocabDevTools {
  if (process.env.NODE_ENV === "production") {
    return {
      getWord: async () => null,
      getWords: async () => [],
      listAll: async () => [],
    };
  }

  async function getWord(bookId: string, wordRank: number): Promise<WordMeta | null> {
    const url = `/api/words/meta?bookId=${encodeURIComponent(bookId)}&wordRank=${wordRank}`;
    const res = await fetch(url, { credentials: "include" });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`[__vocabDevTools] ${res.status} ${await res.text()}`);
    return res.json();
  }

  async function getWords(...keys: WordKey[]): Promise<WordMeta[]> {
    if (!keys.length) return [];
    const ids = keys.map((k) => encodeURIComponent(k)).join(",");
    const res = await fetch(`/api/words/meta?ids=${ids}`, { credentials: "include" });
    if (!res.ok) throw new Error(`[__vocabDevTools] ${res.status} ${await res.text()}`);
    return res.json();
  }

  async function listAll(options?: {
    bookId?: string;
    status?: WordMetaStatus;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (options?.bookId) params.set("bookId", options.bookId);
    if (options?.status) params.set("status", options.status);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    const url = qs ? `/api/words/meta?${qs}` : "/api/words/meta";
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`[__vocabDevTools] ${res.status} ${await res.text()}`);
    return res.json();
  }

  return { getWord, getWords, listAll };
}

// Augment globalThis so TypeScript is happy in client components.
declare global {
  interface Window {
    __vocabDevTools?: VocabDevTools;
  }
}

/** Call once during app startup (client-side only). */
export function initVocabDevTools() {
  if (typeof window !== "undefined") {
    window.__vocabDevTools = buildDevTools();
  }
}
