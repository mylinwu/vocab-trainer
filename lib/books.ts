import fs from "node:fs";
import path from "node:path";

const BOOKS_DIR = path.join(process.cwd(), "public", "books");

export interface BookEntry {
  wordRank: number;
  headWord: string;
  bookId: string;
  content: unknown;
  contentJson: string;
}

const cache = new Map<string, BookEntry[]>();

export function scanBooks(): string[] {
  if (!fs.existsSync(BOOKS_DIR)) return [];
  return fs
    .readdirSync(BOOKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""))
    .sort();
}

export function loadBook(bookId: string): BookEntry[] {
  if (cache.has(bookId)) return cache.get(bookId)!;
  const file = path.join(BOOKS_DIR, `${bookId}.json`);
  if (!fs.existsSync(file)) return [];
  const raw = fs.readFileSync(file, "utf-8").trim();
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const entries: BookEntry[] = [];
  for (const line of lines) {
    try {
      const obj = JSON.parse(line) as {
        wordRank?: number;
        headWord?: string;
        bookId?: string;
        content?: unknown;
      };
      if (obj.headWord && typeof obj.wordRank === "number") {
        entries.push({
          wordRank: obj.wordRank,
          headWord: obj.headWord,
          bookId: obj.bookId ?? bookId,
          content: obj.content ?? {},
          contentJson: JSON.stringify(obj.content ?? {}),
        });
      }
    } catch {
      // skip malformed lines
    }
  }
  cache.set(bookId, entries);
  return entries;
}

export function getWord(bookId: string, wordRank: number): BookEntry | undefined {
  return loadBook(bookId).find((e) => e.wordRank === wordRank);
}

export function bookSize(bookId: string): number {
  return loadBook(bookId).length;
}

export function clearBookCache(bookId?: string) {
  if (bookId) cache.delete(bookId);
  else cache.clear();
}
