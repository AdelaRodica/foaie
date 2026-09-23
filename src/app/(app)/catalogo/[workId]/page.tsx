import { CatalogWorkDetails } from "@/components/catalog/CatalogWorkDetails";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getWorkDetails } from "@/lib/catalog/server/queries";
import type { WorkDetails } from "@/lib/catalog/types";

import styles from "../../shared-page.module.css";

type CatalogWorkPageProps = Readonly<{ params: Promise<{ workId: string }> }>;

async function loadWorkDetails(workId: string): Promise<WorkDetails | null> {
  try {
    return await getWorkDetails(workId);
  } catch {
    return null;
  }
}

export default async function CatalogWorkPage({ params }: CatalogWorkPageProps) {
  const { workId } = await params;
  const details = await loadWorkDetails(workId);

  if (details) {
    return (
      <div className={styles.page}>
        <PageHeader
          eyebrow="Catálogo de Foaie"
          title={details.work.title}
          description="Consulta la obra y las ediciones registradas en el catálogo compartido."
          action={<ButtonLink href="/biblioteca/nuevo" variant="secondary">Volver a buscar</ButtonLink>}
        />
        <CatalogWorkDetails details={details} />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Catálogo de Foaie" title="No podemos mostrar esta obra" description="La ficha no existe o no está disponible en este momento." />
      <EmptyState title="Ficha no disponible" description="Vuelve a la búsqueda para encontrar otra obra." action={<ButtonLink href="/biblioteca/nuevo">Volver a buscar</ButtonLink>} />
    </div>
  );
}
