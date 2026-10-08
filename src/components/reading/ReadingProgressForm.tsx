"use client";

import { useActionState, useEffect, useId, useState } from "react";

import {
  INITIAL_READING_ACTION_STATE,
  type ReadingActionState,
} from "@/lib/reading/action-result";
import { recordReadingProgressAction } from "@/lib/reading/actions";
import { getLocalCivilDate } from "@/lib/reading/local-civil-date";
import type { ReadingProgressUnit } from "@/lib/reading/types";

import styles from "./ReadingControls.module.css";
import { ReadingSubmitButton } from "./ReadingSubmitButton";

type ReadingProgressFormProps = Readonly<{
  sessionId: string;
  progressUnit: ReadingProgressUnit;
  currentValue: number;
}>;

function fieldErrors(state: ReadingActionState, field: string) {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

function progressUnitHelp(progressUnit: ReadingProgressUnit) {
  switch (progressUnit) {
    case "PAGES":
      return "Introduce la página en la que estás.";
    case "PERCENT":
      return "Introduce el porcentaje alcanzado.";
    case "MINUTES":
      return "Introduce los minutos alcanzados.";
  }

  return progressUnit satisfies never;
}

export function ReadingProgressForm({
  sessionId,
  progressUnit,
  currentValue,
}: ReadingProgressFormProps) {
  const [state, formAction] = useActionState(
    recordReadingProgressAction,
    INITIAL_READING_ACTION_STATE,
  );
  const id = useId();
  const [targetValue, setTargetValue] = useState(String(currentValue));
  const [occurredOn, setOccurredOn] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setOccurredOn(getLocalCivilDate(new Date()));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const targetValueErrors = fieldErrors(state, "targetValue");
  const occurredOnErrors = fieldErrors(state, "occurredOn");
  const targetHelpId = `${id}-target-help`;
  const targetErrorId = `${id}-target-error`;
  const occurredOnErrorId = `${id}-occurred-on-error`;
  const targetDescription = targetValueErrors
    ? `${targetHelpId} ${targetErrorId}`
    : targetHelpId;
  const numericTarget = Number(targetValue);
  const kind = numericTarget < currentValue
    ? "CORRECTION"
    : "PROGRESS";

  return (
    <details className={styles.disclosure}>
      <summary>Editar progreso</summary>
      <form className={styles.form} action={formAction}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="kind" value={kind} />

        <div className={styles.field}>
          <label htmlFor={`${id}-target-value`}>¿Por dónde vas?</label>
          <input
            id={`${id}-target-value`}
            name="targetValue"
            type="number"
            step="1"
            inputMode="numeric"
            required
            value={targetValue}
            onChange={(event) => setTargetValue(event.target.value)}
            aria-invalid={Boolean(targetValueErrors)}
            aria-describedby={targetDescription}
          />
          <p id={targetHelpId} className={styles.help}>
            {progressUnitHelp(progressUnit)}
          </p>
          {targetValueErrors ? (
            <p id={targetErrorId} className={styles.fieldError}>
              {targetValueErrors.join(" ")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-occurred-on`}>Fecha</label>
          <input
            id={`${id}-occurred-on`}
            name="occurredOn"
            type="date"
            required
            value={occurredOn}
            onChange={(event) => setOccurredOn(event.target.value)}
            aria-invalid={Boolean(occurredOnErrors)}
            aria-describedby={occurredOnErrors ? occurredOnErrorId : undefined}
          />
          {occurredOnErrors ? (
            <p id={occurredOnErrorId} className={styles.fieldError}>
              {occurredOnErrors.join(" ")}
            </p>
          ) : null}
        </div>

        {state.status === "error" ? (
          <p className={styles.error} role="alert">{state.message}</p>
        ) : null}
        {state.status === "success" ? (
          <p className={styles.success} role="status">{state.message}</p>
        ) : null}

        <ReadingSubmitButton
          idleLabel="Guardar"
          pendingLabel="Guardando…"
        />
      </form>
    </details>
  );
}
