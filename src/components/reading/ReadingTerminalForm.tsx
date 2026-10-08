"use client";

import { useActionState, useEffect, useId, useState } from "react";

import {
  INITIAL_READING_ACTION_STATE,
  type ReadingActionState,
} from "@/lib/reading/action-result";
import {
  abandonReadingAction,
  finishReadingAction,
} from "@/lib/reading/actions";
import { getLocalCivilDate } from "@/lib/reading/local-civil-date";

import styles from "./ReadingControls.module.css";
import { ReadingSubmitButton } from "./ReadingSubmitButton";

type ReadingTerminalFormProps = Readonly<{
  sessionId: string;
  mode: "FINISH" | "ABANDON";
}>;

function fieldErrors(state: ReadingActionState, field: string) {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

export function ReadingTerminalForm({
  sessionId,
  mode,
}: ReadingTerminalFormProps) {
  const action = mode === "FINISH"
    ? finishReadingAction
    : abandonReadingAction;
  const [state, formAction] = useActionState(
    action,
    INITIAL_READING_ACTION_STATE,
  );
  const id = useId();
  const [terminalDate, setTerminalDate] = useState("");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTerminalDate(getLocalCivilDate(new Date()));
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  const isFinish = mode === "FINISH";
  const fieldName = isFinish ? "finishedAt" : "abandonedAt";
  const errors = fieldErrors(state, fieldName);
  const errorId = `${id}-date-error`;
  const helpId = `${id}-help`;
  const description = errors ? `${helpId} ${errorId}` : helpId;
  const summary = isFinish ? "Terminar lectura" : "Abandonar lectura";
  const dateLabel = isFinish ? "Fecha de finalización" : "Fecha de abandono";
  const pendingLabel = isFinish ? "Terminando…" : "Abandonando…";
  const help = isFinish
    ? "Se cerrará esta lectura conservando el progreso que has registrado."
    : "Se conservarán el progreso y el historial de esta lectura.";
  const disclosureClass = isFinish
    ? `${styles.disclosure} ${styles.terminalDisclosure}`
    : `${styles.disclosure} ${styles.abandonDisclosure}`;

  return (
    <details className={disclosureClass}>
      <summary>{summary}</summary>
      <form className={styles.form} action={formAction}>
        <input type="hidden" name="sessionId" value={sessionId} />

        <div className={styles.field}>
          <label htmlFor={`${id}-date`}>{dateLabel}</label>
          <input
            id={`${id}-date`}
            name={fieldName}
            type="date"
            required
            value={terminalDate}
            onChange={(event) => setTerminalDate(event.target.value)}
            aria-invalid={Boolean(errors)}
            aria-describedby={description}
          />
          <p id={helpId} className={styles.help}>{help}</p>
          {errors ? (
            <p id={errorId} className={styles.fieldError}>
              {errors.join(" ")}
            </p>
          ) : null}
        </div>

        {state.status === "error" ? (
          <p className={styles.error} role="alert">{state.message}</p>
        ) : null}
        {state.status === "success" ? (
          <p className={styles.success} role="status">{state.message}</p>
        ) : null}

        <ReadingSubmitButton idleLabel={summary} pendingLabel={pendingLabel} />
      </form>
    </details>
  );
}
