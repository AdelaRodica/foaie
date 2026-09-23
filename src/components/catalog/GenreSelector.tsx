"use client";

import { useState } from "react";
import type { GenreOption } from "@/lib/catalog/types";
import styles from "./catalog-form.module.css";

export function GenreSelector({ genres }: Readonly<{ genres: GenreOption[] }>) {
  const [selected, setSelected] = useState<string[]>([]);
  const [primary, setPrimary] = useState("");
  function toggle(id: string, checked: boolean) {
    setSelected((items) => checked ? [...items, id] : items.filter((item) => item !== id));
    if (!checked && primary === id) setPrimary("");
  }
  if (genres.length === 0) return <fieldset className={styles.selector}><legend>Géneros <span>(opcional)</span></legend><p className={styles.help}>Todavía no hay géneros disponibles en el catálogo.</p></fieldset>;
  return <fieldset className={styles.selector}><legend>Géneros <span>(opcional)</span></legend><p className={styles.help}>Selecciona los que correspondan y, si quieres, marca uno como principal.</p><div className={styles.genreList}>{genres.map((genre) => <div className={styles.genreRow} key={genre.id}><label><input type="checkbox" checked={selected.includes(genre.id)} onChange={(e) => toggle(genre.id, e.target.checked)} /> {genre.name}</label><label><input type="radio" name="primaryGenre" checked={primary === genre.id} disabled={!selected.includes(genre.id)} onChange={() => setPrimary(genre.id)} /> Principal</label></div>)}</div><button type="button" className={styles.textButton} onClick={() => setPrimary("")} disabled={!primary}>Sin género principal</button><input type="hidden" name="genreRelations" value={JSON.stringify(selected.map((genreId) => ({ genreId, isPrimary: genreId === primary })))} /></fieldset>;
}
