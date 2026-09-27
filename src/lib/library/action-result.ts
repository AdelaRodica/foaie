import { z } from "zod";

import { LibraryError } from "./errors";

export type LibraryActionResult =
  | {
      success: true;
      state: "added" | "already_added" | "removed" | "already_removed";
      message: string;
    }
  | {
      success: false;
      kind:
        | "validation"
        | "unauthenticated"
        | "permission"
        | "constraint"
        | "unexpected";
      message: string;
    };

const editionIdSchema = z.string().uuid();

const messages = {
  added: "La edición se ha añadido a tu biblioteca.",
  already_added: "Esta edición ya está en tu biblioteca.",
  removed: "La edición se ha quitado de tu biblioteca.",
  already_removed: "La edición ya no está en tu biblioteca.",
  validation: "No hemos podido identificar la edición.",
  unauthenticated: "Inicia sesión para gestionar tu biblioteca.",
  permission: "No tienes permiso para modificar tu biblioteca.",
  constraint: "No se ha podido añadir esta edición a tu biblioteca.",
  unexpected: "No se ha podido actualizar tu biblioteca. Inténtalo de nuevo.",
} as const;

export function validateLibraryEditionId(editionId: string) {
  return editionIdSchema.safeParse(editionId).success;
}

export function libraryValidationFailure(): LibraryActionResult {
  return { success: false, kind: "validation", message: messages.validation };
}

export function libraryActionSuccess(
  state: "added" | "already_added" | "removed" | "already_removed",
): LibraryActionResult {
  return { success: true, state, message: messages[state] };
}

function libraryActionFailure(
  kind: "unauthenticated" | "permission" | "constraint" | "unexpected",
): LibraryActionResult {
  return { success: false, kind, message: messages[kind] };
}

export function mapAddToLibraryError(error: unknown): LibraryActionResult {
  if (!(error instanceof LibraryError)) return libraryActionFailure("unexpected");

  if (error.kind === "conflict") return libraryActionSuccess("already_added");
  if (
    error.kind === "unauthenticated" ||
    error.kind === "permission" ||
    error.kind === "constraint"
  ) {
    return libraryActionFailure(error.kind);
  }

  return libraryActionFailure("unexpected");
}

export function mapRemoveFromLibraryError(error: unknown): LibraryActionResult {
  if (!(error instanceof LibraryError)) return libraryActionFailure("unexpected");

  if (error.kind === "not_found") return libraryActionSuccess("already_removed");
  if (error.kind === "unauthenticated" || error.kind === "permission") {
    return libraryActionFailure(error.kind);
  }

  return libraryActionFailure("unexpected");
}
