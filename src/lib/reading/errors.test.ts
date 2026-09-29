import { describe, expect, it } from "vitest";

import { mapReadingMutationError } from "./errors";
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
