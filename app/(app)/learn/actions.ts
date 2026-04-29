"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { applyKnownOnPick, applySm2, gradeFromReview } from "@/lib/sm2";

async function logEvent(userId: string, type: string, payload?: unknown) {
  try {
    await prisma.sessionEvent.create({
      data: { userId, type, payload: payload ? JSON.stringify(payload) : null },
    });
  } catch {
    // Non-fatal.
  }
}

export async function markKnown(bookId: string, wordRank: number, headWord: string) {
  const uid = await requireUserId();
  const r = applyKnownOnPick();
  await prisma.userWordProgress.upsert({
    where: { userId_bookId_wordRank: { userId: uid, bookId, wordRank } },
    create: {
      userId: uid,
      bookId,
      wordRank,
      headWord,
      status: r.status,
      interval: r.interval,
      easeFactor: r.easeFactor,
      repetitions: r.repetitions,
      nextReviewDate: r.nextReviewDate,
    },
    update: {
      headWord,
      status: r.status,
      interval: r.interval,
      easeFactor: r.easeFactor,
      repetitions: r.repetitions,
      nextReviewDate: r.nextReviewDate,
      reviewCount: { increment: 1 },
    },
  });
  await logEvent(uid, "word_known", { bookId, wordRank });
}

export async function submitReview(input: {
  bookId: string;
  wordRank: number;
  headWord: string;
  remembered: boolean;
  detailViewed: boolean;
}) {
  const uid = await requireUserId();
  const { bookId, wordRank, headWord, remembered, detailViewed } = input;
  const existing = await prisma.userWordProgress.findUnique({
    where: { userId_bookId_wordRank: { userId: uid, bookId, wordRank } },
  });
  const prev = existing
    ? { interval: existing.interval, easeFactor: existing.easeFactor, repetitions: existing.repetitions }
    : { interval: 0, easeFactor: 2.5, repetitions: 0 };
  const q = gradeFromReview(remembered, detailViewed);
  const r = applySm2(prev, q);
  await prisma.userWordProgress.upsert({
    where: { userId_bookId_wordRank: { userId: uid, bookId, wordRank } },
    create: {
      userId: uid,
      bookId,
      wordRank,
      headWord,
      status: r.status,
      interval: r.interval,
      easeFactor: r.easeFactor,
      repetitions: r.repetitions,
      nextReviewDate: r.nextReviewDate,
      detailViewed,
      lastReviewedAt: new Date(),
      reviewCount: 1,
    },
    update: {
      headWord,
      status: r.status,
      interval: r.interval,
      easeFactor: r.easeFactor,
      repetitions: r.repetitions,
      nextReviewDate: r.nextReviewDate,
      detailViewed,
      lastReviewedAt: new Date(),
      reviewCount: { increment: 1 },
    },
  });
  await logEvent(uid, remembered ? "review_remembered" : "review_forgotten", {
    bookId,
    wordRank,
    detailViewed,
  });
  revalidatePath("/dashboard");
}

export async function logDetailViewed(bookId: string, wordRank: number) {
  const uid = await requireUserId();
  await logEvent(uid, "detail_viewed", { bookId, wordRank });
}

export async function logSessionEvent(type: string, payload?: unknown) {
  const uid = await requireUserId();
  await logEvent(uid, type, payload);
}
