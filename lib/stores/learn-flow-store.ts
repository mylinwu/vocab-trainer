import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { PickedWord } from "@/lib/scheduler";

export type Phase = "pick" | "study" | "review" | "done";

export interface RowState {
  word: PickedWord;
  showTranslation: boolean;
  clicked: boolean;
  pickResult?: "known" | "unknown";
  detailViewed: boolean;
  reviewResult?: "remembered" | "forgotten";
}

export function rowKey(word: PickedWord) {
  return `${word.bookId}::${word.wordRank}`;
}

export interface LearnFlowStore {
  phase: Phase;
  rows: RowState[];
  groupIdx: number;
  reviewIdx: number;
  detailWord: PickedWord | null;
  setPhase: (phase: Phase) => void;
  updateRow: (key: string, patch: Partial<RowState>) => void;
  setGroupIdx: (idx: number) => void;
  setReviewIdx: (idx: number) => void;
  setDetailWord: (word: PickedWord | null) => void;
  reset: (words: PickedWord[]) => void;
}

export const useLearnFlowStore = create<LearnFlowStore>()(
  immer((set) => ({
    phase: "pick",
    rows: [],
    groupIdx: 0,
    reviewIdx: 0,
    detailWord: null,

    setPhase: (phase) =>
      set((s) => {
        s.phase = phase;
        if (phase === "study" || phase === "review") {
          for (const row of s.rows) {
            row.clicked = false;
            row.showTranslation = false;
          }
        }
      }),

    updateRow: (key, patch) =>
      set((s) => {
        const idx = s.rows.findIndex((r: RowState) => rowKey(r.word) === key);
        if (idx !== -1) Object.assign(s.rows[idx], patch);
      }),

    setGroupIdx: (idx) =>
      set((s) => {
        s.groupIdx = idx;
      }),

    setReviewIdx: (idx) =>
      set((s) => {
        s.reviewIdx = idx;
      }),

    setDetailWord: (word) =>
      set((s) => {
        s.detailWord = word;
      }),

    reset: (words) =>
      set((s) => {
        s.phase = "pick";
        s.rows = words.map((w) => ({
          word: w,
          showTranslation: false,
          clicked: false,
          detailViewed: false,
        }));
        s.groupIdx = 0;
        s.reviewIdx = 0;
        s.detailWord = null;
      }),
  })),
);
