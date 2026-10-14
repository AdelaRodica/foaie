"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { INITIAL_READING_GOAL_ACTION_STATE } from "@/lib/reading-goals/action-result";
import { deleteAnnualReadingGoalAction } from "@/lib/reading-goals/actions";

import styles from "./ReadingGoalForms.module.css";

type ReadingGoalDeleteFormProps = Readonly<{
  goalId: string;
  year: number;
}>;

function ConfirmationActions({ onCancel }: Readonly<{ onCancel: () => void }>) {
  const { pending } = useFormStatus();

  return (
    <div className={styles.deleteActions}>
      <button
        className={styles.secondaryButton}
        type="button"
        disabled={pending}
        onClick={onCancel}
      >
        Cancelar
      </button>
      <button className={styles.dangerButton} type="submit" disabled={pending}>
        {pending ? "Eliminando…" : "Sí, eliminar"}
      </button>
    </div>
  );
}

export function ReadingGoalDeleteForm({
  goalId,
  year,
}: ReadingGoalDeleteFormProps) {
  const [state, formAction] = useActionState(
    deleteAnnualReadingGoalAction,
    INITIAL_READING_GOAL_ACTION_STATE,
  );
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <div className={styles.deleteZone}>
        <div>
          <h3>Eliminar objetivo</h3>
          <p>Tus lecturas y tu historial no se eliminarán.</p>
        </div>
        <button
          className={styles.dangerOutlineButton}
          type="button"
          onClick={() => setIsConfirming(true)}
        >
          Eliminar objetivo
        </button>
      </div>
    );
  }

  return (
    <form className={styles.confirmation} action={formAction}>
      <input type="hidden" name="goalId" value={goalId} />
      <div>
        <h3>¿Eliminar el objetivo de {year}?</h3>
        <p>Tu historial de lectura se conservará.</p>
      </div>

      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
      {state.status === "success" ? (
        <p className={styles.success} role="status">
          {state.message}
        </p>
      ) : null}

      <ConfirmationActions onCancel={() => setIsConfirming(false)} />
    </form>
  );
}
