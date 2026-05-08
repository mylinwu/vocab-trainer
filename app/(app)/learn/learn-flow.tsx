"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { X } from "lucide-react";
import { Info } from "lucide-react";
import { useGlobalLoading } from "@/components/GlobalLoading";
import styles from "./learn.module.css";
import { useLearnFlowStore, rowKey } from "@/lib/stores/learn-flow-store";
import { WordDetailModal } from "@/components/WordDetailModal";
import { ttsUrl } from "@/lib/tts";
import { markKnown, submitReviewBatch, logDetailViewed, logSessionEvent } from "./actions";

const GROUP_SIZE = 5;
const TTS_DEBOUNCE_MS = 300;

function playTts(word: string, lastPlayRef: React.MutableRefObject<number>, accent: string) {
  const now = Date.now();
  if (now - lastPlayRef.current < TTS_DEBOUNCE_MS) return;
  lastPlayRef.current = now;
  const audio = new Audio(ttsUrl(word, accent as "us" | "uk"));
  audio.play().catch(() => {});
}

export function LearnFlow({ words, accent }: { words: import("@/lib/scheduler").PickedWord[]; accent: string }) {
  const router = useRouter();
  const [, start] = useTransition();
  const { withLoading } = useGlobalLoading();
  const lastPlayRef = useRef(0);
  const reviewSubmittingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const phase = useLearnFlowStore((s) => s.phase);
  const rows = useLearnFlowStore((s) => s.rows);
  const groupIdx = useLearnFlowStore((s) => s.groupIdx);
  const reviewIdx = useLearnFlowStore((s) => s.reviewIdx);
  const detailWord = useLearnFlowStore((s) => s.detailWord);
  const setPhase = useLearnFlowStore((s) => s.setPhase);
  const updateRow = useLearnFlowStore((s) => s.updateRow);
  const setGroupIdx = useLearnFlowStore((s) => s.setGroupIdx);
  const setReviewIdx = useLearnFlowStore((s) => s.setReviewIdx);
  const setDetailWord = useLearnFlowStore((s) => s.setDetailWord);
  const reset = useLearnFlowStore((s) => s.reset);

  useEffect(() => {
    reset(words);
  }, [words, reset]);

  useEffect(() => {
    logSessionEvent("session_start", { count: words.length }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const learnQueue = rows.filter((r) => r.pickResult === "unknown");
  const learnGroups: typeof rows[] = [];
  for (let i = 0; i < learnQueue.length; i += GROUP_SIZE) {
    learnGroups.push(learnQueue.slice(i, i + GROUP_SIZE));
  }

  function onClickRow(key: string, headWord: string) {
    const row = rows.find((r) => rowKey(r.word) === key);
    if (!row) return;
    playTts(headWord, lastPlayRef, accent);
    if (!row.clicked) {
      updateRow(key, { clicked: true });
    } else {
      updateRow(key, { showTranslation: !row.showTranslation });
    }
  }

  function pickKnown(key: string) {
    const row = rows.find((r) => rowKey(r.word) === key);
    if (!row) return;
    updateRow(key, { pickResult: "known" });
    start(async () => {
      await markKnown(row.word.bookId, row.word.wordRank, row.word.headWord);
    });
  }

  function pickUnknown(key: string) {
    updateRow(key, { pickResult: "unknown" });
  }

  function openDetail(key: string) {
    const row = rows.find((r) => rowKey(r.word) === key);
    if (!row) return;
    setDetailWord(row.word);
    updateRow(key, { detailViewed: true });
    logDetailViewed(row.word.bookId, row.word.wordRank).catch(() => {});
  }

  function finishPicking() {
    if (learnQueue.length === 0) {
      logSessionEvent("session_complete", { learned: 0 }).catch(() => {});
      setPhase("done");
    } else {
      setPhase("study");
    }
  }

  function nextGroup() {
    if (groupIdx < learnGroups.length - 1) setGroupIdx(groupIdx + 1);
  }

  function prevGroup() {
    if (groupIdx > 0) setGroupIdx(groupIdx - 1);
  }

  function endStudy() {
    setSubmitError(null);
    setPhase("review");
    setReviewIdx(0);
  }

  async function submitLearnReviewBatch() {
    const items = learnQueue.map((row) => ({
      bookId: row.word.bookId,
      wordRank: row.word.wordRank,
      headWord: row.word.headWord,
      remembered: row.reviewResult === "remembered",
      detailViewed: row.detailViewed,
    }));

    await withLoading(async () => {
      await submitReviewBatch({ items });
    }, "正在提交复习");
  }

  async function answerReview(remembered: boolean) {
    if (reviewSubmittingRef.current) return;
    const cur = learnQueue[reviewIdx];
    if (!cur) return;
    setSubmitError(null);
    updateRow(rowKey(cur.word), { reviewResult: remembered ? "remembered" : "forgotten" });

    if (reviewIdx + 1 < learnQueue.length) {
      setReviewIdx(reviewIdx + 1);
      return;
    }

    reviewSubmittingRef.current = true;
    setIsSubmittingReview(true);
    try {
      await submitLearnReviewBatch();
      logSessionEvent("session_complete", { learned: learnQueue.length }).catch(() => {});
      setPhase("done");
    } catch {
      setSubmitError("提交失败，请重试本轮提交。");
    } finally {
      reviewSubmittingRef.current = false;
      setIsSubmittingReview(false);
    }
  }

  function handleBack() {
    if (phase === "pick") {
      router.replace("/dashboard");
      router.refresh();
      return;
    }
    if (phase === "study") {
      setGroupIdx(0);
      setPhase("pick");
      return;
    }
    if (phase === "review") {
      setGroupIdx(Math.max(learnGroups.length - 1, 0));
      setReviewIdx(0);
      setPhase("study");
    }
  }

  // Phase: Done
  if (phase === "done") {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>本轮完成</h1>
        <p>下一次按 SM-2 计划自动安排复习。</p>
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

  // Phase: Pick
  if (phase === "pick") {
    const remaining = rows.filter((r) => !r.pickResult).length;
    return (
      <div className={styles.flow}>
        <div className={styles.head}>
          <span className={styles.phase}>选词阶段 · 认识打勾，不认识打叉</span>
          <span className={styles.progress}>
            剩余 {remaining}/{rows.length}
          </span>
        </div>
        <ul className={styles.list}>
          {rows.map((r) => {
            const key = rowKey(r.word);
            return (
              <li
                key={key}
                className={`${styles.row} ${r.pickResult ? styles.rowDone : ""}`}
              >
                <button
                  className={styles.rowMain}
                  onClick={() => onClickRow(key, r.word.headWord)}
                >
                  <span className={styles.word}>{r.word.headWord}</span>
                  <span className={styles.translation}>
                    {r.showTranslation ? r.word.translation : "（点击查看释义）"}
                  </span>
                </button>
                <div className={styles.actions}>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnYes}`}
                    aria-label="认识"
                    disabled={!!r.pickResult}
                    onClick={() => pickKnown(key)}
                  >
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnNo}`}
                    aria-label="不认识"
                    disabled={!!r.pickResult}
                    onClick={() => pickUnknown(key)}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className={styles.foot}>
          <button className={styles.secondaryBtn} onClick={handleBack}>
            返回
          </button>
          <button className={styles.primaryBtn} onClick={finishPicking}>
            结束选词（{learnQueue.length} 个待学习）
          </button>
        </div>
      </div>
    );
  }

  // Phase: Study
  if (phase === "study") {
    const group = learnGroups[groupIdx] ?? [];
    return (
      <div className={styles.flow}>
        <div className={styles.head}>
          <span className={styles.phase}>
            学习阶段 · 第 {groupIdx + 1} / {learnGroups.length} 组
          </span>
          <span className={styles.progress}>
            {Math.min((groupIdx + 1) * GROUP_SIZE, learnQueue.length)}/{learnQueue.length}
          </span>
        </div>
        <ul className={styles.list}>
          {group.map((r) => {
            const key = rowKey(r.word);
            return (
              <li key={key} className={styles.row}>
                <button
                  className={styles.rowMain}
                  onClick={() => onClickRow(key, r.word.headWord)}
                >
                  <span className={styles.word}>{r.word.headWord}</span>
                  <span className={styles.translation}>
                    {r.showTranslation ? r.word.translation : "（点击查看释义）"}
                  </span>
                </button>
                <div className={styles.actions}>
                  <button
                    className={`${styles.iconBtn} ${styles.iconBtnDetail}`}
                    aria-label="详情"
                    onClick={() => openDetail(key)}
                  >
                    <Info size={16} strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className={styles.foot}>
          <button className={styles.secondaryBtn} onClick={handleBack}>
            返回
          </button>
          {groupIdx > 0 && (
            <button className={styles.secondaryBtn} onClick={prevGroup}>
              上一组
            </button>
          )}
          {groupIdx < learnGroups.length - 1 ? (
            <button className={styles.primaryBtn} onClick={nextGroup}>
              下一组
            </button>
          ) : (
            <button className={styles.primaryBtn} onClick={endStudy}>
              结束本轮
            </button>
          )}
        </div>
        {detailWord && (
          <WordDetailModal
            contentJson={detailWord.contentJson}
            headWord={detailWord.headWord}
            accent={accent}
            onClose={() => setDetailWord(null)}
          />
        )}
      </div>
    );
  }

  // Phase: Review
  const cur = learnQueue[reviewIdx];
  if (!cur) return null;
  const curKey = rowKey(cur.word);
  return (
    <div className={styles.flow}>
      <div className={styles.head}>
        <span className={styles.phase}>本轮复习</span>
        <span className={styles.progress}>
          {reviewIdx + 1}/{learnQueue.length}
        </span>
      </div>
      {submitError && <div className={styles.errorBox}>{submitError}</div>}
      <ul className={styles.list}>
        <li className={styles.row}>
          <button className={styles.rowMain} onClick={() => onClickRow(curKey, cur.word.headWord)}>
            <span className={styles.word}>{cur.word.headWord}</span>
            <span className={styles.translation}>
              {cur.showTranslation ? cur.word.translation : "（点击查看释义）"}
            </span>
          </button>
          <div className={styles.actions}>
            <button
              className={`${styles.iconBtn} ${styles.iconBtnDetail}`}
              aria-label="详情"
              onClick={() => openDetail(curKey)}
            >
              <Info size={16} strokeWidth={2} />
            </button>
          </div>
        </li>
      </ul>
      <div className={styles.foot}>
        <button className={styles.secondaryBtn} onClick={handleBack}>
          返回
        </button>
        <button
          className={styles.secondaryBtn}
          onClick={() => void answerReview(false)}
          disabled={isSubmittingReview}
        >
          没记住
        </button>
        <button
          className={styles.primaryBtn}
          onClick={() => void answerReview(true)}
          disabled={isSubmittingReview}
        >
          记住了
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
    </div>
  );
}
