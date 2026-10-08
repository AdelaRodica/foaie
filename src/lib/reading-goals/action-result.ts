import { z } from "zod";

import { ReadingGoalError } from "./server/errors";

type ReadingGoalActionErrorKind =
  | "validation"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";

export type ReadingGoalActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | {
      status: "error";
      kind: ReadingGoalActionErrorKind;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export const INITIAL_READING_GOAL_ACTION_STATE: ReadingGoalActionState = {
  status: "idle",
};

const ERROR_MESSAGES: Record<ReadingGoalError["kind"], string> = {
  unauthenticated: "Debes iniciar sesión para gestionar tu objetivo de lectura.",
  not_found: "Ese objetivo de lectura ya no existe.",
  conflict: "Ya tienes un objetivo de lectura para ese año.",
  permission: "No se ha podido modificar ese objetivo de lectura.",
  constraint: "Los datos del objetivo no son válidos.",
  unexpected: "No se ha podido guardar el objetivo de lectura. Inténtalo de nuevo.",
};

export function readingGoalActionSuccess(
  message: string,
): ReadingGoalActionState {
  return { status: "success", message };
}

export function readingGoalValidationFailure(
  error: z.ZodError,
): ReadingGoalActionState {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const field = issue.path[0];

    if (typeof field !== "string") {
      continue;
    }

    fieldErrors[field] ??= [];
    fieldErrors[field].push(issue.message);
  }

  return {
    status: "error",
    kind: "validation",
    message: "Revisa los datos del objetivo.",
    fieldErrors,
  };
}

export function mapReadingGoalErrorToActionState(
  error: ReadingGoalError,
): ReadingGoalActionState {
  return {
    status: "error",
    kind: error.kind,
    message: ERROR_MESSAGES[error.kind],
  };
}

export function mapUnknownReadingGoalActionError(
  error: unknown,
): ReadingGoalActionState {
  if (error instanceof ReadingGoalError) {
    return mapReadingGoalErrorToActionState(error);
  }

  return {
    status: "error",
    kind: "unexpected",
    message: ERROR_MESSAGES.unexpected,
  };
}
