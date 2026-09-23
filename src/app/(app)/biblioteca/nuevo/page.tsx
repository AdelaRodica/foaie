import { CatalogSearchForm } from "@/components/catalog/CatalogSearchForm";
import { CatalogSearchResults } from "@/components/catalog/CatalogSearchResults";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Surface } from "@/components/ui/Surface";
import { normalizeSearchQuery } from "@/lib/catalog/search";
import {
  findEditionByIsbn,
  getAuthorById,
  getWorksByAuthorId,
  searchAuthors,
  searchWorks,
} from "@/lib/catalog/server/queries";
import type {
  AuthorSummary,
  EditionSearchResult,
  WorkSummary,
} from "@/lib/catalog/types";

import styles from "../../shared-page.module.css";

type NewBookPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function NewBookPage({ searchParams }: NewBookPageProps) {
  const params = await searchParams;
  const rawQuery = firstValue(params.q);
  const query = normalizeSearchQuery(rawQuery);
  const authorId = firstValue(params.autor);
  const shouldSearch = query.length >= 2;

  let hasError = false;
  let works: WorkSummary[] = [];
  let authors: AuthorSummary[] = [];
  let isbn: EditionSearchResult | null = null;
  let selectedAuthor: AuthorSummary | null = null;
  let authorWorks: WorkSummary[] = [];

  if (shouldSearch) {
    try {
      [works, authors, isbn] = await Promise.all([
        searchWorks({ query }),
        searchAuthors({ query }),
        findEditionByIsbn(query),
      ]);

      if (authorId) {
        [selectedAuthor, authorWorks] = await Promise.all([
          getAuthorById(authorId),
          getWorksByAuthorId(authorId),
        ]);
      }
    } catch {
      hasError = true;
    }
  }

  const hasResults = works.length > 0 || authors.length > 0 || isbn !== null || selectedAuthor !== null;

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Biblioteca"
        title="Añadir libro"
        description="Busca primero en el catálogo de Foaie. Si el libro ya existe, podrás revisar sus ediciones antes de crear una entrada nueva."
      />
      <Surface><CatalogSearchForm defaultQuery={rawQuery} /></Surface>

      {!rawQuery ? <EmptyState title="Busca en el catálogo" description="Puedes buscar por título, autor o ISBN para comprobar si el libro ya está registrado." /> : null}
      {rawQuery && !shouldSearch ? <EmptyState title="Escribe un poco más" description="La búsqueda necesita al menos dos caracteres." /> : null}
      {hasError ? <EmptyState title="No hemos podido buscar ahora" description="Inténtalo de nuevo. Tu consulta permanece en el campo de búsqueda." /> : null}
      {shouldSearch && !hasError && hasResults ? <CatalogSearchResults authors={authors} authorWorks={authorWorks} isbn={isbn} query={query} selectedAuthor={selectedAuthor} works={works} /> : null}
      {shouldSearch && !hasError && !hasResults ? (
        <EmptyState
          title="No encontramos coincidencias"
          description="Crear una nueva entrada estará disponible en el siguiente paso de esta etapa."
        />
      ) : null}
    </div>
  );
}
