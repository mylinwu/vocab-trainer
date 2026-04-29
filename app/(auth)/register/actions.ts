"use server";

import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { credentialsSchema } from "@/lib/validators";

export type RegisterResult = { ok: true } | { ok: false; error: string };

export async function registerAction(input: {
  username: string;
  password: string;
}): Promise<RegisterResult> {
  const parsed = credentialsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "输入无效" };
  }
  const { username, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) return { ok: false, error: "该用户名已被使用" };
  const passwordHash = await hash(password, 10);
  await prisma.user.create({ data: { username, passwordHash } });
  return { ok: true };
}
