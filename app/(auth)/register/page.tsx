import Link from "next/link";
import styles from "../auth.module.css";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <p className={styles.alt}>
        已有账号？<Link href="/login">去登录</Link>
      </p>
    </>
  );
}
