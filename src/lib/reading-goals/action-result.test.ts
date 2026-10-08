import { describe, expect, it } from "vitest";

import {
  mapReadingGoalErrorToActionState,
  mapUnknownReadingGoalActionError,
  readingGoalActionSuccess,
  readingGoalValidationFailure,
} from "./action-result";
import { ReadingGoalError } from "./server/errors";
import { createAnnualReadingGoalSchema } from "./validation";

describe("reading goal action results", () => {
  it("returns a compact success result", () => {
    expect(readingGoalActionSuccess("Objetivo creado.")).toEqual({
      status: "success",
      message: "Objetivo creado.",
    });
  });

  it("returns field errors for invalid input", () => {
    const parsed = createAnnualReadingGoalSchema.safeParse({
      year: "",
      targetCount: "0",
    });

    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    expect(readingGoalValidationFailure(parsed.error)).toEqual({
      status: "error",
      kind: "validation",
      message: "Revisa los datos del objetivo.",
      fieldErrors: {
        year: ["Introduce un año válido."],
        targetCount: ["Introduce un número de lecturas mayor que 0."],
      },
    });
  });

  it.each([
    ["unauthenticated", "Debes iniciar sesión para gestionar tu objetivo de lectura."],
    ["not_found", "Ese objetivo de lectura ya no existe."],
    ["conflict", "Ya tienes un objetivo de lectura para ese año."],
    ["permission", "No se ha podido modificar ese objetivo de lectura."],
    ["constraint", "Los datos del objetivo no son válidos."],
    [
      "unexpected",
      "No se ha podido guardar el objetivo de lectura. Inténtalo de nuevo.",
    ],
  ] as const)("maps %s errors to safe public copy", (kind, message) => {
    const state = mapReadingGoalErrorToActionState(
      new ReadingGoalError(kind, { cause: "sensitive database detail" }),
    );

    expect(state).toEqual({ status: "error", kind, message });
    expect(JSON.stringify(state)).not.toContain("sensitive database detail");
  });

  it("maps unknown failures without exposing their details", () => {
    const state = mapUnknownReadingGoalActionError(
      new Error("sensitive database detail"),
    );

    expect(state).toEqual({
      status: "error",
      kind: "unexpected",
      message: "No se ha podido guardar el objetivo de lectura. Inténtalo de nuevo.",
    });
    expect(JSON.stringify(state)).not.toContain("sensitive database detail");
  });
});
