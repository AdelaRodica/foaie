import Link from "next/link";

import type { LibraryItem } from "@/lib/library/types";

import { LibraryEditionControl } from "./LibraryEditionControl";
import styles from "./LibraryBookCard.module.css";

const formatLabels: Readonly<Record<string, string>> = {
  PHYSICAL: "Libro físico",
  EBOOK: "Ebook",
  AUDIOBOOK: "Audiolibro",
};

export function LibraryBookCard({ item }: Readonly<{ item: LibraryItem }>) {
  const { edition } = item;
  const { work } = edition;
  const formatLabel = formatLabels[edition.format] ?? "Formato no especificado";

  return (
    <article className={styles.card}>
      <Link className={styles.link} href={`/catalogo/${work.id}`}>
        <span className={styles.cover}>
          {edition.coverSrc ? (
            // Arbitrary catalog URLs cannot be allowlisted safely in next/image yet.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={edition.coverSrc}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span aria-hidden="true">Foaie</span>
          )}
        </span>
        <span className={styles.copy}>
          <span className={styles.format}>{formatLabel}</span>
          <span className={styles.title}>{work.title}</span>
          {work.authors.length > 0 ? (
            <span className={styles.authors}>{work.authors.join(", ")}</span>
          ) : null}
        </span>
      </Link>

      <LibraryEditionControl editionId={edition.id} isInMyLibrary />
    </article>
  );
}
