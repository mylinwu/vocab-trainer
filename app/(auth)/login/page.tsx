import Link from "next/link";
import styles from "../auth.module.css";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <p className={styles.alt}>
        还没有账号？<Link href="/register">注册一个</Link>
      </p>
    </>
  );
}
