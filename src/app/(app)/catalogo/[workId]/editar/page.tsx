import { notFound, redirect } from "next/navigation";

import { CatalogWorkEditForm } from "@/components/catalog/CatalogWorkEditForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogError } from "@/lib/catalog/errors";
import {
  getWorkDetailsForViewer,
  listGenres,
} from "@/lib/catalog/server/queries";

import styles from "../../../shared-page.module.css";

type CatalogWorkEditPageProps = Readonly<{
  params: Promise<{ workId: string }>;
}>;

export default async function CatalogWorkEditPage({
  params,
}: CatalogWorkEditPageProps) {
  const { workId } = await params;
  let viewer;

  try {
    viewer = await getWorkDetailsForViewer(workId);
  } catch (error) {
    if (
      error instanceof CatalogError
      && (error.kind === "validation" || error.kind === "not_found")
    ) {
      notFound();
    }
    throw error;
  }

  if (!viewer.capabilities.canEditWork) {
    redirect(`/catalogo/${workId}?editar=no-permitido`);
  }

  const genres = await listGenres();

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Catálogo de Foaie"
        title={`Editar ${viewer.details.work.title}`}
        description="Actualiza la obra y sus relaciones. Las ediciones se gestionan por separado."
      />
      <CatalogWorkEditForm details={viewer.details} genres={genres} />
    </div>
  );
}
