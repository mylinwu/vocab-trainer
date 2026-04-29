"use client";

import { useState, useTransition } from "react";
import styles from "./banks.module.css";
import { enableBank, disableBank } from "./actions";

interface Item {
  bookId: string;
  name: string;
  totalWords: number;
  enabled: boolean;
  sortRule: string;
}

export function BanksList({ items }: { items: Item[] }) {
  return (
    <ul className={styles.list}>
      {items.map((it) => (
        <Row key={it.bookId} item={it} />
      ))}
    </ul>
  );
}

function Row({ item }: { item: Item }) {
  const [pending, start] = useTransition();
  const [rule, setRule] = useState(item.sortRule);
  return (
    <li className={styles.item}>
      <div className={styles.head}>
        <div className={styles.name}>{item.name}</div>
        <div className={styles.meta}>{item.totalWords} 词</div>
      </div>
      <div className={styles.controls}>
        <select
          className={styles.select}
          value={rule}
          onChange={(e) => {
            const next = e.target.value;
            setRule(next);
            if (item.enabled) start(() => enableBank(item.bookId, next));
          }}
          disabled={pending}
        >
          <option value="rank">词频</option>
          <option value="alpha">字母</option>
          <option value="length">长度</option>
          <option value="random">乱序</option>
        </select>
        {item.enabled ? (
          <button
            className={`${styles.btn} ${styles.btnGhost}`}
            disabled={pending}
            onClick={() => start(() => disableBank(item.bookId))}
          >
            停用
          </button>
        ) : (
          <button
            className={styles.btn}
            disabled={pending}
            onClick={() => start(() => enableBank(item.bookId, rule))}
          >
            启用
          </button>
        )}
      </div>
    </li>
  );
}
