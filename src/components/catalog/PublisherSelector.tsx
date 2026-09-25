"use client";

import { useState, useTransition } from "react";
import { createPublisherAction, searchPublishersAction } from "@/app/(app)/biblioteca/nuevo/actions";
import { normalizeSearchQuery } from "@/lib/catalog/search";
import type { PublisherSummary } from "@/lib/catalog/types";
import styles from "./catalog-form.module.css";

export function PublisherSelector({ errors }: Readonly<{ errors?: readonly string[] }>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublisherSummary[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [selected, setSelected] = useState<PublisherSummary | null>(null);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  function search() { startTransition(async () => { const result = await searchPublishersAction(query); if (result.success) { setResults(result.data); setSearchedQuery(query); setMessage(""); } else setMessage(result.message); }); }
  function create() { startTransition(async () => { const result = await createPublisherAction({ name: query }); if (result.success) { setSelected(result.data); setCreating(false); setResults([]); setQuery(""); setMessage(""); } else setMessage(result.message); }); }
  const exact = results.some((item) => normalizeSearchQuery(item.name) === normalizeSearchQuery(query));
  const reviewed = normalizeSearchQuery(searchedQuery) === normalizeSearchQuery(query) && query.trim().length >= 2;

  return (
    <fieldset id="publisher-section" tabIndex={-1} className={`${styles.selector} ${styles.fullWidth}`} aria-describedby={errors?.length ? "publisher-error" : undefined}>
      <legend>Editorial <span>(opcional)</span></legend>
      {errors?.length ? <p id="publisher-error" className={styles.fieldError}>{errors.join(" ")}</p> : null}
      {selected ? <div className={styles.selectionLine}><span>{selected.name}</span><button type="button" onClick={() => setSelected(null)}>Quitar</button></div> : <><div className={styles.searchRow}><div className={styles.field}><label htmlFor="publisher-search">Buscar editorial</label><input id="publisher-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nombre de la editorial" /></div><button type="button" onClick={search} disabled={pending || query.trim().length < 2}>Buscar</button></div>{results.length > 0 ? <ul className={styles.options}>{results.map((item) => <li key={item.id}><span>{item.name}</span><button type="button" onClick={() => setSelected(item)}>Usar existente</button></li>)}</ul> : null}<button type="button" className={styles.textButton} onClick={() => setCreating((value) => !value)}>Crear editorial</button></>}
      {message ? <p className={styles.error}>{message}</p> : null}
      <input type="hidden" name="edition.publisherId" value={selected?.id ?? ""} />
      {creating && !selected ? <div className={styles.inlineForm}><p className={styles.help}>{exact ? "Hay una coincidencia exacta. Puedes usarla o crear de todos modos." : reviewed ? "No hay una coincidencia exacta en los resultados revisados." : "Busca este nombre primero para revisar coincidencias."}</p><div className={styles.field}><label htmlFor="new-publisher">Nombre</label><input id="new-publisher" required maxLength={200} value={query} onChange={(e) => setQuery(e.target.value)} /></div><button type="button" onClick={create} disabled={pending || !reviewed}>Crear de todos modos</button></div> : null}
    </fieldset>
  );
}
