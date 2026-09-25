"use client";

import { useState, useTransition } from "react";
import { createSeriesAction, searchSeriesAction } from "@/app/(app)/biblioteca/nuevo/actions";
import { normalizeSearchQuery } from "@/lib/catalog/search";
import type { SeriesSummary } from "@/lib/catalog/types";
import styles from "./catalog-form.module.css";

type SelectedSeries = SeriesSummary & { position: string; positionLabel: string };

export function SeriesSelector({ errors }: Readonly<{ errors?: readonly string[] }>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SeriesSummary[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [selected, setSelected] = useState<SelectedSeries[]>([]);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [pending, startTransition] = useTransition();

  function search() { startTransition(async () => { const result = await searchSeriesAction(query); if (result.success) { setResults(result.data); setSearchedQuery(query); setMessage(""); } else setMessage(result.message); }); }
  function add(item: SeriesSummary) { setSelected((items) => items.some(({ id }) => id === item.id) ? items : [...items, { ...item, position: "", positionLabel: "" }]); }
  function create() { startTransition(async () => { const result = await createSeriesAction({ name: query, description: newDescription.trim() || null }); if (result.success) { add(result.data); setCreating(false); setQuery(""); setNewDescription(""); setResults([]); setMessage(""); } else setMessage(result.message); }); }
  function update(id: string, field: "position" | "positionLabel", value: string) { setSelected((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item)); }
  const exact = results.some((item) => normalizeSearchQuery(item.name) === normalizeSearchQuery(query));
  const reviewed = normalizeSearchQuery(searchedQuery) === normalizeSearchQuery(query) && query.trim().length >= 2;

  return (
    <fieldset id="series-section" tabIndex={-1} className={styles.selector} aria-describedby={errors?.length ? "series-relations-error" : undefined}>
      <legend>Series o sagas <span>(opcional)</span></legend>
      {errors?.length ? <p id="series-relations-error" className={styles.fieldError}>{errors.join(" ")}</p> : null}
      <div className={styles.searchRow}><div className={styles.field}><label htmlFor="series-search">Buscar serie</label><input id="series-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre de la serie" /></div><button type="button" onClick={search} disabled={pending || query.trim().length < 2}>Buscar</button></div>
      {message ? <p className={styles.error}>{message}</p> : null}
      {results.length > 0 ? <ul className={styles.options}>{results.map((item) => <li key={item.id}><span>{item.name}</span><button type="button" onClick={() => add(item)} disabled={selected.some(({ id }) => id === item.id)}>Usar existente</button></li>)}</ul> : null}
      {selected.length > 0 ? <ul className={styles.selected}>{selected.map((item) => <li key={item.id} className={styles.seriesItem}><strong>{item.name}</strong><div className={styles.fieldGrid}><div className={styles.field}><label htmlFor={`series-number-${item.id}`}>Número dentro de la saga</label><input id={`series-number-${item.id}`} type="number" min="0.001" max="99999.999" step="0.001" value={item.position} onChange={(e) => update(item.id, "position", e.target.value)} /></div><div className={styles.field}><label htmlFor={`series-label-${item.id}`}>Etiqueta opcional</label><input id={`series-label-${item.id}`} maxLength={60} placeholder="Precuela" value={item.positionLabel} onChange={(e) => update(item.id, "positionLabel", e.target.value)} /></div></div><button type="button" onClick={() => setSelected((items) => items.filter(({ id }) => id !== item.id))}>Quitar</button></li>)}</ul> : null}
      <input type="hidden" name="seriesRelations" value={JSON.stringify(selected.map(({ id, position, positionLabel }) => ({ seriesId: id, position: position || null, positionLabel: positionLabel.trim() || null })))} />
      <button type="button" className={styles.textButton} onClick={() => setCreating((value) => !value)}>Crear serie</button>
      {creating ? <div className={styles.inlineForm}><p className={styles.help}>{exact ? "Hay una coincidencia exacta. Puedes usarla o crear de todos modos." : reviewed ? "No hay una coincidencia exacta en los resultados revisados." : "Busca este nombre primero para revisar coincidencias."}</p><div className={styles.field}><label htmlFor="new-series-name">Nombre</label><input id="new-series-name" required maxLength={250} value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className={styles.field}><label htmlFor="new-series-description">Descripción (opcional)</label><textarea id="new-series-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={3} /></div><button type="button" onClick={create} disabled={pending || !reviewed}>Crear de todos modos</button></div> : null}
    </fieldset>
  );
}
