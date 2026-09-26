import type { WorkEditionDetails } from "@/lib/catalog/types";
import { formatAudioDuration, formatPublicationDate } from "@/lib/catalog/presentation";
import { ButtonLink } from "@/components/ui/ButtonLink";

import styles from "./catalog.module.css";

const formatLabels: Record<string, string> = {
  PHYSICAL: "Libro físico",
  EBOOK: "Ebook",
  AUDIOBOOK: "Audiolibro",
};

export function EditionCard({ edition, workId, canEdit = false }: Readonly<{
  edition: WorkEditionDetails;
  workId: string;
  canEdit?: boolean;
}>) {
  const date = formatPublicationDate(edition.publicationDate, edition.publicationDatePrecision);
  const facts = [
    edition.publisher?.name,
    date,
    edition.languageCode,
    edition.pageCount ? `${edition.pageCount} páginas` : null,
    edition.audioDurationMinutes ? formatAudioDuration(edition.audioDurationMinutes) : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <article className={styles.editionCard}>
      <div className={styles.cover}>
        {edition.coverUrl ? (
          // Arbitrary catalog URLs cannot be allowlisted safely in next/image yet.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={edition.coverUrl} alt={`Portada de ${edition.editionTitle ?? "la edición"}`} loading="lazy" referrerPolicy="no-referrer" />
        ) : <span aria-hidden="true">Foaie</span>}
      </div>
      <div className={styles.editionCopy}>
        <p className={styles.eyebrow}>{formatLabels[edition.format] ?? edition.format}</p>
        {edition.editionTitle ? <h3>{edition.editionTitle}</h3> : null}
        {edition.subtitle ? <p>{edition.subtitle}</p> : null}
        {facts.length > 0 ? <p className={styles.metadata}>{facts.join(" · ")}</p> : null}
        {edition.isbn13 || edition.isbn10 ? <p className={styles.isbn}>ISBN {edition.isbn13 ?? edition.isbn10}</p> : null}
        {canEdit ? <div className={styles.editionActions}><ButtonLink href={`/catalogo/${workId}/ediciones/${edition.id}/editar`} variant="secondary">Editar edición</ButtonLink></div> : null}
      </div>
    </article>
  );
}
