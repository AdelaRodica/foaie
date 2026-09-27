import { describe, expect, it } from "vitest";

import {
  libraryActionSuccess,
  libraryValidationFailure,
  mapAddToLibraryError,
  mapRemoveFromLibraryError,
  validateLibraryEditionId,
} from "./action-result";
import { LibraryError } from "./errors";

const validEditionId = "9b67e9d6-64de-4f8b-b3bd-928fae813b76";

describe("library action results", () => {
  it("accepts a valid edition UUID", () => {
    expect(validateLibraryEditionId(validEditionId)).toBe(true);
  });

  it("maps an invalid edition UUID to the public validation result", () => {
    expect(validateLibraryEditionId("not-an-edition-id")).toBe(false);
    expect(libraryValidationFailure()).toEqual({
      success: false,
      kind: "validation",
      message: "No hemos podido identificar la edición.",
    });
  });

  it("maps a duplicate add to an idempotent success", () => {
    expect(mapAddToLibraryError(new LibraryError("conflict"))).toEqual({
      success: true,
      state: "already_added",
      message: "Esta edición ya está en tu biblioteca.",
    });
  });

  it("maps a missing remove to an idempotent success", () => {
    expect(mapRemoveFromLibraryError(new LibraryError("not_found"))).toEqual({
      success: true,
      state: "already_removed",
      message: "La edición ya no está en tu biblioteca.",
    });
  });

  it("uses the approved generic constraint message for add", () => {
    expect(mapAddToLibraryError(new LibraryError("constraint"))).toEqual({
      success: false,
      kind: "constraint",
      message: "No se ha podido añadir esta edición a tu biblioteca.",
    });
  });

  it.each([
    ["unauthenticated", "Inicia sesión para gestionar tu biblioteca."],
    ["permission", "No tienes permiso para modificar tu biblioteca."],
  ] as const)("maps %s to a safe public message", (kind, message) => {
    expect(mapAddToLibraryError(new LibraryError(kind))).toEqual({
      success: false,
      kind,
      message,
    });
    expect(mapRemoveFromLibraryError(new LibraryError(kind))).toEqual({
      success: false,
      kind,
      message,
    });
  });

  it("maps unknown and unsupported errors to the generic result", () => {
    const expected = {
      success: false,
      kind: "unexpected",
      message: "No se ha podido actualizar tu biblioteca. Inténtalo de nuevo.",
    };

    expect(mapAddToLibraryError(new Error("database details"))).toEqual(expected);
    expect(mapAddToLibraryError(new LibraryError("not_found"))).toEqual(expected);
    expect(mapRemoveFromLibraryError(new LibraryError("constraint"))).toEqual(expected);
  });

  it("provides the exact public success messages", () => {
    expect(libraryActionSuccess("added").message).toBe(
      "La edición se ha añadido a tu biblioteca.",
    );
    expect(libraryActionSuccess("removed").message).toBe(
      "La edición se ha quitado de tu biblioteca.",
    );
  });

  it("does not expose database implementation details", () => {
    const results = [
      mapAddToLibraryError(
        new LibraryError("constraint", {
          cause: {
            code: "23503",
            message: "violates foreign key constraint user_editions_edition_id_fkey",
          },
        }),
      ),
      mapRemoveFromLibraryError(
        new LibraryError("unexpected", {
          cause: { code: "PGRST000", message: "Supabase/PostgreSQL failure" },
        }),
      ),
    ];
    const serialized = JSON.stringify(results);

    expect(serialized).not.toContain("23503");
    expect(serialized).not.toContain("PGRST000");
    expect(serialized).not.toContain("user_editions");
    expect(serialized).not.toContain("constraint user_editions_edition_id_fkey");
    expect(serialized).not.toContain("Supabase");
    expect(serialized).not.toContain("PostgreSQL");
  });
});
