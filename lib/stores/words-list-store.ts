import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ListWord } from "@/app/(app)/words/words-list";

export function rowKey(word: ListWord) {
  return `${word.bookId}::${word.wordRank}`;
}

export interface WordsListRowState {
  word: ListWord;
  showTranslation: boolean;
  clicked: boolean;
  detailViewed: boolean;
}

export interface WordsListStore {
  rows: WordsListRowState[];
  detailWord: ListWord | null;
  updateRow: (key: string, patch: Partial<WordsListRowState>) => void;
  setDetailWord: (word: ListWord | null) => void;
  reset: (words: ListWord[]) => void;
}

export const useWordsListStore = create<WordsListStore>()(
  immer((set) => ({
    rows: [],
    detailWord: null,

    updateRow: (key, patch) =>
      set((s) => {
        const idx = s.rows.findIndex((r: WordsListRowState) => rowKey(r.word) === key);
        if (idx !== -1) Object.assign(s.rows[idx], patch);
      }),

    setDetailWord: (word) =>
      set((s) => {
        s.detailWord = word;
      }),

    reset: (words) =>
      set((s) => {
        s.rows = words.map((w) => ({
          word: w,
          showTranslation: false,
          clicked: false,
          detailViewed: false,
        }));
        s.detailWord = null;
      }),
  })),
);
