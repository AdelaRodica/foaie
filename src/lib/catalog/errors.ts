import type { ZodError } from "zod";

import type { CatalogErrorKind } from "./types";

const publicMessages: Record<CatalogErrorKind, string> = {
  validation: "Los datos del catálogo no son válidos.",
  unauthenticated: "Debes iniciar sesión para continuar.",
  not_found: "No se ha encontrado el elemento solicitado.",
  conflict: "Ya existe un elemento incompatible con estos datos.",
  permission: "No tienes permiso para realizar esta operación.",
  constraint: "La operación no cumple las reglas del catálogo.",
  unexpected: "No se ha podido completar la operación con el catálogo.",
};

type CatalogErrorOptions = Readonly<{
  operation?: string;
  cause?: unknown;
}>;

export class CatalogError extends Error {
  readonly kind: CatalogErrorKind;
  readonly operation?: string;

  constructor(kind: CatalogErrorKind, options: CatalogErrorOptions = {}) {
    super(publicMessages[kind], { cause: options.cause });
    this.name = "CatalogError";
    this.kind = kind;
    this.operation = options.operation;
  }
}

export function catalogValidationError(
  error: ZodError,
  operation?: string,
) {
  return new CatalogError("validation", { operation, cause: error });
}
