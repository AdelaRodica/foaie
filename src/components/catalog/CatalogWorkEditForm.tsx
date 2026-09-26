"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  deleteCatalogWorkAction,
  updateCatalogWorkAction,
} from "@/app/(app)/catalogo/[workId]/editar/actions";
import type { GenreOption, WorkDetails } from "@/lib/catalog/types";

import { ButtonLink } from "../ui/ButtonLink";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { WorkFormSection } from "./WorkFormSection";
import styles from "./catalog-form.module.css";

type CatalogWorkEditDetails = Pick<
  WorkDetails,
  "work" | "authors" | "genres" | "series"
>;

type FailedResult = Extract<
  Awaited<ReturnType<typeof updateCatalogWorkAction>>,
  { success: false }
>;

const focusTargets: Record<string, string> = {
  "work.title": "work-title",
  "work.originalTitle": "original-title",
  "work.originalPublicationYear": "original-year",
  "work.originalLanguageCode": "original-language",
  "work.description": "work-description",
  authorRelations: "authors-section",
  genreRelations: "genres-section",
  seriesRelations: "series-section",
};

type CatalogWorkEditFormProps = Readonly<{
  details: CatalogWorkEditDetails;
  genres: GenreOption[];
  canDeleteWork: boolean;
}>;

export function CatalogWorkEditForm({ details, genres, canDeleteWork }: CatalogWorkEditFormProps) {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const deletingRef = useRef(false);
  const [failure, setFailure] = useState<FailedResult | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!failure) return;
    const firstField = Object.keys(failure.fieldErrors ?? {})[0];
    const targetId = firstField ? focusTargets[firstField] : undefined;
    const target = targetId ? document.getElementById(targetId) : null;

    if (
      target
      && target.getAttribute("type") !== "hidden"
      && target.getClientRects().length > 0
    ) {
      target.focus();
    } else {
      errorSummaryRef.current?.focus();
    }
  }, [failure]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isDeleting || submittingRef.current || deletingRef.current) return;
    submittingRef.current = true;
    setFailure(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateCatalogWorkAction(details.work.id, formData);
        if (result.success) {
          router.push(`/catalogo/${result.data.workId}?actualizado=1`);
          return;
        }
        submittingRef.current = false;
        setFailure(result);
      } catch {
        submittingRef.current = false;
        setFailure({
          success: false,
          kind: "unexpected",
          message: "No se han podido guardar los cambios. Inténtalo de nuevo.",
        });
      }
    });
  }

  async function deleteWork() {
    if (submittingRef.current) return "Espera a que termine el guardado antes de eliminar la obra.";
    const result = await deleteCatalogWorkAction(details.work.id);
    if (!result.success) return result.message;
    router.replace("/biblioteca/nuevo?obraEliminada=1");
    return null;
  }

  const summaryErrors = failure
    ? [...new Set([failure.message, ...Object.values(failure.fieldErrors ?? {}).flat()])]
    : [];

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={isPending}>
      <p className={styles.intro}>
        Actualiza los datos de la obra y sus relaciones en el catálogo compartido.
        Las ediciones se gestionan por separado.
      </p>
      {failure ? (
        <div
          className={styles.errorSummary}
          role="alert"
          tabIndex={-1}
          ref={errorSummaryRef}
        >
          <h2>Revisa los datos antes de guardar</h2>
          <ul>
            {summaryErrors.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      ) : null}
      <WorkFormSection
        genres={genres}
        initialValues={{
          title: details.work.title,
          originalTitle: details.work.originalTitle,
          originalPublicationYear: details.work.originalPublicationYear,
          originalLanguageCode: details.work.originalLanguageCode,
          description: details.work.description,
        }}
        initialAuthors={details.authors}
        initialGenres={details.genres}
        initialSeries={details.series}
        fieldErrors={failure?.fieldErrors}
      />
      <div className={styles.submitArea}>
        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={isPending || isDeleting}>
            {isPending ? "Guardando…" : "Guardar cambios"}
          </button>
          <ButtonLink href={`/catalogo/${details.work.id}`} variant="secondary">
            Cancelar
          </ButtonLink>
        </div>
      </div>
      <section className={styles.dangerZone} aria-labelledby="delete-work-title">
        <div>
          <h2 id="delete-work-title">Eliminar del catálogo</h2>
          <p>{canDeleteWork ? "Elimina esta obra de forma permanente." : "Esta obra no puede eliminarse mientras conserve ediciones."}</p>
        </div>
        {canDeleteWork ? (
          <ConfirmDeleteDialog
            title="Eliminar obra"
            description="Esta obra se eliminará del catálogo. Esta acción no se puede deshacer."
            triggerLabel="Eliminar obra"
            confirmLabel="Eliminar obra"
            pendingLabel="Eliminando…"
            disabled={isPending}
            onConfirm={deleteWork}
            onPendingChange={(pending) => {
              deletingRef.current = pending;
              setIsDeleting(pending);
            }}
          />
        ) : null}
      </section>
    </form>
  );
}
