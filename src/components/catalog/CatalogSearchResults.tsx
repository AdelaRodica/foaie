import Link from "next/link";

import { Surface } from "@/components/ui/Surface";
import type {
  AuthorSummary,
  EditionSearchResult,
  WorkSummary,
} from "@/lib/catalog/types";

import styles from "./catalog.module.css";

function WorkList({ works }: Readonly<{ works: WorkSummary[] }>) {
  return (
    <ul className={styles.resultList}>
      {works.map((work) => (
        <li key={work.id}>
          <Link className={styles.resultLink} href={`/catalogo/${work.id}`}>
            <strong>{work.title}</strong>
            {work.originalTitle && work.originalTitle !== work.title ? <span>{work.originalTitle}</span> : null}
            <span className={styles.metadata}>
              {[work.originalPublicationYear, work.originalLanguageCode].filter(Boolean).join(" · ")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

type SearchResultsProps = Readonly<{
  authors: AuthorSummary[];
  authorWorks: WorkSummary[];
  isbn: EditionSearchResult | null;
  query: string;
  selectedAuthor: AuthorSummary | null;
  works: WorkSummary[];
}>;

export function CatalogSearchResults({ authors, authorWorks, isbn, query, selectedAuthor, works }: SearchResultsProps) {
  return (
    <div className={styles.results}>
      {isbn ? (
        <Surface className={styles.resultSection}>
          <h2>Coincidencia por ISBN</h2>
          <Link className={styles.isbnResult} href={`/catalogo/${isbn.workId}`}>
            {isbn.coverUrl ? (
              // Catalog covers may come from arbitrary external hosts; an allowlist does not exist yet.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Portada de ${isbn.workTitle}`}
                className={styles.searchCover}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={isbn.coverUrl}
              />
            ) : (
              <span className={styles.coverPlaceholder} aria-hidden="true" />
            )}
            <span>
              <strong>{isbn.workTitle}</strong>
              <span>{[isbn.format, isbn.publisher?.name, isbn.isbn13 ?? isbn.isbn10].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
        </Surface>
      ) : null}

      {works.length > 0 ? (
        <Surface className={styles.resultSection}>
          <h2>Obras</h2>
          <WorkList works={works} />
        </Surface>
      ) : null}

      {authors.length > 0 ? (
        <Surface className={styles.resultSection}>
          <h2>Autores encontrados</h2>
          <ul className={styles.authorList}>
            {authors.map((author) => (
              <li key={author.id}>
                <Link href={{ pathname: "/biblioteca/nuevo", query: { q: query, autor: author.id } }}>
                  Ver obras de {author.name}
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {selectedAuthor ? (
        <Surface className={styles.resultSection}>
          <h2>Obras de {selectedAuthor.name}</h2>
          {authorWorks.length > 0 ? <WorkList works={authorWorks} /> : <p className={styles.muted}>No hay obras relacionadas con este autor.</p>}
        </Surface>
      ) : null}
    </div>
  );
}
