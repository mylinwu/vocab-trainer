import { prisma } from "./prisma";
import type { Accent } from "./tts";

export async function getAccent(userId: string): Promise<Accent> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { accent: true },
  });
  return (user?.accent as Accent) ?? "us";
}
