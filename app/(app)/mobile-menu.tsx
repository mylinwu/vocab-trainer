"use client";

import Link from "next/link";
import { useState } from "react";
import { createPortal } from "react-dom";
import { Menu } from "lucide-react";
import styles from "./app.module.css";

type MobileMenuProps = {
  name: string;
  logoutAction: () => Promise<void>;
};

export function MobileMenu({ name, logoutAction }: MobileMenuProps) {
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  return (
    <>
      <div className={styles.mobileMenu}>
        <button
          type="button"
          className={styles.menuButton}
          aria-label={open ? "关闭菜单" : "打开菜单"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <Menu size={20} strokeWidth={2} />
        </button>
      </div>
      {open
        ? createPortal(
            <div className={styles.menuLayer}>
              <div
                className={styles.menuOverlay}
                aria-hidden="true"
                onClick={closeMenu}
              />
              <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="导航菜单">
                <div className={styles.drawerUser}>
                  <span>当前用户</span>
                  <strong>{name}</strong>
                </div>
                <nav className={styles.drawerNav}>
                  <Link href="/dashboard" onClick={closeMenu}>仪表盘</Link>
                  <Link href="/banks" onClick={closeMenu}>词库</Link>
                  <Link href="/settings" onClick={closeMenu}>设置</Link>
                </nav>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={styles.drawerLogout}
                    onClick={closeMenu}
                  >
                    退出登录
                  </button>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
