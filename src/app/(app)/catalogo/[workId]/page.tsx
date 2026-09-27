import { CatalogWorkDetails } from "@/components/catalog/CatalogWorkDetails";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getWorkDetailsForViewer } from "@/lib/catalog/server/queries";
import type { WorkDetailsForViewer } from "@/lib/catalog/types";
import { getMyLibraryMemberships } from "@/lib/library/server/queries";

import styles from "../../shared-page.module.css";
import catalogStyles from "@/components/catalog/catalog.module.css";

type CatalogWorkPageProps = Readonly<{
  params: Promise<{ workId: string }>;
  searchParams: Promise<{
    creado?: string | string[];
    actualizado?: string | string[];
    editar?: string | string[];
    edicionActualizada?: string | string[];
    editarEdicion?: string | string[];
    edicionEliminada?: string | string[];
  }>;
}>;

async function loadWorkDetails(workId: string): Promise<WorkDetailsForViewer | null> {
  try {
    return await getWorkDetailsForViewer(workId);
  } catch {
    return null;
  }
}

async function loadLibraryMemberships(editionIds: readonly string[]) {
  try {
    return await getMyLibraryMemberships(editionIds);
  } catch {
    return null;
  }
}

export default async function CatalogWorkPage({ params, searchParams }: CatalogWorkPageProps) {
  const { workId } = await params;
  const { creado, actualizado, editar, edicionActualizada, editarEdicion, edicionEliminada } = await searchParams;
  const viewer = await loadWorkDetails(workId);

  if (viewer) {
    const { details, capabilities } = viewer;
    const memberships = await loadLibraryMemberships(
      details.editions.map(({ id }) => id),
    );
    return (
      <div className={styles.page}>
        <PageHeader
          eyebrow="Catálogo de Foaie"
          title={details.work.title}
          description="Consulta la obra y las ediciones registradas en el catálogo compartido."
          action={(
            <div className={catalogStyles.headerActions}>
              {capabilities.canEditWork ? (
                <ButtonLink href={`/catalogo/${workId}/editar`}>Editar obra</ButtonLink>
              ) : null}
              <ButtonLink href="/biblioteca/nuevo" variant="secondary">Volver a buscar</ButtonLink>
            </div>
          )}
        />
        {creado === "1" ? (
          <div className={catalogStyles.successNotice} role="status">
            <strong>La obra y su edición se han guardado en el catálogo.</strong>
            <span>Ya puedes añadir la edición a tu Biblioteca desde esta ficha.</span>
          </div>
        ) : null}
        {actualizado === "1" ? (
          <div className={catalogStyles.successNotice} role="status">
            <strong>Los cambios de la obra se han guardado.</strong>
          </div>
        ) : null}
        {edicionActualizada === "1" ? (
          <div className={catalogStyles.successNotice} role="status">
            <strong>La edición se ha actualizado correctamente.</strong>
          </div>
        ) : null}
        {edicionEliminada === "1" ? (
          <div className={catalogStyles.successNotice} role="status">
            <strong>La edición se ha eliminado del catálogo.</strong>
          </div>
        ) : null}
        {editar === "no-permitido" ? (
          <div className={catalogStyles.accessNotice} role="status">
            <strong>Esta obra no está disponible para edición desde tu cuenta.</strong>
          </div>
        ) : null}
        {editarEdicion === "no-permitido" ? (
          <div className={catalogStyles.accessNotice} role="status">
            <strong>Esta edición no está disponible para edición desde tu cuenta.</strong>
          </div>
        ) : null}
        {memberships === null ? (
          <div className={catalogStyles.accessNotice} role="alert">
            <strong>No hemos podido consultar tu biblioteca en este momento.</strong>
          </div>
        ) : null}
        <CatalogWorkDetails
          details={details}
          editableEditionIds={details.editions
            .filter((edition) => capabilities.editions[edition.id]?.canEditEdition)
            .map((edition) => edition.id)}
          libraryEditionIds={memberships ? [...memberships] : null}
        />
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
