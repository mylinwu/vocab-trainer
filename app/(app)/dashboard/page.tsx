import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { loadDashboardStats } from "@/lib/stats";
import styles from "./dashboard.module.css";
import type { Status } from "@/lib/sm2";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const uid = await requireUserId();
  const stats = await loadDashboardStats(uid);
  const hasBanks = stats.banks.length > 0;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>今日</h1>
      <div className={styles.grid}>
        <Link className={styles.action} href={hasBanks ? "/learn" : "/banks"}>
          <span className={styles.actionLabel}>学习新词</span>
          <span className={styles.actionHint}>从启用的词库挑选未学过的单词</span>
        </Link>
        <Link className={`${styles.action} ${styles.actionAlt}`} href="/review">
          <span className={styles.actionLabel}>复习单词</span>
          <span className={styles.actionHint}>
            {stats.todayReviewDue > 0 ? `${stats.todayReviewDue} 个待复习` : "今日已无待复习"}
          </span>
        </Link>
      </div>

      <h2 className={styles.h2}>数据概览</h2>
      <div className={styles.metrics}>
        <Metric label="累计学习" value={stats.totalLearned} />
        <Metric label="今日已学" value={stats.todayLearned} />
        <Metric label="今日待复习" value={stats.todayReviewDue} />
      </div>

      <h2 className={styles.h2}>掌握分布</h2>
      <ul className={styles.statusList}>
        <StatusBar label="学习中" count={stats.statusCounts.LEARNING} status="LEARNING" />
        <StatusBar label="熟悉" count={stats.statusCounts.FAMILIAR} status="FAMILIAR" />
        <StatusBar label="已掌握" count={stats.statusCounts.MASTERED} status="MASTERED" />
      </ul>

      <h2 className={styles.h2}>词库进度</h2>
      {!hasBanks ? (
        <div className={styles.empty}>
          还没有启用任何词库，<Link href="/banks">前往词库管理</Link>。
        </div>
      ) : (
        <ul className={styles.bankList}>
          {stats.banks.map((b) => (
            <li key={b.bookId} className={styles.bankItem}>
              <div className={styles.bankHead}>
                <span className={styles.bankName}>{b.name}</span>
                <span className={styles.bankPercent}>{b.percent}%</span>
              </div>
              <div className={styles.barOuter}>
                <div className={styles.barInner} style={{ width: `${b.percent}%` }} />
              </div>
              <div className={styles.bankSub}>
                {b.learned} / {b.total} · 排序：{sortRuleLabel(b.sortRule)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricValue}>{value}</div>
      <div className={styles.metricLabel}>{label}</div>
    </div>
  );
}

function StatusBar({ label, count, status }: { label: string; count: number; status: Status }) {
  return (
    <li className={styles.statusItem}>
      <Link href={`/words?status=${status}`} className={styles.statusLink}>
        <span>{label}</span>
        <span className={styles.statusCount}>{count}</span>
      </Link>
    </li>
  );
}

function sortRuleLabel(r: string) {
  const labels: Record<string, string> = { rank: "顺序", alpha: "字母", length: "长度", random: "乱序" };
  return labels[r] ?? r;
}
