"use client";

import { useTransition } from "react";
import type { Accent } from "@/lib/tts";
import { updateAccent } from "./actions";
import styles from "./settings.module.css";

export function AccentSelector({ current }: { current: string }) {
  const [, start] = useTransition();

  function select(accent: Accent) {
    start(() => updateAccent(accent));
  }

  return (
    <div className={styles.accentGroup}>
      <button
        className={styles.accentBtn}
        data-active={current === "us"}
        onClick={() => select("us")}
      >
        <span className={styles.accentLabel}>美音</span>
        <span className={styles.accentHint}>American English</span>
      </button>
      <button
        className={styles.accentBtn}
        data-active={current === "uk"}
        onClick={() => select("uk")}
      >
        <span className={styles.accentLabel}>英音</span>
        <span className={styles.accentHint}>British English</span>
      </button>
    </div>
  );
}
