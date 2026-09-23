import "server-only";

import { CatalogError } from "../errors";

type ReadError = Readonly<{ code?: string | null }>;

export function mapCatalogReadError(error: ReadError, operation: string) {
  return new CatalogError(error.code === "42501" ? "permission" : "unexpected", {
    operation,
    cause: error,
  });
}
