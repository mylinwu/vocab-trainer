import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) redirect("/login");
  return id;
}
