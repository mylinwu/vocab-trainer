"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.eyebrow}>出了点小问题</div>
        <h1 className={styles.title}>页面暂时无法加载</h1>
        <p className={styles.desc}>
          请求超时或服务暂不可用，请稍后再试。如果问题仍然存在，可以返回首页或刷新页面。
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={() => unstable_retry()}>
            重试
          </button>
          <Link className={styles.secondary} href="/dashboard">
            返回首页
          </Link>
        </div>
        {error?.digest ? (
          <div className={styles.digest}>错误编号：{error.digest}</div>
        ) : null}
      </div>
    </div>
  );
}
