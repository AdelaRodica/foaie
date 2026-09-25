"use client";

import { useState, useTransition } from "react";

import { createAuthorAction, searchAuthorsAction } from "@/app/(app)/biblioteca/nuevo/actions";
import { normalizeSearchQuery } from "@/lib/catalog/search";
import type { AuthorSummary } from "@/lib/catalog/types";

import styles from "./catalog-form.module.css";

export function AuthorSelector({ errors }: Readonly<{ errors?: readonly string[] }>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuthorSummary[]>([]);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [selected, setSelected] = useState<AuthorSummary[]>([]);
  const [message, setMessage] = useState("");
  const [creating, setCreating] = useState(false);
  const [sortName, setSortName] = useState("");
  const [pending, startTransition] = useTransition();

  function search() {
    startTransition(async () => {
      const result = await searchAuthorsAction(query);
      if (result.success) { setResults(result.data); setSearchedQuery(query); setMessage(""); } else setMessage(result.message);
    });
  }

  function add(author: AuthorSummary) {
    setSelected((current) => current.some(({ id }) => id === author.id) ? current : [...current, author]);
  }

  function move(index: number, offset: number) {
    setSelected((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function create() {
    startTransition(async () => {
      const result = await createAuthorAction({ name: query, sortName: sortName.trim() || null });
      if (result.success) { add(result.data); setCreating(false); setQuery(""); setSortName(""); setResults([]); setMessage(""); } else setMessage(result.message);
    });
  }

  const exactMatch = results.some((author) => normalizeSearchQuery(author.name) === normalizeSearchQuery(query));
  const reviewedMatches = normalizeSearchQuery(searchedQuery) === normalizeSearchQuery(query) && query.trim().length >= 2;

  return (
    <fieldset id="authors-section" tabIndex={-1} className={styles.selector} aria-describedby={errors?.length ? "author-relations-error" : undefined}>
      <legend>Autores <span>(recomendado)</span></legend>
      <p className={styles.help}>Añade un autor si lo conoces. También puedes completar este dato más adelante.</p>
      {errors?.length ? <p id="author-relations-error" className={styles.fieldError}>{errors.join(" ")}</p> : null}
      <div className={styles.searchRow}><div className={styles.field}><label htmlFor="author-search">Buscar autores</label><input id="author-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del autor" /></div><button type="button" onClick={search} disabled={pending || query.trim().length < 2}>Buscar</button></div>
      {message ? <p className={styles.error}>{message}</p> : null}
      {results.length > 0 ? <ul className={styles.options}>{results.map((author) => <li key={author.id}><span>{author.name}</span><button type="button" onClick={() => add(author)} disabled={selected.some(({ id }) => id === author.id)}>Usar existente</button></li>)}</ul> : null}
      {selected.length > 0 ? <ol className={styles.selected}>{selected.map((author, index) => <li key={author.id}><span>{index + 1}. {author.name}</span><span className={styles.buttonGroup}><button type="button" onClick={() => move(index, -1)} disabled={index === 0}>Subir</button><button type="button" onClick={() => move(index, 1)} disabled={index === selected.length - 1}>Bajar</button><button type="button" onClick={() => setSelected((items) => items.filter(({ id }) => id !== author.id))}>Quitar</button></span></li>)}</ol> : null}
      <input type="hidden" name="authorRelations" value={JSON.stringify(selected.map((author, index) => ({ authorId: author.id, position: index + 1 })))} />
      <button type="button" className={styles.textButton} onClick={() => setCreating((value) => !value)}>Crear autora o autor</button>
      {creating ? <div className={styles.inlineForm}><p className={styles.help}>{exactMatch ? "Hay una coincidencia exacta. Puedes usarla o crear de todos modos si es otra persona." : reviewedMatches ? "No hay una coincidencia exacta en los resultados revisados." : "Busca este nombre primero para revisar coincidencias."}</p><div className={styles.field}><label htmlFor="new-author-name">Nombre</label><input id="new-author-name" required maxLength={200} value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className={styles.field}><label htmlFor="new-author-sort">Nombre de ordenación (opcional)</label><input id="new-author-sort" maxLength={200} value={sortName} onChange={(e) => setSortName(e.target.value)} /></div><button type="button" onClick={create} disabled={pending || !reviewedMatches}>Crear de todos modos</button></div> : null}
    </fieldset>
  );
}
