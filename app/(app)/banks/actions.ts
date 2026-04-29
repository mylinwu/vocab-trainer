"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const ALLOWED = new Set(["rank", "alpha", "length", "random"]);

export async function enableBank(bookId: string, sortRule: string) {
  const uid = await requireUserId();
  const rule = ALLOWED.has(sortRule) ? sortRule : "rank";
  await prisma.userBank.upsert({
    where: { userId_bookId: { userId: uid, bookId } },
    create: { userId: uid, bookId, sortRule: rule },
    update: { sortRule: rule },
  });
  revalidatePath("/banks");
  revalidatePath("/dashboard");
}

export async function disableBank(bookId: string) {
  const uid = await requireUserId();
  await prisma.userBank
    .delete({ where: { userId_bookId: { userId: uid, bookId } } })
    .catch(() => null);
  revalidatePath("/banks");
  revalidatePath("/dashboard");
}
