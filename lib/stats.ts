import { prisma } from "@/lib/prisma";
import { loadBook, bookSize } from "@/lib/books";
import type { Status } from "@/lib/sm2";

export interface DashboardStats {
  totalLearned: number;
  todayLearned: number;
  todayReviewDue: number;
  statusCounts: Record<Status, number>;
  banks: Array<{
    bookId: string;
    name: string;
    total: number;
    learned: number;
    percent: number;
    sortRule: string;
  }>;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function loadDashboardStats(userId: string): Promise<DashboardStats> {
  const today0 = startOfToday();
  const today1 = endOfToday();

  const [totalLearned, todayLearned, todayReviewDue, byStatus, userBanks] = await Promise.all([
    prisma.userWordProgress.count({ where: { userId } }),
    prisma.userWordProgress.count({ where: { userId, createdAt: { gte: today0, lte: today1 } } }),
    prisma.userWordProgress.count({
      where: { userId, nextReviewDate: { lte: today1 } },
    }),
    prisma.userWordProgress.groupBy({ by: ["status"], where: { userId }, _count: { _all: true } }),
    prisma.userBank.findMany({ where: { userId } }),
  ]);

  const statusCounts: Record<Status, number> = {
    LEARNING: 0, FAMILIAR: 0, MASTERED: 0,
  };
  for (const row of byStatus) statusCounts[row.status as Status] = row._count._all;

  const learnedPerBook = new Map<string, number>();
  const progresses = await prisma.userWordProgress.findMany({
    where: { userId },
    select: { bookId: true },
  });
  for (const p of progresses) {
    learnedPerBook.set(p.bookId, (learnedPerBook.get(p.bookId) ?? 0) + 1);
  }

  const banks = userBanks.map((ub) => {
    const total = bookSize(ub.bookId);
    const learned = learnedPerBook.get(ub.bookId) ?? 0;
    return {
      bookId: ub.bookId,
      name: ub.bookId,
      total,
      learned,
      percent: total > 0 ? Math.round((learned / total) * 100) : 0,
      sortRule: ub.sortRule,
    };
  });

  return { totalLearned, todayLearned, todayReviewDue, statusCounts, banks };
}
