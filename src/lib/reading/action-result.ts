import type { z } from "zod";

import { ReadingError } from "./errors";

export type ReadingActionState =
  | Readonly<{ status: "idle" }>
  | Readonly<{ status: "success"; message: string }>
  | Readonly<{
      status: "error";
      kind:
        | "validation"
        | "unauthenticated"
        | "not_found"
        | "conflict"
        | "permission"
        | "constraint"
        | "invalid_transition"
        | "unexpected";
      message: string;
      fieldErrors?: Readonly<Record<string, readonly string[]>>;
    }>;

export const INITIAL_READING_ACTION_STATE: ReadingActionState = {
  status: "idle",
};

const publicMessages = {
  unauthenticated: "Inicia sesión para gestionar tus lecturas.",
  not_found: "No se ha encontrado la lectura solicitada.",
  conflict: "Ya existe una lectura activa para este libro.",
  permission: "No tienes permiso para modificar esta lectura.",
  constraint: "Revisa los datos de la lectura e inténtalo de nuevo.",
  invalid_transition: "El estado de esta lectura ha cambiado. Actualiza la página e inténtalo de nuevo.",
  unexpected: "No se ha podido actualizar la lectura. Inténtalo de nuevo.",
} as const;

export function readingActionSuccess(message: string): ReadingActionState {
  return { status: "success", message };
}

export function readingValidationFailure(error: z.ZodError): ReadingActionState {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const [field] = issue.path;
    const key = typeof field === "string" ? field : "form";
    (fieldErrors[key] ??= []).push(issue.message);
  }

  return {
    status: "error",
    kind: "validation",
    message: "Revisa los datos del formulario.",
    fieldErrors,
  };
}

export function mapReadingErrorToActionState(error: ReadingError): ReadingActionState {
  return {
    status: "error",
    kind: error.kind,
    message: publicMessages[error.kind],
  };
}

export function mapUnknownReadingActionError(error: unknown): ReadingActionState {
  if (error instanceof ReadingError) return mapReadingErrorToActionState(error);
  return {
    status: "error",
    kind: "unexpected",
    message: publicMessages.unexpected,
  };
}
