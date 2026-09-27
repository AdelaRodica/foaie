import { redirect } from "next/navigation";

import { LibraryBookCard } from "@/components/library/LibraryBookCard";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { LibraryError } from "@/lib/library/errors";
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

export default async function LibraryPage() {
  const items = await loadLibrary();

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
          <ul className={styles.grid}>
            {items.map((item) => (
              <li key={item.id}>
                <LibraryBookCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
