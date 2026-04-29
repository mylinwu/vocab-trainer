"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "../auth.module.css";
import { registerAction } from "./actions";
import { loginAction } from "../login/actions";

export function RegisterForm() {
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
          const res = await registerAction({ username, password });
          if (!res.ok) {
            setError(res.error);
            return;
          }
          const r = await loginAction({ username, password });
          if (!r.ok) {
            setError("注册成功，但自动登录失败，请手动登录");
            return;
          }
          router.replace("/dashboard");
          router.refresh();
        });
      }}
    >
      <label className={styles.label}>
        用户名 <span style={{ color: "var(--text-faint)" }}>（3-20 位字母数字下划线）</span>
        <input className={styles.input} name="username" autoComplete="username" required />
      </label>
      <label className={styles.label}>
        密码 <span style={{ color: "var(--text-faint)" }}>（≥6 位）</span>
        <input
          className={styles.input}
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </label>
      {error && <div className={styles.error}>{error}</div>}
      <button className={styles.btn} type="submit" disabled={pending}>
        {pending ? "注册中…" : "注册并登录"}
      </button>
    </form>
  );
}
