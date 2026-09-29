import type { ReadingErrorKind } from "./types";

type ReadingErrorOptions = Readonly<{
  operation?: string;
  cause?: unknown;
}>;

type DatabaseError = Readonly<{ code?: string | null }>;

const errorMessages: Record<ReadingErrorKind, string> = {
  unauthenticated: "Debes iniciar sesión para continuar.",
  not_found: "No se ha encontrado la lectura solicitada.",
  conflict: "Ya existe una lectura incompatible con esta operación.",
  invalid_transition: "La lectura ya se encuentra en un estado incompatible.",
  permission: "No tienes permiso para realizar esta operación.",
  constraint: "La operación no cumple las reglas de lectura.",
  unexpected: "No se ha podido completar la operación de lectura.",
};

const mutationErrorKinds = {
  "23502": "constraint",
  "23503": "constraint",
  "23505": "conflict",
  "23514": "constraint",
  "42501": "permission",
} as const satisfies Record<string, ReadingErrorKind>;

export class ReadingError extends Error {
  readonly kind: ReadingErrorKind;
  readonly operation?: string;

  constructor(kind: ReadingErrorKind, options: ReadingErrorOptions = {}) {
    super(errorMessages[kind], { cause: options.cause });
    this.name = "ReadingError";
    this.kind = kind;
    this.operation = options.operation;
  }
}

export function mapReadingReadError(error: DatabaseError, operation: string) {
  return new ReadingError(error.code === "42501" ? "permission" : "unexpected", {
    operation,
    cause: error,
  });
}

export function mapReadingMutationError(error: DatabaseError, operation: string) {
  const kind = error.code && error.code in mutationErrorKinds
    ? mutationErrorKinds[error.code as keyof typeof mutationErrorKinds]
    : "unexpected";

  return new ReadingError(kind, { operation, cause: error });
}
