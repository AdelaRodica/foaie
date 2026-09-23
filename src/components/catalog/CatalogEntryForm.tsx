"use client";

import type { GenreOption } from "@/lib/catalog/types";

import { EditionFormSection } from "./EditionFormSection";
import { WorkFormSection } from "./WorkFormSection";
import styles from "./catalog-form.module.css";

export function CatalogEntryForm({ genres, initialTitle }: Readonly<{ genres: GenreOption[]; initialTitle: string }>) {
  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <p className={styles.intro}>Crea una obra y una edición en el catálogo compartido de Foaie. Todavía no se añadirá a tu Biblioteca.</p>
      <WorkFormSection genres={genres} initialTitle={initialTitle} />
      <EditionFormSection />
      <div className={styles.submitArea}>
        <button className={styles.primaryButton} type="submit" disabled>Guardar en el catálogo</button>
        <p className={styles.help}>El guardado completo se conectará en el siguiente paso.</p>
      </div>
    </form>
  );
}
