import { z } from "zod";
import { describe, expect, it } from "vitest";

import { CatalogError, catalogValidationError } from "./errors";

describe("CatalogError", () => {
  it("does not expose technical details in its public message", () => {
    const technicalMessage = "SQLSTATE 23505: internal database detail";
    const error = new CatalogError("conflict", {
      operation: "createWork",
      cause: new Error(technicalMessage),
    });

    expect(error.kind).toBe("conflict");
    expect(error.operation).toBe("createWork");
    expect(error.message).not.toContain("23505");
    expect(error.message).not.toContain("internal database detail");
  });

  it("converts a ZodError to a validation error", () => {
    const parsed = z.string().min(1).safeParse("");
    if (parsed.success) throw new Error("Expected invalid fixture");

    const error = catalogValidationError(parsed.error, "parseInput");
    expect(error).toBeInstanceOf(CatalogError);
    expect(error.kind).toBe("validation");
    expect(error.operation).toBe("parseInput");
  });
});
