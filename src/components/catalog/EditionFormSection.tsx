"use client";

import { useState } from "react";

import { PublisherSelector } from "./PublisherSelector";
import styles from "./catalog-form.module.css";

export function EditionFormSection() {
  const [format, setFormat] = useState("PHYSICAL");
  const [precision, setPrecision] = useState("");
  const dateType = precision === "YEAR" ? "number" : precision === "MONTH" ? "month" : "date";

  return (
    <fieldset className={styles.section}>
      <legend>Sobre esta edición</legend>
      <div className={styles.fieldGrid}>
        <div className={styles.field}><label htmlFor="edition-format">Formato</label><select id="edition-format" name="edition.format" required value={format} onChange={(event) => setFormat(event.target.value)}><option value="PHYSICAL">Físico</option><option value="EBOOK">Ebook</option><option value="AUDIOBOOK">Audiolibro</option></select></div>
        <div className={styles.field}><label htmlFor="edition-isbn">ISBN</label><input id="edition-isbn" name="edition.isbn" maxLength={40} inputMode="numeric" aria-describedby="isbn-help" /><p id="isbn-help" className={styles.help}>Puedes escribirlo con espacios o guiones.</p></div>
        <PublisherSelector />
        <div className={styles.field}><label htmlFor="date-precision">Precisión de la fecha</label><select id="date-precision" name="edition.publicationDatePrecision" value={precision} onChange={(event) => setPrecision(event.target.value)}><option value="">Sin fecha</option><option value="YEAR">Año</option><option value="MONTH">Mes</option><option value="DAY">Día</option></select></div>
        {precision ? <div className={styles.field}><label htmlFor="publication-date">Fecha de publicación</label><input id="publication-date" name="edition.publicationDateInput" type={dateType} min={precision === "YEAR" ? "1" : undefined} max={precision === "YEAR" ? "9999" : undefined} required /></div> : null}
        <div className={styles.field}><label htmlFor="edition-language">Idioma</label><input id="edition-language" name="edition.languageCode" maxLength={35} /></div>
        <div className={styles.field}><label htmlFor="page-count">Número de páginas{format === "AUDIOBOOK" ? " (opcional)" : ""}</label><input id="page-count" name="edition.pageCount" type="number" min={1} inputMode="numeric" /></div>
        <div className={styles.field}><label htmlFor="audio-duration">Duración en minutos{format !== "AUDIOBOOK" ? " (opcional)" : ""}</label><input id="audio-duration" name="edition.audioDurationMinutes" type="number" min={1} inputMode="numeric" /></div>
      </div>
      <details className={styles.advanced}><summary>Más datos de la edición</summary><div className={styles.fieldGrid}>
        <div className={styles.field}><label htmlFor="edition-title">Título de edición</label><input id="edition-title" name="edition.editionTitle" maxLength={300} /></div>
        <div className={styles.field}><label htmlFor="edition-subtitle">Subtítulo</label><input id="edition-subtitle" name="edition.subtitle" maxLength={300} /></div>
        <div className={`${styles.field} ${styles.fullWidth}`}><label htmlFor="cover-url">URL de portada</label><input id="cover-url" name="edition.coverUrl" type="url" /></div>
      </div></details>
    </fieldset>
  );
}
