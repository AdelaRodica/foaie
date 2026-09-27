import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";

import styles from "./page.module.css";

export default function LibraryLoading() {
  return (
    <div className={styles.page} aria-busy="true">
      <PageHeader
        eyebrow="Tu colección"
        title="Biblioteca"
        description="Guarda aquí las ediciones que quieres conservar en tu Biblioteca personal."
        action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
      />

      <section className={styles.library} aria-labelledby="library-loading-title">
        <h2 id="library-loading-title">Tus libros</h2>
        <p className={styles.loadingStatus} role="status">Cargando tu Biblioteca…</p>
        <ul className={styles.grid} aria-hidden="true">
          {[0, 1, 2].map((item) => (
            <li className={styles.skeletonCard} key={item}>
              <span className={styles.skeletonCover} />
              <span className={styles.skeletonCopy}>
                <span className={styles.skeletonLine} />
                <span className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                <span className={styles.skeletonButton} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
