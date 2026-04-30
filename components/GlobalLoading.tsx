"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { LoaderCircle } from "lucide-react";
import styles from "./GlobalLoading.module.css";

type GlobalLoadingContextValue = {
  isLoading: boolean;
  showLoading: (message?: string) => () => void;
  withLoading: <T>(task: Promise<T> | (() => Promise<T>), message?: string) => Promise<T>;
};

const GlobalLoadingContext = createContext<GlobalLoadingContextValue | null>(null);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [message, setMessage] = useState("正在处理");

  const showLoading = useCallback((nextMessage = "正在处理") => {
    setMessage(nextMessage);
    setPendingCount((count) => count + 1);

    let closed = false;
    return () => {
      if (closed) return;
      closed = true;
      setPendingCount((count) => Math.max(0, count - 1));
    };
  }, []);

  const withLoading = useCallback(
    async <T,>(task: Promise<T> | (() => Promise<T>), nextMessage?: string) => {
      const hide = showLoading(nextMessage);
      try {
        return await (typeof task === "function" ? task() : task);
      } finally {
        hide();
      }
    },
    [showLoading],
  );

  const value = useMemo(
    () => ({
      isLoading: pendingCount > 0,
      showLoading,
      withLoading,
    }),
    [pendingCount, showLoading, withLoading],
  );

  return (
    <GlobalLoadingContext.Provider value={value}>
      {children}
      {pendingCount > 0 && (
        <div className={styles.backdrop} role="status" aria-live="polite" aria-label={message}>
          <div className={styles.indicator}>
            <LoaderCircle className={styles.icon} size={32} strokeWidth={1.75} aria-hidden="true" />
            <span className={styles.text}>{message}</span>
          </div>
        </div>
      )}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within GlobalLoadingProvider");
  }
  return context;
}
