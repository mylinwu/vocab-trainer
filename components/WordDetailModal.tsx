"use client";

import { useMemo } from "react";
import styles from "@/app/(app)/learn/learn.module.css";
import { parseWordContent, type ParsedWord } from "@/lib/word-content";
import { X, Volume2 } from "lucide-react";
import { ttsUrl } from "@/lib/tts";

export function WordDetailModal({
  contentJson,
  headWord,
  accent,
  onClose,
}: {
  contentJson: string;
  headWord: string;
  accent?: string;
  onClose: () => void;
}) {
  const pref = accent ?? "us";
  const data = useMemo<ParsedWord>(() => parseWordContent(headWord, contentJson), [headWord, contentJson]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`${headWord} 详情`}>
        <div className={styles.modalInner}>
          <div className={styles.modalHead}>
            <div className={styles.modalTitleGroup}>
              <div className={styles.modalWord}>{data.headWord}</div>
              <div className={styles.modalPronRow}>
                {data.usphone && (
                  <button
                    className={styles.soundBtn}
                    aria-label="美音"
                    onClick={() => new Audio(ttsUrl(data.headWord, "us")).play().catch(() => {})}
                  >
                    <Volume2 size={13} />
                    <span className={styles.soundLabel}>美</span>
                    {data.usphone && <span className={styles.phonetic}>{data.usphone}</span>}
                  </button>
                )}
                {data.ukphone && (
                  <button
                    className={styles.soundBtn}
                    aria-label="英音"
                    onClick={() => new Audio(ttsUrl(data.headWord, "uk")).play().catch(() => {})}
                  >
                    <Volume2 size={13} />
                    <span className={styles.soundLabel}>英</span>
                    {data.ukphone && <span className={styles.phonetic}>{data.ukphone}</span>}
                  </button>
                )}
                {!data.usphone && !data.ukphone && (
                  <button
                    className={styles.soundBtn}
                    aria-label={pref === "uk" ? "英音" : "美音"}
                    onClick={() => new Audio(ttsUrl(data.headWord, pref as "us" | "uk")).play().catch(() => {})}
                  >
                    <Volume2 size={13} />
                    <span className={styles.soundLabel}>{pref === "uk" ? "英" : "美"}</span>
                  </button>
                )}
              </div>
            </div>
            <button className={styles.closeBtn} aria-label="关闭" onClick={onClose}>
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {data.trans.length > 0 && (
            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>释义</h4>
              <ul className={styles.transList}>
                {data.trans.map((t, i) => (
                  <li key={i} className={styles.transItem}>
                    <span className={styles.tranCn}>{t.tranCn}</span>
                    {t.tranOther && <span className={styles.tranOther}>{t.tranOther}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.phrases.length > 0 && (
            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>固定搭配</h4>
              <ul className={styles.phraseList}>
                {data.phrases.map((p, i) => (
                  <li key={i} className={styles.phraseItem}>
                    <span className={styles.phraseContent}>{p.pContent}</span>
                    {p.pCn && <span className={styles.phraseCn}>{p.pCn}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.sentences.length > 0 && (
            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>例句</h4>
              <ul className={styles.sentenceList}>
                {data.sentences.map((s, i) => (
                  <li key={i} className={styles.sentenceItem}>
                    <p className={styles.sentenceEn}>{s.sContent}</p>
                    {s.sCn && <p className={styles.sentenceCn}>{s.sCn}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(data.rels.length > 0 || data.synos.length > 0) && (
            <div className={styles.modalSection}>
              <h4 className={styles.sectionTitle}>相关词</h4>
              <div className={styles.relatedWords}>
                {[...data.rels, ...data.synos].map((r) => r.word).join("，")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
