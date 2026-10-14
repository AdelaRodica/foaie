import { Surface } from "@/components/ui/Surface";

import styles from "./loading.module.css";

export default function HomeLoading() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Cargando Inicio">
      <header className={styles.header}>
        <span className={styles.shortLine} />
        <span className={styles.titleLine} />
        <span className={styles.longLine} />
      </header>
      <div className={styles.heroGrid}>
        <Surface className={styles.hero}>
          <span className={styles.shortLine} />
          <div className={styles.book}>
            <span className={styles.cover} />
            <span className={styles.copy}>
              <span className={styles.titleLine} />
              <span className={styles.longLine} />
              <span className={styles.longLine} />
            </span>
          </div>
        </Surface>
        <div className={styles.side}>
          <Surface className={styles.card}><span aria-hidden="true" /></Surface>
          <Surface className={styles.card}><span aria-hidden="true" /></Surface>
        </div>
      </div>
      <Surface className={styles.summary}><span aria-hidden="true" /></Surface>
    </div>
  );
}
