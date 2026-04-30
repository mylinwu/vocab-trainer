import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PickedWord } from "@/lib/scheduler";

export interface ReviewRowState {
  word: PickedWord;
  showTranslation: boolean;
  detailViewed: boolean;
  answered: boolean;
  remembered: boolean | null;
}

export function rowKey(word: PickedWord) {
  return `${word.bookId}::${word.wordRank}`;
}

export interface ReviewFlowStore {
  rows: ReviewRowState[];
  detailWord: PickedWord | null;
  done: boolean;
  updateRow: (key: string, patch: Partial<ReviewRowState>) => void;
  setDetailWord: (word: PickedWord | null) => void;
  setDone: (done: boolean) => void;
  reset: (words: PickedWord[]) => void;
}

export const useReviewFlowStore = create<ReviewFlowStore>()(
  immer((set) => ({
    rows: [],
    detailWord: null,
    done: false,

    updateRow: (key, patch) =>
      set((s) => {
        const idx = s.rows.findIndex((r: ReviewRowState) => rowKey(r.word) === key);
        if (idx !== -1) Object.assign(s.rows[idx], patch);
      }),

    setDetailWord: (word) =>
      set((s) => {
        s.detailWord = word;
      }),

    setDone: (done) =>
      set((s) => {
        s.done = done;
      }),

    reset: (words) =>
      set((s) => {
        s.rows = words.map((w) => ({
          word: w,
          showTranslation: false,
          detailViewed: false,
          answered: false,
          remembered: null,
        }));
        s.detailWord = null;
        s.done = false;
      }),
  })),
);
