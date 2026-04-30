"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./review.module.css";
import { useReviewFlowStore, rowKey } from "@/lib/stores/review-flow-store";
import { WordDetailModal } from "@/components/WordDetailModal";
import { ttsUrl } from "@/lib/tts";
import { submitReview, logDetailViewed } from "../learn/actions";

function playTts(word: string, accent: string) {
  const audio = new Audio(ttsUrl(word, accent as "us" | "uk"));
  audio.play().catch(() => {});
}

export function ReviewFlow({
  words,
  accent,
}: {
  words: import("@/lib/scheduler").PickedWord[];
  accent: string;
}) {
  const router = useRouter();
  const [, start] = useTransition();

  const rows = useReviewFlowStore((s) => s.rows);
  const detailWord = useReviewFlowStore((s) => s.detailWord);
  const done = useReviewFlowStore((s) => s.done);
  const updateRow = useReviewFlowStore((s) => s.updateRow);
  const setDetailWord = useReviewFlowStore((s) => s.setDetailWord);
  const setDone = useReviewFlowStore((s) => s.setDone);
  const reset = useReviewFlowStore((s) => s.reset);

  useEffect(() => {
    reset(words);
  }, [words, reset]);

  const allAnswered = rows.every((r) => r.answered);
  const answeredCount = rows.filter((r) => r.answered).length;
  const rememberedCount = rows.filter((r) => r.answered && r.remembered).length;

  function onClickRow(idx: number) {
    const row = rows[idx];
    playTts(row.word.headWord, accent);
    updateRow(rowKey(row.word), { showTranslation: !row.showTranslation });
  }

  function openDetail(idx: number) {
    const row = rows[idx];
    setDetailWord(row.word);
    updateRow(rowKey(row.word), { detailViewed: true });
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
    updateRow(rowKey(row.word), { answered: true, remembered });
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

  return (
    <>
      <div className={styles.head}>
        <span className={styles.phase}>每日复习</span>
        <span className={styles.progress}>
          {answeredCount}/{rows.length}
        </span>
      </div>
      <ul className={styles.list}>
        {rows.map((row, idx) => (
          <li
            key={rowKey(row.word)}
            className={`${styles.row} ${row.answered ? styles.rowDone : ""}`}
          >
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
          已完成 {answeredCount}/{rows.length}，记住了 {rememberedCount} 个
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
