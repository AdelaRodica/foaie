import Link from "next/link";

import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

import styles from "./page.module.css";

const states = [
  { key: "todos", label: "Todos", href: "/biblioteca" },
  { key: "leyendo", label: "Leyendo", href: "/biblioteca?estado=leyendo" },
  { key: "pendientes", label: "Pendientes", href: "/biblioteca?estado=pendientes" },
  { key: "leidos", label: "Leídos", href: "/biblioteca?estado=leidos" },
  { key: "abandonados", label: "Abandonados", href: "/biblioteca?estado=abandonados" },
] as const;

type LibraryPageProps = Readonly<{
  searchParams: Promise<{ estado?: string | string[] }>;
}>;

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const requestedState = Array.isArray(params.estado) ? params.estado[0] : params.estado;
  const activeState = states.some((state) => state.key === requestedState)
    ? requestedState
    : "todos";
  const activeLabel = states.find((state) => state.key === activeState)?.label ?? "Todos";
  const emptyTitle =
    activeState === "todos"
      ? "Tu Biblioteca está esperando su primer libro"
      : `Todavía no hay libros en ${activeLabel.toLowerCase()}`;

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Tu colección"
        title="Biblioteca"
        description="Aquí podrás consultar, organizar y decidir qué leer sin separar tus libros en destinos distintos."
        action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
      />

      <nav className={styles.filters} aria-label="Filtrar Biblioteca por estado">
        {states.map((state) => {
          const selected = state.key === activeState;
          return (
            <Link
              key={state.key}
              href={state.href}
              className={`${styles.filter} ${selected ? styles.selected : ""}`}
              aria-current={selected ? "page" : undefined}
            >
              {state.label}
            </Link>
          );
        })}
      </nav>

      <EmptyState
        title={emptyTitle}
        description="Cuando añadas libros, esta vista conservará el estado seleccionado y mostrará aquí el contenido correspondiente."
        action={<ButtonLink href="/biblioteca/nuevo">Añadir libro</ButtonLink>}
      />
    </div>
  );
}
