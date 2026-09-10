import Link from "next/link";

import styles from "./Brand.module.css";

export function Brand() {
  return (
    <Link href="/" className={styles.brand} aria-label="Foaie, ir a Inicio">
      {/* Wordmark provisional hasta incorporar el SVG oficial de la marca. */}
      <span className={styles.wordmark}>Foaie</span>
    </Link>
  );
}
