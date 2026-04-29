"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./review.module.css";
import type { PickedWord } from "@/lib/scheduler";
import { WordDetailModal } from "@/components/WordDetailModal";
import { ttsUrl } from "@/lib/tts";
import { submitReview, logDetailViewed } from "../learn/actions";

interface RowState {
  word: PickedWord;
  showTranslation: boolean;
  detailViewed: boolean;
  answered: boolean;
  remembered: boolean | null;
}

function playTts(word: string, accent: string) {
  const audio = new Audio(ttsUrl(word, accent as "us" | "uk"));
  audio.play().catch(() => {});
}

export function ReviewFlow({ words, accent }: { words: PickedWord[]; accent: string }) {
  const router = useRouter();
  const [rows, setRows] = useState<RowState[]>(() =>
    words.map((w) => ({ word: w, showTranslation: false, detailViewed: false, answered: false, remembered: null })),
  );
  const [detailWord, setDetailWord] = useState<PickedWord | null>(null);
  const [done, setDone] = useState(false);
  const [, start] = useTransition();

  const allAnswered = rows.every((r) => r.answered);

  function onClickRow(idx: number) {
    const row = rows[idx];
    playTts(row.word.headWord, accent);
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, showTranslation: !r.showTranslation } : r)));
  }

  function openDetail(idx: number) {
    const row = rows[idx];
    setDetailWord(row.word);
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, detailViewed: true } : r)));
    logDetailViewed(row.word.bookId, row.word.wordRank).catch(() => {});
  }

  function answer(idx: number, remembered: boolean) {
    const row = rows[idx];
    start(async () => {
      await submitReview({
        bookId: row.word.bookId,
        wordRank: row.word.wordRank,
        headWord: row.word.headWord,
        remembered,
        detailViewed: row.detailViewed,
      });
    });
    setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, answered: true, remembered } : r)));
  }

  function finish() {
    setDone(true);
  }

  if (done) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>复习完成</h1>
        <p>共复习 {rows.length} 个单词。</p>
        <button
          className={styles.btn}
          onClick={() => {
            router.replace("/dashboard");
            router.refresh();
          }}
        >
          返回仪表盘
        </button>
      </div>
    );
  }

  const rememberedCount = rows.filter((r) => r.answered && r.remembered).length;

  return (
    <>
      <div className={styles.head}>
        <span className={styles.phase}>每日复习</span>
        <span className={styles.progress}>
          {rows.filter((r) => r.answered).length}/{rows.length}
        </span>
      </div>
      <ul className={styles.list}>
        {rows.map((row, idx) => (
          <li key={`${row.word.bookId}-${row.word.wordRank}`} className={`${styles.row} ${row.answered ? styles.rowDone : ""}`}>
            <button className={styles.rowMain} onClick={() => onClickRow(idx)}>
              <span className={styles.word}>{row.word.headWord}</span>
              <span className={styles.translation}>
                {row.showTranslation ? row.word.translation : "（点击播放/查看翻译）"}
              </span>
            </button>
            <div className={styles.actions}>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnDetail}`}
                aria-label="详情"
                onClick={() => openDetail(idx)}
              >
                …
              </button>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnNo}`}
                aria-label="没记住"
                onClick={() => answer(idx, false)}
                disabled={row.answered}
              >
                ✕
              </button>
              <button
                className={`${styles.iconBtn} ${styles.iconBtnYes}`}
                aria-label="记住了"
                onClick={() => answer(idx, true)}
                disabled={row.answered}
              >
                ✓
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className={styles.foot}>
        <span className={styles.summary}>
          已完成 {rows.filter((r) => r.answered).length}/{rows.length}，记住了 {rememberedCount} 个
        </span>
        <button className={styles.secondaryBtn} onClick={finish} disabled={!allAnswered}>
          完成复习
        </button>
        <button className={styles.primaryBtn} onClick={finish} disabled={!allAnswered}>
          返回仪表盘
        </button>
      </div>
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
