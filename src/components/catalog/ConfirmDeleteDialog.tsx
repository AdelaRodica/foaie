"use client";

import { useRef, useState, useTransition } from "react";

import styles from "./catalog-form.module.css";

type Props = Readonly<{
  title: string;
  description: string;
  triggerLabel: string;
  confirmLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  onConfirm: () => Promise<string | null>;
  onPendingChange?: (pending: boolean) => void;
}>;

export function ConfirmDeleteDialog({
  title,
  description,
  triggerLabel,
  confirmLabel,
  pendingLabel,
  disabled = false,
  onConfirm,
  onPendingChange,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const deletingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const titleId = `delete-title-${title.replaceAll(" ", "-").toLowerCase()}`;
  const descriptionId = `${titleId}-description`;

  function open() {
    setError(null);
    dialogRef.current?.showModal();
    requestAnimationFrame(() => cancelRef.current?.focus());
  }

  function close() {
    if (deletingRef.current || isPending) return;
    dialogRef.current?.close();
  }

  function confirm() {
    if (deletingRef.current || isPending) return;
    deletingRef.current = true;
    setError(null);
    onPendingChange?.(true);
    startTransition(async () => {
      try {
        const message = await onConfirm();
        if (message) setError(message);
      } catch {
        setError("No se ha podido completar la eliminación. Inténtalo de nuevo.");
      } finally {
        deletingRef.current = false;
        onPendingChange?.(false);
      }
    });
  }

  return (
    <>
      <button ref={triggerRef} type="button" className={styles.dangerButton} disabled={disabled || isPending} onClick={open}>
        {triggerLabel}
      </button>
      <dialog
        ref={dialogRef}
        className={styles.confirmDialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => {
          if (deletingRef.current || isPending) event.preventDefault();
        }}
        onClose={() => triggerRef.current?.focus()}
      >
        <div className={styles.dialogContent}>
          <h2 id={titleId}>{title}</h2>
          <p id={descriptionId}>{description}</p>
          {error ? <p className={styles.dialogError} role="alert">{error}</p> : null}
          <div className={styles.dialogActions}>
            <button ref={cancelRef} type="button" className={styles.secondaryButton} disabled={isPending} onClick={close}>Cancelar</button>
            <button type="button" className={styles.dangerButton} disabled={isPending} onClick={confirm}>{isPending ? pendingLabel : confirmLabel}</button>
          </div>
        </div>
      </dialog>
    </>
  );
}
