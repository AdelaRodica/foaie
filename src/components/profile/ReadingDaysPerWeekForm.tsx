"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import {
  updateReadingDaysPerWeekAction,
  type ProfileActionState,
} from "@/lib/profile/actions";

import styles from "./ReadingDaysPerWeekForm.module.css";

type ReadingDaysPerWeekFormProps = Readonly<{
  initialValue: number;
}>;

const INITIAL_STATE: ProfileActionState = { status: "idle" };
const READING_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className={styles.button} type="submit" disabled={pending}>
      {pending ? "Guardando…" : "Guardar ritmo"}
    </button>
  );
}

export function ReadingDaysPerWeekForm({
  initialValue,
}: ReadingDaysPerWeekFormProps) {
  const [state, formAction] = useActionState(
    updateReadingDaysPerWeekAction,
    INITIAL_STATE,
  );
  const id = useId();
  const hintId = `${id}-hint`;

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor={`${id}-reading-days`}>
          Días de lectura por semana
        </label>
        <select
          id={`${id}-reading-days`}
          name="readingDaysPerWeek"
          defaultValue={String(initialValue)}
          aria-describedby={hintId}
        >
          {READING_DAY_OPTIONS.map((days) => (
            <option key={days} value={days}>
              {days} {days === 1 ? "día" : "días"}
            </option>
          ))}
        </select>
        <p className={styles.hint} id={hintId}>
          Si cambias este número, tu racha actual y tu mejor racha se
          recalcularán con el nuevo criterio.
        </p>
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

      <SubmitButton />
    </form>
  );
}
