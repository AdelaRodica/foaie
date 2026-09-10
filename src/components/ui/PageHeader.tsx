import type { ReactNode } from "react";

import styles from "./PageHeader.module.css";

type PageHeaderProps = Readonly<{
  action?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}>;

export function PageHeader({ action, description, eyebrow, title }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.copy}>
        {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
        <h1>{title}</h1>
        <p className={styles.description}>{description}</p>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </header>
  );
}
