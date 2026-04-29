"use client";

import { useMemo, useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { X } from "lucide-react";
import { Info } from "lucide-react";
import styles from "./learn.module.css";
import type { PickedWord } from "@/lib/scheduler";
import { WordDetailModal } from "@/components/WordDetailModal";
import { ttsUrl } from "@/lib/tts";
import { markKnown, submitReview, logDetailViewed, logSessionEvent } from "./actions";

type Phase = "pick" | "study" | "review" | "done";

interface RowState {
  word: PickedWord;
  showTranslation: boolean;
  clicked: boolean;
  pickResult?: "known" | "unknown";
  detailViewed: boolean;
  reviewResult?: "remembered" | "forgotten";
}

const GROUP_SIZE = 5;
const TTS_DEBOUNCE_MS = 300;

function playTts(word: string, lastPlayRef: React.MutableRefObject<number>, accent: string) {
  const now = Date.now();
  if (now - lastPlayRef.current < TTS_DEBOUNCE_MS) return;
  lastPlayRef.current = now;
  const audio = new Audio(ttsUrl(word, accent as "us" | "uk"));
  audio.play().catch(() => {});
}

function rowKey(word: PickedWord) {
  return `${word.bookId}::${word.wordRank}`;
}

export function LearnFlow({ words, accent }: { words: PickedWord[]; accent: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("pick");
  const [rows, setRows] = useState<RowState[]>(() =>
    words.map((w) => ({ word: w, showTranslation: false, clicked: false, detailViewed: false })),
  );
  const [groupIdx, setGroupIdx] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [detailWord, setDetailWord] = useState<PickedWord | null>(null);
  const [, start] = useTransition();
  const lastPlayRef = useRef(0);

  useEffect(() => {
    logSessionEvent("session_start", { count: words.length }).catch(() => {});
  }, [words.length]);

  const learnQueue = useMemo(
    () => rows.filter((r) => r.pickResult === "unknown"),
    [rows],
  );
  const learnGroups = useMemo(() => {
    const groups: RowState[][] = [];
    for (let i = 0; i < learnQueue.length; i += GROUP_SIZE) {
      groups.push(learnQueue.slice(i, i + GROUP_SIZE));
    }
    return groups;
  }, [learnQueue]);

  function updateRow(key: string, patch: Partial<RowState>) {
    setRows((rs) => rs.map((r) => (rowKey(r.word) === key ? { ...r, ...patch } : r)));
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
    setPhase("review");
    setReviewIdx(0);
  }

  function answerReview(remembered: boolean) {
    const cur = learnQueue[reviewIdx];
    if (!cur) return;
    updateRow(rowKey(cur.word), { reviewResult: remembered ? "remembered" : "forgotten" });
    start(async () => {
      await submitReview({
        bookId: cur.word.bookId,
        wordRank: cur.word.wordRank,
        headWord: cur.word.headWord,
        remembered,
        detailViewed: cur.detailViewed,
      });
    });
    if (reviewIdx + 1 >= learnQueue.length) {
      logSessionEvent("session_complete", { learned: learnQueue.length }).catch(() => {});
      setPhase("done");
    } else {
      setReviewIdx(reviewIdx + 1);
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
      <>
        <div className={styles.head}>
          <span className={styles.phase}>选词阶段 · 认识打勾，不认识打叉</span>
          <span className={styles.progress}>剩余 {remaining}/{rows.length}</span>
        </div>
        <ul className={styles.list}>
          {rows.map((r) => {
            const key = rowKey(r.word);
            return (
              <li key={key} className={`${styles.row} ${r.pickResult ? styles.rowDone : ""}`}>
                <button className={styles.rowMain} onClick={() => onClickRow(key, r.word.headWord)}>
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
          <button className={styles.primaryBtn} onClick={finishPicking}>
            结束选词（{learnQueue.length} 个待学习）
          </button>
        </div>
      </>
    );
  }

  // Phase: Study
  if (phase === "study") {
    const group = learnGroups[groupIdx] ?? [];
    return (
      <>
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
                <button className={styles.rowMain} onClick={() => onClickRow(key, r.word.headWord)}>
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
      </>
    );
  }

  // Phase: Review (this round)
  const cur = learnQueue[reviewIdx];
  if (!cur) return null;
  const curKey = rowKey(cur.word);
  return (
    <>
      <div className={styles.head}>
        <span className={styles.phase}>本轮复习</span>
        <span className={styles.progress}>
          {reviewIdx + 1}/{learnQueue.length}
        </span>
      </div>
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
        <button className={styles.secondaryBtn} onClick={() => answerReview(false)}>
          没记住
        </button>
        <button className={styles.primaryBtn} onClick={() => answerReview(true)}>
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
    </>
  );
}
