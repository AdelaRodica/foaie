"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import {
  INITIAL_READING_GOAL_ACTION_STATE,
  type ReadingGoalActionState,
} from "@/lib/reading-goals/action-result";
import {
  createAnnualReadingGoalAction,
  updateAnnualReadingGoalAction,
} from "@/lib/reading-goals/actions";

import styles from "./ReadingGoalForms.module.css";

type ReadingGoalFormProps =
  | Readonly<{ mode: "create"; year: number }>
  | Readonly<{
      mode: "update";
      goalId: string;
      initialTargetCount: number;
    }>;

function getTargetCountErrors(state: ReadingGoalActionState) {
  return state.status === "error" ? state.fieldErrors?.targetCount : undefined;
}

function SubmitButton({ mode }: Readonly<{ mode: "create" | "update" }>) {
  const { pending } = useFormStatus();
  const idleLabel = mode === "create" ? "Guardar objetivo" : "Guardar cambio";

  return (
    <button className={styles.primaryButton} type="submit" disabled={pending}>
      {pending ? "Guardando…" : idleLabel}
    </button>
  );
}

export function ReadingGoalForm(props: ReadingGoalFormProps) {
  const action =
    props.mode === "create"
      ? createAnnualReadingGoalAction
      : updateAnnualReadingGoalAction;
  const [state, formAction] = useActionState(
    action,
    INITIAL_READING_GOAL_ACTION_STATE,
  );
  const id = useId();
  const targetCountErrors = getTargetCountErrors(state);
  const errorId = `${id}-target-count-error`;
  const hintId = `${id}-target-count-hint`;
  const describedBy = targetCountErrors ? `${hintId} ${errorId}` : hintId;

  return (
    <form className={styles.form} action={formAction}>
      {props.mode === "create" ? (
        <input type="hidden" name="year" value={props.year} />
      ) : (
        <input type="hidden" name="goalId" value={props.goalId} />
      )}

      <div className={styles.field}>
        <label htmlFor={`${id}-target-count`}>
          {props.mode === "create" ? "Lecturas" : "Cambiar objetivo"}
        </label>
        <input
          id={`${id}-target-count`}
          name="targetCount"
          type="number"
          min="1"
          step="1"
          inputMode="numeric"
          required
          placeholder={props.mode === "create" ? "12" : undefined}
          defaultValue={
            props.mode === "update" ? props.initialTargetCount : undefined
          }
          aria-invalid={Boolean(targetCountErrors)}
          aria-describedby={describedBy}
        />
        <p className={styles.hint} id={hintId}>
          Elige una referencia positiva. Puedes cambiarla cuando quieras.
        </p>
        {targetCountErrors ? (
          <p className={styles.fieldError} id={errorId}>
            {targetCountErrors.join(" ")}
          </p>
        ) : null}
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

      <SubmitButton mode={props.mode} />
    </form>
  );
}
