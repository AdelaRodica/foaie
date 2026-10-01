import Link from "next/link";

import type { LibraryItem } from "@/lib/library/types";
import type { CurrentReadingState, ReadingProgressUnit } from "@/lib/reading/types";
import { ReadingStartForm } from "@/components/reading/ReadingStartForm";

import { LibraryEditionControl } from "./LibraryEditionControl";
import styles from "./LibraryBookCard.module.css";

const formatLabels: Readonly<Record<string, string>> = {
  PHYSICAL: "Libro físico",
  EBOOK: "Ebook",
  AUDIOBOOK: "Audiolibro",
};

const readingStateLabels = {
  PENDING: "Pendiente",
  READING: "Leyendo",
  FINISHED: "Leído",
  ABANDONED: "Abandonado",
} as const satisfies Readonly<Record<CurrentReadingState["kind"], string>>;

function formatReadingProgress(value: number, unit: ReadingProgressUnit) {
  switch (unit) {
    case "PAGES":
      return `${value} ${value === 1 ? "página" : "páginas"}`;
    case "PERCENT":
      return `${value} %`;
    case "MINUTES":
      return `${value} ${value === 1 ? "minuto" : "minutos"}`;
  }

  return unit satisfies never;
}

function renderReadingStartForm(
  userEditionId: string,
  state: CurrentReadingState,
) {
  switch (state.kind) {
    case "PENDING":
      return <ReadingStartForm userEditionId={userEditionId} mode="START" />;
    case "READING":
      return null;
    case "FINISHED":
    case "ABANDONED":
      return <ReadingStartForm userEditionId={userEditionId} mode="REREAD" />;
  }

  return state satisfies never;
}

export function LibraryBookCard({ item }: Readonly<{ item: LibraryItem }>) {
  const { edition } = item;
  const { work } = edition;
  const formatLabel = formatLabels[edition.format] ?? "Formato no especificado";
  const { currentReadingState } = item;

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
          <span className={styles.readingState}>
            {readingStateLabels[currentReadingState.kind]}
          </span>
          {currentReadingState.kind === "READING" ? (
            <span className={styles.progress}>
              {formatReadingProgress(
                currentReadingState.session.currentValue,
                currentReadingState.session.progressUnit,
              )}
            </span>
          ) : null}
        </span>
      </Link>

      {renderReadingStartForm(item.id, currentReadingState)}

      <LibraryEditionControl editionId={edition.id} isInMyLibrary />
    </article>
  );
}
