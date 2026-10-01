"use client";

import { useActionState, useId } from "react";

import {
  INITIAL_READING_ACTION_STATE,
  type ReadingActionState,
} from "@/lib/reading/action-result";
import { startReadingAction } from "@/lib/reading/actions";

import styles from "./ReadingControls.module.css";
import { ReadingSubmitButton } from "./ReadingSubmitButton";

type ReadingStartFormProps = Readonly<{
  userEditionId: string;
  mode: "START" | "REREAD";
}>;

function fieldErrors(state: ReadingActionState, field: string) {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

export function ReadingStartForm({
  userEditionId,
  mode,
}: ReadingStartFormProps) {
  const [state, formAction] = useActionState(
    startReadingAction,
    INITIAL_READING_ACTION_STATE,
  );
  const id = useId();
  const startedAtErrors = fieldErrors(state, "startedAt");
  const progressUnitErrors = fieldErrors(state, "progressUnit");
  const currentValueErrors = fieldErrors(state, "currentValue");
  const startedAtErrorId = `${id}-started-at-error`;
  const progressUnitErrorId = `${id}-progress-unit-error`;
  const currentValueHelpId = `${id}-current-value-help`;
  const currentValueErrorId = `${id}-current-value-error`;
  const currentValueDescription = currentValueErrors
    ? `${currentValueHelpId} ${currentValueErrorId}`
    : currentValueHelpId;
  const summary = mode === "START" ? "Empezar lectura" : "Releer";
  const pendingLabel = mode === "START"
    ? "Empezando…"
    : "Iniciando relectura…";

  return (
    <details className={styles.disclosure}>
      <summary>{summary}</summary>
      <form className={styles.form} action={formAction}>
        <input type="hidden" name="userEditionId" value={userEditionId} />

        <div className={styles.field}>
          <label htmlFor={`${id}-started-at`}>Fecha de inicio</label>
          <input
            id={`${id}-started-at`}
            name="startedAt"
            type="date"
            required
            aria-invalid={Boolean(startedAtErrors)}
            aria-describedby={startedAtErrors ? startedAtErrorId : undefined}
          />
          {startedAtErrors ? (
            <p id={startedAtErrorId} className={styles.fieldError}>
              {startedAtErrors.join(" ")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-progress-unit`}>Unidad de progreso</label>
          <select
            id={`${id}-progress-unit`}
            name="progressUnit"
            required
            defaultValue=""
            aria-invalid={Boolean(progressUnitErrors)}
            aria-describedby={progressUnitErrors ? progressUnitErrorId : undefined}
          >
            <option value="" disabled>Selecciona una unidad</option>
            <option value="PAGES">Páginas</option>
            <option value="PERCENT">Porcentaje</option>
            <option value="MINUTES">Minutos</option>
          </select>
          {progressUnitErrors ? (
            <p id={progressUnitErrorId} className={styles.fieldError}>
              {progressUnitErrors.join(" ")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${id}-current-value`}>Progreso inicial (opcional)</label>
          <input
            id={`${id}-current-value`}
            name="currentValue"
            type="number"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(currentValueErrors)}
            aria-describedby={currentValueDescription}
          />
          <p id={currentValueHelpId} className={styles.help}>
            Si ya habías empezado, puedes indicar por dónde vas. Este valor
            establece el punto de partida y no se registra como actividad.
          </p>
          {currentValueErrors ? (
            <p id={currentValueErrorId} className={styles.fieldError}>
              {currentValueErrors.join(" ")}
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
