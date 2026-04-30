import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { statusFromInterval } from "@/lib/sm2";
import type { WordMetaStatus } from "@/lib/dev-tools";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;

  // 支持单个查询
  const bookId = searchParams.get("bookId");
  const wordRank = searchParams.get("wordRank");
  if (bookId && wordRank) {
    const progress = await prisma.userWordProgress.findUnique({
      where: { userId_bookId_wordRank: { userId, bookId, wordRank: parseInt(wordRank) } },
      select: {
        id: true,
        bookId: true,
        wordRank: true,
        headWord: true,
        status: true,
        interval: true,
        easeFactor: true,
        repetitions: true,
        nextReviewDate: true,
        detailViewed: true,
        reviewCount: true,
        lastReviewedAt: true,
        createdAt: true,
      },
    });
    if (!progress) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 });
    }
    return NextResponse.json({ ...progress, status: statusFromInterval(progress.interval) });
  }

  // 支持批量查询（?ids=bookId:wordRank,bookId:wordRank,...）
  const ids = searchParams.get("ids");
  if (ids) {
    const pairs = ids.split(",").map((s) => {
      const [b, r] = s.trim().split(":");
      return { bookId: b, wordRank: parseInt(r) };
    });

    const progresses = await prisma.userWordProgress.findMany({
      where: {
        userId,
        OR: pairs.map((p) => ({ bookId: p.bookId, wordRank: p.wordRank })),
      },
      select: {
        id: true,
        bookId: true,
        wordRank: true,
        headWord: true,
        status: true,
        interval: true,
        easeFactor: true,
        repetitions: true,
        nextReviewDate: true,
        detailViewed: true,
        reviewCount: true,
        lastReviewedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      progresses.map((p) => ({ ...p, status: statusFromInterval(p.interval) }))
    );
  }

  // 支持 listAll（?bookId=&status=&limit=）
  if (searchParams.has("bookId") || searchParams.has("status") || searchParams.has("limit")) {
    const listBookId = searchParams.get("bookId");
    const listStatus = searchParams.get("status") as WordMetaStatus | null;
    const listLimit = searchParams.get("limit");
    const where: Record<string, unknown> = { userId };
    if (listBookId) where.bookId = listBookId;
    if (listStatus) where.status = listStatus;
    const words = await prisma.userWordProgress.findMany({
      where,
      orderBy: [{ status: "asc" }, { nextReviewDate: "asc" }],
      take: listLimit ? parseInt(listLimit) : 100,
      select: {
        bookId: true,
        wordRank: true,
        headWord: true,
        status: true,
        interval: true,
      },
    });
    return NextResponse.json(
      words.map((w) => ({ ...w, status: statusFromInterval(w.interval) }))
    );
  }

  // 无过滤参数时，返回所有单词（完整字段）
  const all = await prisma.userWordProgress.findMany({
    where: { userId },
    orderBy: [{ bookId: "asc" }, { wordRank: "asc" }],
    take: 500,
    select: {
      id: true,
      bookId: true,
      wordRank: true,
      headWord: true,
      status: true,
      interval: true,
      easeFactor: true,
      repetitions: true,
      nextReviewDate: true,
      detailViewed: true,
      reviewCount: true,
      lastReviewedAt: true,
      createdAt: true,
    },
  });
  return NextResponse.json(
    all.map((w) => ({ ...w, status: statusFromInterval(w.interval) }))
  );
}
