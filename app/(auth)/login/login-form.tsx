"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { loginAction } from "./actions";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const username = String(fd.get("username") ?? "");
        const password = String(fd.get("password") ?? "");
        start(async () => {
          setError(null);
          const res = await loginAction({ username, password });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          router.replace("/dashboard");
          router.refresh();
        });
      }}
    >
      <label className={styles.label}>
        用户名
        <input className={styles.input} name="username" autoComplete="username" required />
      </label>
      <label className={styles.label}>
        密码
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {error && <div className={styles.error}>{error}</div>}
      <button className={styles.btn} type="submit" disabled={pending}>
        {pending ? "登录中…" : "登录"}
      </button>
    </form>
  );
}
