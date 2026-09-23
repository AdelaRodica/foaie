import { Surface } from "@/components/ui/Surface";
import type { WorkDetails } from "@/lib/catalog/types";

import { EditionCard } from "./EditionCard";
import styles from "./catalog.module.css";

export function CatalogWorkDetails({ details }: Readonly<{ details: WorkDetails }>) {
  const { work, authors, genres, series, editions } = details;

  return (
    <div className={styles.details}>
      <Surface className={styles.workOverview}>
        <div>
          <h2>Sobre la obra</h2>
          {work.originalTitle && work.originalTitle !== work.title ? <p><strong>Título original:</strong> {work.originalTitle}</p> : null}
          {work.originalPublicationYear ? <p><strong>Primera publicación:</strong> {work.originalPublicationYear}</p> : null}
          {work.originalLanguageCode ? <p><strong>Idioma original:</strong> {work.originalLanguageCode}</p> : null}
          {work.description ? <p className={styles.description}>{work.description}</p> : null}
        </div>

        <div className={styles.relationships}>
          {authors.length > 0 ? <section><h3>Autoría</h3><p>{authors.map((author) => author.name).join(", ")}</p></section> : null}
          {genres.length > 0 ? <section><h3>Géneros</h3><p>{genres.map((genre) => genre.isPrimary ? `${genre.name} (principal)` : genre.name).join(", ")}</p></section> : null}
          {series.length > 0 ? <section><h3>Series</h3><ul className={styles.compactList}>{series.map((item) => <li key={item.id}>{item.name}{item.position ? ` · ${item.position}` : item.positionLabel ? ` · ${item.positionLabel}` : ""}</li>)}</ul></section> : null}
        </div>
      </Surface>

      <section className={styles.editionsSection} aria-labelledby="editions-title">
        <div>
          <h2 id="editions-title">Ediciones</h2>
          <p className={styles.muted}>Formatos y publicaciones registradas en el catálogo de Foaie.</p>
        </div>
        {editions.length > 0 ? (
          <div className={styles.editionGrid}>{editions.map((edition) => <EditionCard key={edition.id} edition={edition} />)}</div>
        ) : <p className={styles.emptyInline}>Todavía no hay ediciones registradas para esta obra.</p>}
      </section>
    </div>
  );
}
