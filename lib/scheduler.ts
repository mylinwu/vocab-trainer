import { prisma } from "@/lib/prisma";
import { loadBook, type BookEntry } from "@/lib/books";
import { quickTranslation } from "@/lib/word-content";

export interface PickedWord {
  bookId: string;
  wordRank: number;
  headWord: string;
  translation: string;
  contentJson: string;
}

const PICK_LIMIT = 30;

export async function pickNewWords(userId: string, limit = PICK_LIMIT): Promise<PickedWord[]> {
  const userBanks = await prisma.userBank.findMany({ where: { userId } });
  if (userBanks.length === 0) return [];

  const learnedSet = new Set(
    (await prisma.userWordProgress.findMany({ where: { userId }, select: { bookId: true, wordRank: true } }))
      .map((p) => `${p.bookId}::${p.wordRank}`),
  );

  const perBank = Math.max(8, Math.ceil(limit / userBanks.length) * 2);
  const candidates: PickedWord[] = [];

  for (const ub of userBanks) {
    const entries = loadBook(ub.bookId);
    const unseen = entries.filter((e) => !learnedSet.has(`${e.bookId}::${e.wordRank}`));
    let chosen = unseen;
    if (ub.sortRule === "random") chosen = shuffle(unseen);
    else if (ub.sortRule === "alpha") chosen = [...unseen].sort((a, b) => a.headWord.localeCompare(b.headWord));
    else if (ub.sortRule === "length") chosen = [...unseen].sort((a, b) => a.headWord.length - b.headWord.length);
    // default "rank" keeps original order

    for (const e of chosen.slice(0, perBank)) {
      candidates.push({
        bookId: e.bookId,
        wordRank: e.wordRank,
        headWord: e.headWord,
        translation: quickTranslation(e.contentJson),
        contentJson: e.contentJson,
      });
    }
  }

  return candidates.slice(0, limit);
}

export async function pickReviewQueue(userId: string, limit = 100): Promise<PickedWord[]> {
  const now = new Date();
  const items = await prisma.userWordProgress.findMany({
    where: {
      userId,
      nextReviewDate: { lte: now },
      status: { in: ["LEARNING", "FAMILIAR", "MASTERED"] },
    },
    orderBy: [{ status: "asc" }, { nextReviewDate: "asc" }],
    take: limit,
  });

  return items.map((p) => {
    const entry = loadBook(p.bookId).find((e) => e.wordRank === p.wordRank);
    return {
      bookId: p.bookId,
      wordRank: p.wordRank,
      headWord: entry?.headWord ?? p.headWord,
      translation: entry ? quickTranslation(entry.contentJson) : "",
      contentJson: entry?.contentJson ?? "{}",
    };
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
