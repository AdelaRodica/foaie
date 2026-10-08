import type { PostgrestError } from "@supabase/supabase-js";

export type ReadingGoalErrorKind =
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "permission"
  | "constraint"
  | "unexpected";

type ReadingGoalErrorOptions = Readonly<{
  operation?: string;
  cause?: unknown;
}>;

type DatabaseError = Pick<PostgrestError, "code">;

const errorMessages: Record<ReadingGoalErrorKind, string> = {
  unauthenticated: "Debes iniciar sesión para continuar.",
  not_found: "No se ha encontrado el objetivo de lectura solicitado.",
  conflict: "Ya existe un objetivo de lectura para ese año.",
  permission: "No tienes permiso para realizar esta operación.",
  constraint: "El objetivo no cumple las reglas de lectura.",
  unexpected: "No se ha podido completar la operación con el objetivo.",
};

const mutationErrorKinds = {
  "23502": "constraint",
  "23503": "constraint",
  "23505": "conflict",
  "23514": "constraint",
  "42501": "permission",
} as const satisfies Record<string, ReadingGoalErrorKind>;

export class ReadingGoalError extends Error {
  readonly kind: ReadingGoalErrorKind;
  readonly operation?: string;

  constructor(kind: ReadingGoalErrorKind, options: ReadingGoalErrorOptions = {}) {
    super(errorMessages[kind], { cause: options.cause });
    this.name = "ReadingGoalError";
    this.kind = kind;
    this.operation = options.operation;
  }
}

export function mapReadingGoalReadError(
  error: DatabaseError,
  operation: string,
): ReadingGoalError {
  return new ReadingGoalError(
    error.code === "42501" ? "permission" : "unexpected",
    { operation, cause: error },
  );
}

export function mapReadingGoalMutationError(
  error: DatabaseError,
  operation: string,
): ReadingGoalError {
  const kind = error.code in mutationErrorKinds
    ? mutationErrorKinds[error.code as keyof typeof mutationErrorKinds]
    : "unexpected";

  return new ReadingGoalError(kind, { operation, cause: error });
}

export function assertSafeYear(year: number, operation: string): void {
  if (!Number.isSafeInteger(year)) {
    throw new ReadingGoalError("constraint", { operation });
  }
}

export function assertPositiveTargetCount(
  targetCount: number,
  operation: string,
): void {
  if (!Number.isSafeInteger(targetCount) || targetCount <= 0) {
    throw new ReadingGoalError("constraint", { operation });
  }
}
