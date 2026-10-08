import Link from "next/link";
import { redirect } from "next/navigation";

import { LibraryBookCard } from "@/components/library/LibraryBookCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LibraryError } from "@/lib/library/errors";
import {
  filterLibraryItemsByReadingState,
  parseLibraryReadingFilter,
  type LibraryReadingFilter,
} from "@/lib/library/filters";
import { listMyLibrary } from "@/lib/library/server/queries";
import type { LibraryItem } from "@/lib/library/types";

import styles from "./page.module.css";

async function loadLibrary(): Promise<LibraryItem[] | null> {
  try {
    return await listMyLibrary();
  } catch (error) {
    if (error instanceof LibraryError && error.kind === "unauthenticated") {
      redirect("/iniciar-sesion");
    }

    return null;
  }
}

type LibraryPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const readingFilters: readonly Readonly<{
  value: LibraryReadingFilter;
  label: string;
  href: string;
}>[] = [
  { value: "ALL", label: "Todos", href: "/biblioteca" },
  { value: "PENDING", label: "Pendientes", href: "/biblioteca?estado=pending" },
  { value: "READING", label: "Leyendo", href: "/biblioteca?estado=reading" },
  { value: "FINISHED", label: "Leídos", href: "/biblioteca?estado=finished" },
  { value: "ABANDONED", label: "Abandonados", href: "/biblioteca?estado=abandoned" },
];

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const items = await loadLibrary();
  const activeFilter = parseLibraryReadingFilter(params.estado);
  const filteredItems = items
    ? filterLibraryItemsByReadingState(items, activeFilter)
    : [];

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tu colección"
        title="Biblioteca"
        description="Guarda aquí las ediciones que quieres conservar en tu Biblioteca personal."
        action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
      />

      {items === null ? (
        <EmptyState
          title="No hemos podido cargar tu Biblioteca."
          description="Inténtalo de nuevo dentro de unos instantes."
          action={<ButtonLink href="/biblioteca">Volver a intentar</ButtonLink>}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Tu Biblioteca está esperando su primer libro"
          description="Añade una edición del catálogo para empezar a reunir tu Biblioteca personal."
          action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
        />
      ) : (
        <section className={styles.library} aria-labelledby="library-items-title">
          <h2 id="library-items-title">Tus libros</h2>
          <nav className={styles.filters} aria-label="Filtrar Biblioteca por estado de lectura">
            {readingFilters.map(({ value, label, href }) => (
              <Link
                key={value}
                className={styles.filterLink}
                href={href}
                aria-current={activeFilter === value ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          {filteredItems.length === 0 ? (
            <div className={styles.filteredEmpty}>
              <p>No tienes libros en este estado.</p>
              <Link href="/biblioteca">Ver todos</Link>
            </div>
          ) : (
            <ul className={styles.grid}>
              {filteredItems.map((item) => (
                <li key={item.id}>
                  <LibraryBookCard item={item} readingFilter={activeFilter} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
