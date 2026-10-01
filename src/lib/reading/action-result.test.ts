import { describe, expect, it } from "vitest";

import { ReadingError } from "./errors";
import {
  INITIAL_READING_ACTION_STATE,
  mapReadingErrorToActionState,
  mapUnknownReadingActionError,
  readingValidationFailure,
} from "./action-result";
import { startReadingSchema } from "./validation";

describe("reading action results", () => {
  it("provides an idle initial state", () => {
    expect(INITIAL_READING_ACTION_STATE).toEqual({ status: "idle" });
  });

  it.each([
    ["unauthenticated", "Inicia sesión para gestionar tus lecturas."],
    ["not_found", "No se ha encontrado la lectura solicitada."],
    ["conflict", "Ya existe una lectura activa para este libro."],
    ["permission", "No tienes permiso para modificar esta lectura."],
    ["constraint", "Revisa los datos de la lectura e inténtalo de nuevo."],
    ["invalid_transition", "El estado de esta lectura ha cambiado. Actualiza la página e inténtalo de nuevo."],
    ["unexpected", "No se ha podido actualizar la lectura. Inténtalo de nuevo."],
  ] as const)("maps %s to a safe public message", (kind, message) => {
    expect(mapReadingErrorToActionState(new ReadingError(kind))).toEqual({
      status: "error",
      kind,
      message,
    });
  });

  it("maps unknown errors without exposing their message", () => {
    const result = mapUnknownReadingActionError(
      new Error("SQLSTATE 42501: private database details"),
    );

    expect(result).toEqual({
      status: "error",
      kind: "unexpected",
      message: "No se ha podido actualizar la lectura. Inténtalo de nuevo.",
    });
    expect(JSON.stringify(result)).not.toMatch(/42501|database details|stack|cause/i);
  });

  it("maps Zod issues to public field errors", () => {
    const parsed = startReadingSchema.safeParse({
      userEditionId: "invalid",
      startedAt: "2026-02-29",
      progressUnit: "CHAPTERS",
      currentValue: "1.5",
    });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const result = readingValidationFailure(parsed.error);
    expect(result.status).toBe("error");
    if (result.status !== "error") return;
    expect(result.kind).toBe("validation");
    expect(result.fieldErrors).toHaveProperty("userEditionId");
    expect(result.fieldErrors).toHaveProperty("startedAt");
    expect(result.fieldErrors).toHaveProperty("progressUnit");
    expect(result.fieldErrors).toHaveProperty("currentValue");
    expect(JSON.stringify(result)).not.toMatch(/Zod|invalid_type|SQLSTATE|stack|cause/i);
  });

  it("does not expose details attached to a ReadingError", () => {
    const result = mapUnknownReadingActionError(
      new ReadingError("constraint", {
        cause: { code: "23514", details: "private constraint details" },
      }),
    );

    expect(JSON.stringify(result)).not.toMatch(/23514|private constraint|details|cause/i);
  });
});
