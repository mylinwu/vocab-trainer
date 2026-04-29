"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import type { Accent } from "@/lib/tts";
import { revalidatePath } from "next/cache";

export async function updateAccent(accents: Accent) {
  const uid = await requireUserId();
  await prisma.user.update({
    where: { id: uid },
    data: { accent: accents },
  });
  revalidatePath("/settings");
}
