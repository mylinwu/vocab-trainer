"use client";

import { useEffect, useRef } from "react";
import { Info } from "lucide-react";
import { WordDetailModal } from "@/components/WordDetailModal";
import { ttsUrl } from "@/lib/tts";
import type { Accent } from "@/lib/tts";
import { useWordsListStore, rowKey } from "@/lib/stores/words-list-store";
import { logDetailViewed } from "@/app/(app)/learn/actions";
import styles from "./words.module.css";

export interface ListWord {
  bookId: string;
  wordRank: number;
  headWord: string;
  translation: string;
  contentJson: string;
}

const TTS_DEBOUNCE_MS = 600;

function playTts(word: string, lastPlayRef: React.MutableRefObject<number>, accent: string) {
  const now = Date.now();
  if (now - lastPlayRef.current < TTS_DEBOUNCE_MS) return;
  lastPlayRef.current = now;
  const audio = new Audio(ttsUrl(word, accent as Accent));
  audio.play().catch(() => {});
}

export function WordsList({ words, accent }: { words: ListWord[]; accent: string }) {
  const lastPlayRef = useRef(0);

  const rows = useWordsListStore((s) => s.rows);
  const detailWord = useWordsListStore((s) => s.detailWord);
  const updateRow = useWordsListStore((s) => s.updateRow);
  const setDetailWord = useWordsListStore((s) => s.setDetailWord);
  const reset = useWordsListStore((s) => s.reset);

  useEffect(() => {
    reset(words);
  }, [words, reset]);

  function onClickRow(key: string, headWord: string) {
    const row = rows.find((r) => rowKey(r.word) === key);
    if (!row) return;
    playTts(headWord, lastPlayRef, accent);
    updateRow(key, { clicked: true, showTranslation: !row.showTranslation });
  }

  function openDetail(key: string) {
    const row = rows.find((r) => rowKey(r.word) === key);
    if (!row) return;
    updateRow(key, { detailViewed: true });
    setDetailWord(row.word);
    logDetailViewed(row.word.bookId, row.word.wordRank).catch(() => {});
  }

  return (
    <>
      <ul className={styles.list}>
        {rows.map((row) => {
          const key = rowKey(row.word);
          return (
            <li
              key={key}
              className={`${styles.row} ${row.clicked ? styles.rowClicked : ""}`}
              onClick={() => onClickRow(key, row.word.headWord)}
            >
              <div className={styles.rowMain}>
                <span className={styles.word}>{row.word.headWord}</span>
                <button
                  className={styles.iconBtnDetail}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetail(key);
                  }}
                  title="查看详情"
                >
                  <Info size={16} />
                </button>
              </div>
              {row.showTranslation && (
                <div className={styles.translation}>{row.word.translation}</div>
              )}
            </li>
          );
        })}
      </ul>
      {detailWord && (
        <WordDetailModal
          contentJson={detailWord.contentJson}
          headWord={detailWord.headWord}
          accent={accent}
          onClose={() => setDetailWord(null)}
        />
      )}
    </>
  );
}
