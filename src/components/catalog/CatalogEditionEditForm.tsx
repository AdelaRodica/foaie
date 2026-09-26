"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import {
  deleteCatalogEditionAction,
  updateCatalogEditionAction,
} from "@/app/(app)/catalogo/[workId]/ediciones/[editionId]/editar/actions";
import type { EditionFormInitialValues } from "@/lib/catalog/edition-form-values";

import { ButtonLink } from "../ui/ButtonLink";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { EditionFormSection } from "./EditionFormSection";
import styles from "./catalog-form.module.css";

type FailedResult = Extract<Awaited<ReturnType<typeof updateCatalogEditionAction>>, { success: false }>;

const focusTargets: Record<string, string> = {
  "edition.publisherId": "publisher-section",
  "edition.editionTitle": "edition-title",
  "edition.subtitle": "edition-subtitle",
  "edition.isbn": "edition-isbn",
  "edition.publicationDate": "publication-date",
  "edition.publicationDatePrecision": "date-precision",
  "edition.languageCode": "edition-language",
  "edition.format": "edition-format",
  "edition.pageCount": "page-count",
  "edition.audioDurationMinutes": "audio-duration",
  "edition.coverUrl": "cover-url",
};

type Props = Readonly<{
  workId: string;
  editionId: string;
  initialValues: EditionFormInitialValues;
  hasStoredCover: boolean;
  canDeleteEdition: boolean;
}>;

export function CatalogEditionEditForm({ workId, editionId, initialValues, hasStoredCover, canDeleteEdition }: Props) {
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
    const target = firstField ? document.getElementById(focusTargets[firstField] ?? "") : null;
    if (target && target.getAttribute("type") !== "hidden" && target.getClientRects().length > 0) target.focus();
    else errorSummaryRef.current?.focus();
  }, [failure]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || isDeleting || submittingRef.current || deletingRef.current) return;
    submittingRef.current = true;
    setFailure(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await updateCatalogEditionAction(workId, editionId, formData);
        if (result.success) {
          router.push(`/catalogo/${result.data.workId}?edicionActualizada=1`);
          return;
        }
        submittingRef.current = false;
        setFailure(result);
      } catch {
        submittingRef.current = false;
        setFailure({ success: false, kind: "unexpected", message: "No se han podido guardar los cambios. Inténtalo de nuevo." });
      }
    });
  }

  async function deleteEdition() {
    if (submittingRef.current) return "Espera a que termine el guardado antes de eliminar la edición.";
    const result = await deleteCatalogEditionAction(workId, editionId);
    if (!result.success) return result.message;
    router.replace(`/catalogo/${result.data.workId}?edicionEliminada=1`);
    return null;
  }

  const summaryErrors = failure
    ? [...new Set([failure.message, ...Object.values(failure.fieldErrors ?? {}).flat()])]
    : [];

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={isPending}>
      <p className={styles.intro}>Actualiza los datos de esta edición en el catálogo compartido.</p>
      {failure ? <div className={styles.errorSummary} role="alert" tabIndex={-1} ref={errorSummaryRef}><h2>Revisa los datos antes de guardar</h2><ul>{summaryErrors.map((message) => <li key={message}>{message}</li>)}</ul></div> : null}
      <EditionFormSection fieldErrors={failure?.fieldErrors} initialValues={initialValues} hasStoredCover={hasStoredCover} />
      <div className={styles.submitArea}>
        <div className={styles.formActions}>
          <button className={styles.primaryButton} type="submit" disabled={isPending || isDeleting}>{isPending ? "Guardando…" : "Guardar cambios"}</button>
          <ButtonLink href={`/catalogo/${workId}`} variant="secondary">Cancelar</ButtonLink>
        </div>
      </div>
      {canDeleteEdition ? (
        <section className={styles.dangerZone} aria-labelledby="delete-edition-title">
          <div>
            <h2 id="delete-edition-title">Eliminar del catálogo</h2>
            <p>Elimina esta edición de forma permanente.</p>
          </div>
          <ConfirmDeleteDialog
            title="Eliminar edición"
            description="Esta edición se eliminará del catálogo. Esta acción no se puede deshacer."
            triggerLabel="Eliminar edición"
            confirmLabel="Eliminar edición"
            pendingLabel="Eliminando…"
            disabled={isPending}
            onConfirm={deleteEdition}
            onPendingChange={(pending) => {
              deletingRef.current = pending;
              setIsDeleting(pending);
            }}
          />
        </section>
      ) : null}
    </form>
  );
}
