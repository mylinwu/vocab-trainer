import styles from "./auth.module.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <div className={styles.card}>
        <h1 className={styles.brand}>Vocab Trainer</h1>
        <p className={styles.tagline}>专注、纯粹的单词学习工具</p>
        {children}
      </div>
    </div>
  );
}
