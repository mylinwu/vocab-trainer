import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AccentSelector } from "./accent-selector";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const uid = await requireUserId();
  const user = await prisma.user.findUnique({
    where: { id: uid },
    select: { accent: true },
  });

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>设置</h1>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>发音偏好</p>
        <div className={styles.card}>
          <AccentSelector current={user?.accent ?? "us"} />
          <p className={styles.hint}>
            此设置会影响学习与复习流程中所有单词的发音。
          </p>
        </div>
      </div>
    </div>
  );
}
