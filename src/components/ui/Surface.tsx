import type { ReactNode } from "react";

import styles from "./Surface.module.css";

type SurfaceProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

export function Surface({ children, className }: SurfaceProps) {
  return <section className={`${styles.surface} ${className ?? ""}`}>{children}</section>;
}
