"use client";

import { useState } from "react";
import type { GenreOption, WorkGenreDetails } from "@/lib/catalog/types";
import styles from "./catalog-form.module.css";

export function GenreSelector({ genres, initialSelection = [], errors }: Readonly<{ genres: GenreOption[]; initialSelection?: WorkGenreDetails[]; errors?: readonly string[] }>) {
  const [selected, setSelected] = useState<string[]>(() => initialSelection.map(({ id }) => id));
  const [primary, setPrimary] = useState(() => initialSelection.find(({ isPrimary }) => isPrimary)?.id ?? "");
  function toggle(id: string, checked: boolean) {
    setSelected((items) => checked ? [...items, id] : items.filter((item) => item !== id));
    if (!checked && primary === id) setPrimary("");
  }
  if (genres.length === 0) return <fieldset id="genres-section" tabIndex={-1} className={styles.selector} aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? "genre-relations-error" : undefined}><legend>Géneros <span>(opcional)</span></legend><p className={styles.help}>Todavía no hay géneros disponibles en el catálogo.</p>{errors?.length ? <p id="genre-relations-error" className={styles.fieldError}>{errors.join(" ")}</p> : null}<input type="hidden" name="genreRelations" value="[]" /></fieldset>;
  return <fieldset id="genres-section" tabIndex={-1} className={styles.selector} aria-invalid={Boolean(errors?.length)} aria-describedby={errors?.length ? "genre-relations-error" : undefined}><legend>Géneros <span>(opcional)</span></legend><p className={styles.help}>Selecciona los que correspondan y, si quieres, marca uno como principal.</p>{errors?.length ? <p id="genre-relations-error" className={styles.fieldError}>{errors.join(" ")}</p> : null}<div className={styles.genreList}>{genres.map((genre) => <div className={styles.genreRow} key={genre.id}><label><input type="checkbox" checked={selected.includes(genre.id)} onChange={(e) => toggle(genre.id, e.target.checked)} /> {genre.name}</label><label><input type="radio" name="primaryGenre" checked={primary === genre.id} disabled={!selected.includes(genre.id)} onChange={() => setPrimary(genre.id)} /> Principal</label></div>)}</div><button type="button" className={styles.textButton} onClick={() => setPrimary("")} disabled={!primary}>Sin género principal</button><input type="hidden" name="genreRelations" value={JSON.stringify(selected.map((genreId) => ({ genreId, isPrimary: genreId === primary })))} /></fieldset>;
}
