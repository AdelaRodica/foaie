import type { GenreOption } from "@/lib/catalog/types";

import { AuthorSelector } from "./AuthorSelector";
import { GenreSelector } from "./GenreSelector";
import { SeriesSelector } from "./SeriesSelector";
import styles from "./catalog-form.module.css";

export function WorkFormSection({ genres, initialTitle }: Readonly<{ genres: GenreOption[]; initialTitle: string }>) {
  return (
    <fieldset className={styles.section}>
      <legend>Sobre la obra</legend>
      <div className={styles.field}>
        <label htmlFor="work-title">Título</label>
        <input id="work-title" name="work.title" required maxLength={300} defaultValue={initialTitle} />
      </div>
      <AuthorSelector />
      <GenreSelector genres={genres} />
      <SeriesSelector />
      <div className={styles.field}>
        <label htmlFor="original-year">Año de publicación original</label>
        <input id="original-year" name="work.originalPublicationYear" type="number" min={-5000} max={3000} inputMode="numeric" />
      </div>
      <details className={styles.advanced}>
        <summary>Más datos sobre la obra</summary>
        <div className={styles.fieldGrid}>
          <div className={styles.field}><label htmlFor="original-title">Título original</label><input id="original-title" name="work.originalTitle" maxLength={300} /></div>
          <div className={styles.field}><label htmlFor="original-language">Idioma original</label><input id="original-language" name="work.originalLanguageCode" maxLength={35} /></div>
          <div className={`${styles.field} ${styles.fullWidth}`}><label htmlFor="work-description">Descripción</label><textarea id="work-description" name="work.description" rows={5} /></div>
        </div>
      </details>
    </fieldset>
  );
}
