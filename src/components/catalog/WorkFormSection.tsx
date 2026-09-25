import type { GenreOption } from "@/lib/catalog/types";

import { AuthorSelector } from "./AuthorSelector";
import { GenreSelector } from "./GenreSelector";
import { SeriesSelector } from "./SeriesSelector";
import styles from "./catalog-form.module.css";

type FieldErrors = Readonly<Record<string, string[]>>;

function FieldError({ errors, name }: Readonly<{ errors?: FieldErrors; name: string }>) {
  const messages = errors?.[name];
  return messages?.length ? <p id={`${name}-error`} className={styles.fieldError}>{messages.join(" ")}</p> : null;
}

export function WorkFormSection({ genres, initialTitle, fieldErrors }: Readonly<{ genres: GenreOption[]; initialTitle: string; fieldErrors?: FieldErrors }>) {
  return (
    <fieldset className={styles.section}>
      <legend>Sobre la obra</legend>
      <div className={styles.field}>
        <label htmlFor="work-title">Título</label>
        <input id="work-title" name="work.title" required maxLength={300} defaultValue={initialTitle} aria-invalid={Boolean(fieldErrors?.["work.title"])} aria-describedby={fieldErrors?.["work.title"] ? "work.title-error" : undefined} />
        <FieldError errors={fieldErrors} name="work.title" />
      </div>
      <AuthorSelector errors={fieldErrors?.authorRelations} />
      <GenreSelector genres={genres} errors={fieldErrors?.genreRelations} />
      <SeriesSelector errors={fieldErrors?.seriesRelations} />
      <div className={styles.field}>
        <label htmlFor="original-year">Año de publicación original</label>
        <input id="original-year" name="work.originalPublicationYear" type="number" min={-5000} max={3000} inputMode="numeric" aria-invalid={Boolean(fieldErrors?.["work.originalPublicationYear"])} aria-describedby={fieldErrors?.["work.originalPublicationYear"] ? "work.originalPublicationYear-error" : undefined} />
        <FieldError errors={fieldErrors} name="work.originalPublicationYear" />
      </div>
      <details className={styles.advanced}>
        <summary>Más datos sobre la obra</summary>
        <div className={styles.fieldGrid}>
          <div className={styles.field}><label htmlFor="original-title">Título original</label><input id="original-title" name="work.originalTitle" maxLength={300} aria-invalid={Boolean(fieldErrors?.["work.originalTitle"])} aria-describedby={fieldErrors?.["work.originalTitle"] ? "work.originalTitle-error" : undefined} /><FieldError errors={fieldErrors} name="work.originalTitle" /></div>
          <div className={styles.field}><label htmlFor="original-language">Idioma original</label><input id="original-language" name="work.originalLanguageCode" maxLength={35} aria-invalid={Boolean(fieldErrors?.["work.originalLanguageCode"])} aria-describedby={fieldErrors?.["work.originalLanguageCode"] ? "work.originalLanguageCode-error" : undefined} /><FieldError errors={fieldErrors} name="work.originalLanguageCode" /></div>
          <div className={`${styles.field} ${styles.fullWidth}`}><label htmlFor="work-description">Descripción</label><textarea id="work-description" name="work.description" rows={5} aria-invalid={Boolean(fieldErrors?.["work.description"])} aria-describedby={fieldErrors?.["work.description"] ? "work.description-error" : undefined} /><FieldError errors={fieldErrors} name="work.description" /></div>
        </div>
      </details>
    </fieldset>
  );
}
