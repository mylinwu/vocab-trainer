import Link from "next/link";
import { requireUserId } from "@/lib/session";
import { pickReviewQueue } from "@/lib/scheduler";
import { getAccent } from "@/lib/preferences";
import { ReviewFlow } from "./review-flow";
import styles from "./review.module.css";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const uid = await requireUserId();
  const [queue, accent] = await Promise.all([pickReviewQueue(uid), getAccent(uid)]);
  if (queue.length === 0) {
    return (
      <div className={styles.empty}>
        <h1 className={styles.title}>今天没有待复习的单词</h1>
        <p>给自己鼓个掌，或者去学几个新词。</p>
        <Link className={styles.btn} href="/learn">学习新词</Link>
      </div>
    );
  }
  return <ReviewFlow words={queue} accent={accent} />;
}
