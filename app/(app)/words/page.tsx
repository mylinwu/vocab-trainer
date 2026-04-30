import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getAccent } from "@/lib/preferences";
import { loadBook } from "@/lib/books";
import { quickTranslation } from "@/lib/word-content";
import { WordsList } from "./words-list";
import type { Status } from "@/lib/sm2";
import styles from "./words.module.css";

export const dynamic = "force-dynamic";

const VALID_STATUSES: Status[] = ["LEARNING", "FAMILIAR", "MASTERED"];
const PAGE_SIZE = 50;

const STATUS_LABELS: Record<Status, string> = {
  LEARNING: "学习中",
  FAMILIAR: "熟悉",
  MASTERED: "已掌握",
};

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status as Status | undefined;
  return {
    title: status ? `${STATUS_LABELS[status]} — 词汇列表` : "词汇列表",
  };
}

export default async function WordsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const uid = await requireUserId();
  const [accent] = await Promise.all([getAccent(uid)]);

  const status = VALID_STATUSES.includes(params.status as Status)
    ? (params.status as Status)
    : null;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  if (!status) {
    redirect("/dashboard");
  }

  const [rawWords, total] = await Promise.all([
    prisma.userWordProgress.findMany({
      where: { userId: uid, status },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.userWordProgress.count({ where: { userId: uid, status } }),
  ]);

  const bookEntries = await Promise.all(
    [...new Set(rawWords.map((p) => p.bookId))].map((b) => loadBook(b as string)),
  );
  const bookMap = new Map(bookEntries.map((entries) => [entries[0]?.bookId ?? "", entries]));

  const words = rawWords.map((p) => {
    const entries = bookMap.get(p.bookId) ?? [];
    const entry = entries.find((e) => e.wordRank === p.wordRank);
    return {
      bookId: p.bookId,
      wordRank: p.wordRank,
      headWord: entry?.headWord ?? p.headWord,
      translation: entry ? quickTranslation(entry.contentJson) : "",
      contentJson: entry?.contentJson ?? "{}",
    };
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <Link href="/dashboard" className={styles.back}>
          ← 返回
        </Link>
        <h1 className={styles.title}>{STATUS_LABELS[status]}</h1>
        <span className={styles.total}>{total} 个单词</span>
      </div>

      {words.length === 0 ? (
        <div className={styles.empty}>
          <p>还没有这个阶段的单词。</p>
          <Link href="/dashboard" className={styles.btn}>返回仪表盘</Link>
        </div>
      ) : (
        <>
          <WordsList words={words} accent={accent} />
          {totalPages > 1 && (
            <div className={styles.pagination}>
              {page > 1 && (
                <Link href={`/words?status=${status}&page=${page - 1}`} className={styles.pageBtn}>
                  上一页
                </Link>
              )}
              <span className={styles.pageInfo}>{page} / {totalPages}</span>
              {page < totalPages && (
                <Link href={`/words?status=${status}&page=${page + 1}`} className={styles.pageBtn}>
                  下一页
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
