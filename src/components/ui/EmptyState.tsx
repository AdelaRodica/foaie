import type { ReactNode } from "react";

import { Surface } from "./Surface";
import styles from "./EmptyState.module.css";

type EmptyStateProps = Readonly<{
  action?: ReactNode;
  description: string;
  title: string;
}>;

export function EmptyState({ action, description, title }: EmptyStateProps) {
  return (
    <Surface className={styles.emptyState}>
      <span className={styles.decoration} aria-hidden="true" />
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </Surface>
  );
}
