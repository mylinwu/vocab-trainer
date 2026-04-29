import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import styles from "./app.module.css";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const name = session.user.name ?? "user";

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.brand}>Vocab Trainer</Link>
        <nav className={styles.nav}>
          <Link href="/dashboard">仪表盘</Link>
          <Link href="/banks">词库</Link>
          <Link href="/settings">设置</Link>
        </nav>
        <div className={styles.user}>
          <span className={styles.userName}>{name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" className={styles.logout}>退出</button>
          </form>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
