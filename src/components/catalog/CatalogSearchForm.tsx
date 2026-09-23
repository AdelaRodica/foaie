import styles from "./catalog.module.css";

export function CatalogSearchForm({ defaultQuery }: Readonly<{ defaultQuery: string }>) {
  return (
    <form className={styles.searchForm} method="get" action="/biblioteca/nuevo">
      <label className={styles.label} htmlFor="catalog-query">Buscar por título, autor o ISBN</label>
      <div className={styles.searchControls}>
        <input
          className={styles.searchInput}
          id="catalog-query"
          name="q"
          type="search"
          defaultValue={defaultQuery}
          minLength={2}
          autoComplete="off"
          aria-describedby="catalog-query-hint"
        />
        <button className={styles.searchButton} type="submit">Buscar</button>
      </div>
      <p className={styles.hint} id="catalog-query-hint">
        Introduce al menos dos caracteres. Para ISBN puedes conservar espacios o guiones.
      </p>
    </form>
  );
}
