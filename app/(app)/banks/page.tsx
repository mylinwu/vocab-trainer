import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scanBooks, bookSize } from "@/lib/books";
import { BanksList } from "./banks-list";
import styles from "./banks.module.css";

export const dynamic = "force-dynamic";

export default async function BanksPage() {
  const uid = await requireUserId();
  const [bookIds, userBanks] = await Promise.all([
    Promise.resolve(scanBooks()),
    prisma.userBank.findMany({ where: { userId: uid } }),
  ]);
  const enabled = new Map(userBanks.map((u) => [u.bookId, u]));
  const items = bookIds.map((bookId) => ({
    bookId,
    name: bookId,
    totalWords: bookSize(bookId),
    enabled: enabled.has(bookId),
    sortRule: enabled.get(bookId)?.sortRule ?? "rank",
  }));

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>词库</h1>
      {items.length === 0 ? (
        <div className={styles.empty}>
          还没有任何词库。将 JSON 文件放入 <code>public/books/</code> 即可自动识别。
        </div>
      ) : (
        <BanksList items={items} />
      )}
    </div>
  );
}
