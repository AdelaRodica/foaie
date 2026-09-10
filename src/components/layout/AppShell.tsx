import type { ReactNode } from "react";

import { Brand } from "@/components/ui/Brand";
import { SkipLink } from "@/components/ui/SkipLink";

import { PrimaryNavigation } from "./PrimaryNavigation";
import styles from "./AppShell.module.css";

type AppShellProps = Readonly<{
  children: ReactNode;
}>;

export function AppShell({ children }: AppShellProps) {
  return (
    <>
      <SkipLink />
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <Brand />
          <PrimaryNavigation variant="desktop" />
        </aside>

        <div className={styles.viewport}>
          <header className={styles.mobileHeader}>
            <Brand />
          </header>
          <main id="main-content" tabIndex={-1} className={styles.main}>
            {children}
          </main>
          <PrimaryNavigation variant="mobile" />
        </div>
      </div>
    </>
  );
}
