"use client";

import { useState, useTransition } from "react";

import {
  addEditionToLibraryAction,
  removeEditionFromLibraryAction,
} from "@/lib/library/actions";
import type { LibraryActionResult } from "@/lib/library/action-result";

import styles from "./LibraryEditionControl.module.css";

type Props = Readonly<{
  editionId: string;
  isInMyLibrary: boolean;
}>;

export function LibraryEditionControl({ editionId, isInMyLibrary }: Props) {
  const [previousServerValue, setPreviousServerValue] = useState(isInMyLibrary);
  const [isInLibrary, setIsInLibrary] = useState(isInMyLibrary);
  const [result, setResult] = useState<LibraryActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  if (previousServerValue !== isInMyLibrary) {
    setPreviousServerValue(isInMyLibrary);
    setIsInLibrary(isInMyLibrary);
  }

  function updateMembership() {
    if (isPending) return;
    const removing = isInLibrary;
    setResult(null);

    startTransition(async () => {
      try {
        const nextResult = removing
          ? await removeEditionFromLibraryAction(editionId)
          : await addEditionToLibraryAction(editionId);

        if (nextResult.success) setIsInLibrary(!removing);
        setResult(nextResult);
      } catch {
        setResult({
          success: false,
          kind: "unexpected",
          message: "No se ha podido actualizar tu biblioteca. Inténtalo de nuevo.",
        });
      }
    });
  }

  const buttonLabel = isPending
    ? isInLibrary ? "Quitando…" : "Añadiendo…"
    : isInLibrary ? "Quitar de mi biblioteca" : "Añadir a mi biblioteca";

  return (
    <div className={styles.control} aria-busy={isPending}>
      <div className={styles.actions}>
        {isInLibrary ? <span className={styles.membership}>En mi biblioteca</span> : null}
        <button
          type="button"
          className={styles.button}
          disabled={isPending}
          onClick={updateMembership}
        >
          {buttonLabel}
        </button>
      </div>
      {result ? (
        <p
          className={result.success ? styles.status : styles.error}
          role={result.success ? "status" : "alert"}
        >
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
