"use client";

import { useState } from "react";
import type { EditionFormInitialValues } from "@/lib/catalog/edition-form-values";
import { PublisherSelector } from "./PublisherSelector";
import styles from "./catalog-form.module.css";

type FieldErrors = Readonly<Record<string, string[]>>;

function FieldError({ errors, name }: Readonly<{ errors?: FieldErrors; name: string }>) {
  const messages = errors?.[name];
  return messages?.length ? <p id={`${name}-error`} className={styles.fieldError}>{messages.join(" ")}</p> : null;
}

type Props = Readonly<{
  fieldErrors?: FieldErrors;
  initialValues?: EditionFormInitialValues;
  hasStoredCover?: boolean;
}>;

export function EditionFormSection({ fieldErrors, initialValues, hasStoredCover = false }: Props) {
  const [format, setFormat] = useState(initialValues?.format ?? "PHYSICAL");
  const [precision, setPrecision] = useState(initialValues?.publicationDatePrecision ?? "");
  const dateType = precision === "YEAR" ? "number" : precision === "MONTH" ? "month" : "date";

  return (
    <fieldset className={styles.section}>
      <legend>Sobre esta edición</legend>
      <div className={styles.fieldGrid}>
        <div className={styles.field}>
          <label htmlFor="edition-format">Formato</label>
          <select id="edition-format" name="edition.format" required value={format} onChange={(event) => setFormat(event.target.value)} aria-invalid={Boolean(fieldErrors?.["edition.format"])} aria-describedby={fieldErrors?.["edition.format"] ? "edition.format-error" : undefined}>
            <option value="PHYSICAL">Físico</option><option value="EBOOK">Ebook</option><option value="AUDIOBOOK">Audiolibro</option>
          </select>
          <FieldError errors={fieldErrors} name="edition.format" />
        </div>
        <div className={styles.field}>
          <label htmlFor="edition-isbn">ISBN</label>
          <input id="edition-isbn" name="edition.isbn" maxLength={40} inputMode="numeric" defaultValue={initialValues?.isbn} aria-invalid={Boolean(fieldErrors?.["edition.isbn"])} aria-describedby={`isbn-help${fieldErrors?.["edition.isbn"] ? " edition.isbn-error" : ""}`} />
          <p id="isbn-help" className={styles.help}>Puedes escribirlo con espacios o guiones.</p>
          <FieldError errors={fieldErrors} name="edition.isbn" />
        </div>
        <PublisherSelector errors={fieldErrors?.["edition.publisherId"]} initialSelection={initialValues?.publisher} />
        <div className={styles.field}>
          <label htmlFor="date-precision">Precisión de la fecha</label>
          <select id="date-precision" name="edition.publicationDatePrecision" value={precision} onChange={(event) => setPrecision(event.target.value)} aria-invalid={Boolean(fieldErrors?.["edition.publicationDate"] || fieldErrors?.["edition.publicationDatePrecision"])} aria-describedby={fieldErrors?.["edition.publicationDate"] ? "edition.publicationDate-error" : fieldErrors?.["edition.publicationDatePrecision"] ? "edition.publicationDatePrecision-error" : undefined}>
            <option value="">Sin fecha</option><option value="YEAR">Año</option><option value="MONTH">Mes</option><option value="DAY">Día</option>
          </select>
          {!precision ? <FieldError errors={fieldErrors} name="edition.publicationDate" /> : null}
          <FieldError errors={fieldErrors} name="edition.publicationDatePrecision" />
        </div>
        {precision ? <div className={styles.field}><label htmlFor="publication-date">Fecha de publicación</label><input id="publication-date" name="edition.publicationDateInput" type={dateType} min={precision === "YEAR" ? "1" : undefined} max={precision === "YEAR" ? "9999" : undefined} required defaultValue={initialValues?.publicationDateInput} aria-invalid={Boolean(fieldErrors?.["edition.publicationDate"])} aria-describedby={fieldErrors?.["edition.publicationDate"] ? "edition.publicationDate-error" : undefined} /><FieldError errors={fieldErrors} name="edition.publicationDate" /></div> : null}
        <div className={styles.field}><label htmlFor="edition-language">Idioma</label><input id="edition-language" name="edition.languageCode" maxLength={35} defaultValue={initialValues?.languageCode} aria-invalid={Boolean(fieldErrors?.["edition.languageCode"])} aria-describedby={fieldErrors?.["edition.languageCode"] ? "edition.languageCode-error" : undefined} /><FieldError errors={fieldErrors} name="edition.languageCode" /></div>
        <div className={styles.field}><label htmlFor="page-count">Número de páginas{format === "AUDIOBOOK" ? " (opcional)" : ""}</label><input id="page-count" name="edition.pageCount" type="number" min={1} inputMode="numeric" defaultValue={initialValues?.pageCount} aria-invalid={Boolean(fieldErrors?.["edition.pageCount"])} aria-describedby={fieldErrors?.["edition.pageCount"] ? "edition.pageCount-error" : undefined} /><FieldError errors={fieldErrors} name="edition.pageCount" /></div>
        <div className={styles.field}><label htmlFor="audio-duration">Duración en minutos{format !== "AUDIOBOOK" ? " (opcional)" : ""}</label><input id="audio-duration" name="edition.audioDurationMinutes" type="number" min={1} inputMode="numeric" defaultValue={initialValues?.audioDurationMinutes} aria-invalid={Boolean(fieldErrors?.["edition.audioDurationMinutes"])} aria-describedby={fieldErrors?.["edition.audioDurationMinutes"] ? "edition.audioDurationMinutes-error" : undefined} /><FieldError errors={fieldErrors} name="edition.audioDurationMinutes" /></div>
      </div>
      <details className={styles.advanced}><summary>Más datos de la edición</summary><div className={styles.fieldGrid}>
        <div className={styles.field}><label htmlFor="edition-title">Título de edición</label><input id="edition-title" name="edition.editionTitle" maxLength={300} defaultValue={initialValues?.editionTitle} aria-invalid={Boolean(fieldErrors?.["edition.editionTitle"])} aria-describedby={fieldErrors?.["edition.editionTitle"] ? "edition.editionTitle-error" : undefined} /><FieldError errors={fieldErrors} name="edition.editionTitle" /></div>
        <div className={styles.field}><label htmlFor="edition-subtitle">Subtítulo</label><input id="edition-subtitle" name="edition.subtitle" maxLength={300} defaultValue={initialValues?.subtitle} aria-invalid={Boolean(fieldErrors?.["edition.subtitle"])} aria-describedby={fieldErrors?.["edition.subtitle"] ? "edition.subtitle-error" : undefined} /><FieldError errors={fieldErrors} name="edition.subtitle" /></div>
        <div className={`${styles.field} ${styles.fullWidth}`}><label htmlFor="cover-url">URL de portada</label><input id="cover-url" name="edition.coverUrl" type="url" defaultValue={initialValues?.coverUrl} aria-invalid={Boolean(fieldErrors?.["edition.coverUrl"])} aria-describedby={`${hasStoredCover ? "stored-cover-help" : ""}${fieldErrors?.["edition.coverUrl"] ? " edition.coverUrl-error" : ""}`.trim() || undefined} />{hasStoredCover ? <p id="stored-cover-help" className={styles.help}>Esta edición tiene una portada almacenada. Se conservará mientras no introduzcas una URL de portada nueva.</p> : null}<FieldError errors={fieldErrors} name="edition.coverUrl" /></div>
      </div></details>
    </fieldset>
  );
}
