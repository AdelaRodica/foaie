import { describe, expect, it } from "vitest";

import { mapReadingMutationError, ReadingError } from "./errors";
import type { ReadingErrorKind } from "./types";

describe("mapReadingMutationError", () => {
  it.each<[string, ReadingErrorKind]>([
    ["23505", "conflict"],
    ["23503", "constraint"],
    ["23514", "constraint"],
    ["23502", "constraint"],
    ["42501", "permission"],
    ["UNKNOWN", "unexpected"],
  ])("maps %s to %s without exposing database details", (code, kind) => {
    const databaseMessage = "sensitive SQL or PostgREST detail";
    const databaseError = { code, message: databaseMessage };
    const error = mapReadingMutationError(
      databaseError,
      "startReading",
    );

    expect(error).toMatchObject({ kind, operation: "startReading" });
    expect(error.message).not.toContain(databaseMessage);
    expect(JSON.stringify(error)).not.toContain(databaseMessage);
  });
});

describe("ReadingError", () => {
  it("exposes a safe public message for invalid transitions", () => {
    const internalCause = "sensitive session state or database detail";
    const error = new ReadingError("invalid_transition", {
      operation: "finishReading",
      cause: new Error(internalCause),
    });

    expect(error).toMatchObject({
      kind: "invalid_transition",
      operation: "finishReading",
    });
    expect(error.message).toBe("La lectura ya se encuentra en un estado incompatible.");
    expect(error.message).not.toContain(internalCause);
    expect(JSON.stringify(error)).not.toContain(internalCause);
  });
});
