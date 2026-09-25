"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { createCatalogEntryAction } from "@/app/(app)/biblioteca/nuevo/actions";
import type { GenreOption } from "@/lib/catalog/types";

import { EditionFormSection } from "./EditionFormSection";
import { WorkFormSection } from "./WorkFormSection";
import styles from "./catalog-form.module.css";

type FailedResult = Extract<
  Awaited<ReturnType<typeof createCatalogEntryAction>>,
  { success: false }
>;

const focusTargets: Record<string, string> = {
  "work.title": "work-title",
  "work.originalPublicationYear": "original-year",
  "work.originalTitle": "original-title",
  "work.originalLanguageCode": "original-language",
  "work.description": "work-description",
  authorRelations: "authors-section",
  genreRelations: "genres-section",
  seriesRelations: "series-section",
  "edition.publisherId": "publisher-section",
  "edition.format": "edition-format",
  "edition.isbn": "edition-isbn",
  "edition.publicationDate": "publication-date",
  "edition.publicationDatePrecision": "date-precision",
  "edition.languageCode": "edition-language",
  "edition.pageCount": "page-count",
  "edition.audioDurationMinutes": "audio-duration",
  "edition.editionTitle": "edition-title",
  "edition.subtitle": "edition-subtitle",
  "edition.coverUrl": "cover-url",
};

export function CatalogEntryForm({ genres, initialTitle }: Readonly<{ genres: GenreOption[]; initialTitle: string }>) {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const [failure, setFailure] = useState<FailedResult | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!failure) return;
    const firstField = Object.keys(failure.fieldErrors ?? {})[0];
    const targetId = firstField ? focusTargets[firstField] : undefined;
    const target = targetId ? document.getElementById(targetId) : null;
    if (target && target.getAttribute("type") !== "hidden" && target.getClientRects().length > 0) target.focus();
    else errorSummaryRef.current?.focus();
  }, [failure]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || submittingRef.current) return;
    submittingRef.current = true;
    setFailure(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        const result = await createCatalogEntryAction(formData);
        if (result.success) {
          router.push(`/catalogo/${result.data.workId}?creado=1`);
          return;
        }
        submittingRef.current = false;
        setFailure(result);
      } catch {
        submittingRef.current = false;
        setFailure({
          success: false,
          kind: "unexpected",
          message: "No se ha podido guardar la entrada. Inténtalo de nuevo.",
        });
      }
    });
  }

  const summaryErrors = failure
    ? [...new Set([failure.message, ...Object.values(failure.fieldErrors ?? {}).flat()])]
    : [];

  return (
    <form className={styles.form} onSubmit={submit} aria-busy={isPending}>
      <p className={styles.intro}>Crea una obra y una edición en el catálogo compartido de Foaie. Todavía no se añadirá a tu Biblioteca.</p>
      {failure ? (
        <div className={styles.errorSummary} role="alert" tabIndex={-1} ref={errorSummaryRef}>
          <h2>Revisa los datos antes de guardar</h2>
          <ul>{summaryErrors.map((message) => <li key={message}>{message}</li>)}</ul>
        </div>
      ) : null}
      <WorkFormSection genres={genres} initialTitle={initialTitle} fieldErrors={failure?.fieldErrors} />
      <EditionFormSection fieldErrors={failure?.fieldErrors} />
      <div className={styles.submitArea}>
        <button className={styles.primaryButton} type="submit" disabled={isPending}>
          {isPending ? "Guardando…" : "Guardar en el catálogo"}
        </button>
        <p className={styles.help}>La entrada se guardará en el catálogo compartido; todavía no se añadirá a tu Biblioteca.</p>
      </div>
    </form>
  );
}
