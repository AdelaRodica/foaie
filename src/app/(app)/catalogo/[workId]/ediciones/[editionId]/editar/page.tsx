import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { CatalogEditionEditForm } from "@/components/catalog/CatalogEditionEditForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { getEditionFormInitialValues } from "@/lib/catalog/edition-form-values";
import { CatalogError } from "@/lib/catalog/errors";
import { getWorkDetailsForViewer } from "@/lib/catalog/server/queries";

import styles from "../../../../../shared-page.module.css";

type Props = Readonly<{ params: Promise<{ workId: string; editionId: string }> }>;
const uuid = z.string().uuid();

export default async function CatalogEditionEditPage({ params }: Props) {
  const { workId, editionId } = await params;
  if (!uuid.safeParse(workId).success || !uuid.safeParse(editionId).success) notFound();

  let viewer;
  try {
    viewer = await getWorkDetailsForViewer(workId);
  } catch (error) {
    if (error instanceof CatalogError && (error.kind === "not_found" || error.kind === "validation")) notFound();
    throw error;
  }

  const edition = viewer.details.editions.find((item) => item.id === editionId);
  if (!edition) notFound();
  if (!viewer.capabilities.editions[editionId]?.canEditEdition) {
    redirect(`/catalogo/${workId}?editarEdicion=no-permitido`);
  }

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Catálogo de Foaie" title="Editar edición" description={`Actualiza la edición registrada para ${viewer.details.work.title}.`} />
      <CatalogEditionEditForm
        workId={workId}
        editionId={editionId}
        initialValues={getEditionFormInitialValues(edition)}
        hasStoredCover={edition.coverStorageKey !== null}
      />
    </div>
  );
}
