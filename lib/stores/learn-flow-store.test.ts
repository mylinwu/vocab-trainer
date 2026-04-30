import { describe, expect, it } from "vitest";
import { useLearnFlowStore, rowKey } from "./learn-flow-store";
import type { PickedWord } from "@/lib/scheduler";

const word: PickedWord = {
  bookId: "test-book",
  wordRank: 1,
  headWord: "abandon",
  translation: "放弃",
  contentJson: "{}",
};

describe("learn flow store", () => {
  it("does not carry pick translation state into study phase", () => {
    const key = rowKey(word);

    useLearnFlowStore.getState().reset([word]);
    useLearnFlowStore.getState().updateRow(key, {
      clicked: true,
      showTranslation: true,
      pickResult: "unknown",
    });

    useLearnFlowStore.getState().setPhase("study");

    const [row] = useLearnFlowStore.getState().rows;
    expect(row.clicked).toBe(false);
    expect(row.showTranslation).toBe(false);
  });
});
