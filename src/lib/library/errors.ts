import type { LibraryErrorKind } from "./types";

type LibraryErrorOptions = Readonly<{
  operation?: string;
  cause?: unknown;
}>;

type DatabaseError = Readonly<{ code?: string | null }>;

const errorMessages: Record<LibraryErrorKind, string> = {
  unauthenticated: "Debes iniciar sesión para continuar.",
  not_found: "No se ha encontrado la relación de Biblioteca solicitada.",
  conflict: "La relación de Biblioteca ya existe.",
  permission: "No tienes permiso para realizar esta operación.",
  constraint: "La operación no cumple las reglas de la Biblioteca.",
  unexpected: "No se ha podido completar la operación con la Biblioteca.",
};

const mutationErrorKinds = {
  "23503": "constraint",
  "23505": "conflict",
  "42501": "permission",
} as const satisfies Record<string, LibraryErrorKind>;

export class LibraryError extends Error {
  readonly kind: LibraryErrorKind;
  readonly operation?: string;

  constructor(kind: LibraryErrorKind, options: LibraryErrorOptions = {}) {
    super(errorMessages[kind], { cause: options.cause });
    this.name = "LibraryError";
    this.kind = kind;
    this.operation = options.operation;
  }
}

export function mapLibraryReadError(error: DatabaseError, operation: string) {
  return new LibraryError(error.code === "42501" ? "permission" : "unexpected", {
    operation,
    cause: error,
  });
}

export function mapLibraryMutationError(error: DatabaseError, operation: string) {
  const kind = error.code && error.code in mutationErrorKinds
    ? mutationErrorKinds[error.code as keyof typeof mutationErrorKinds]
    : "unexpected";

  return new LibraryError(kind, { operation, cause: error });
}
