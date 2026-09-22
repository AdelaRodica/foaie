import type { ReactNode } from "react";

import { Brand } from "@/components/ui/Brand";

import styles from "./auth.module.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <Brand />
        </div>
        <section className={styles.card}>{children}</section>
      </div>
    </main>
  );
}
