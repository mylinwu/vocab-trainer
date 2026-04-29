import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { pickNewWords } from "@/lib/scheduler";
import { getAccent } from "@/lib/preferences";
import { LearnFlow } from "./learn-flow";
import styles from "./learn.module.css";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const uid = await requireUserId();
  const [words, accent] = await Promise.all([pickNewWords(uid), getAccent(uid)]);
  if (words.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>没有新词可学</h1>
        <p>请先 <Link href="/banks">启用一个词库</Link>，或者你已经学完了所有单词。</p>
        <Link className={styles.btn} href="/dashboard">返回仪表盘</Link>
      </div>
    );
  }
  return <LearnFlow words={words} accent={accent} />;
}
