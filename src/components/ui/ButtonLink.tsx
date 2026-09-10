import Link from "next/link";
import type { ReactNode } from "react";

import styles from "./ButtonLink.module.css";

type ButtonLinkProps = Readonly<{
  children: ReactNode;
  href: string;
  variant?: "primary" | "secondary";
}>;

export function ButtonLink({ children, href, variant = "primary" }: ButtonLinkProps) {
  return (
    <Link href={href} className={`${styles.button} ${styles[variant]}`}>
      {children}
    </Link>
  );
}
