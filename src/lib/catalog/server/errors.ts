import "server-only";

import { CatalogError } from "../errors";

type ReadError = Readonly<{ code?: string | null }>;

const mutationErrorKinds = {
  "22003": "validation",
  "22007": "validation",
  "22008": "validation",
  "22023": "validation",
  "22P02": "validation",
  "23502": "constraint",
  "23503": "constraint",
  "23505": "conflict",
  "23514": "constraint",
  "42501": "permission",
} as const;

export function mapCatalogReadError(error: ReadError, operation: string) {
  return new CatalogError(error.code === "42501" ? "permission" : "unexpected", {
    operation,
    cause: error,
  });
}

export function mapCatalogMutationError(error: ReadError, operation: string) {
  const kind = error.code && error.code in mutationErrorKinds
    ? mutationErrorKinds[error.code as keyof typeof mutationErrorKinds]
    : "unexpected";

  return new CatalogError(kind, { operation, cause: error });
}
