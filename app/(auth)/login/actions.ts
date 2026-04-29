"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginResult = { ok: true } | { ok: false; error: string };

export async function loginAction(input: {
  username: string;
  password: string;
}): Promise<LoginResult> {
  try {
    await signIn("credentials", { ...input, redirect: false });
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: "账号或密码错误" };
    throw e;
  }
}
