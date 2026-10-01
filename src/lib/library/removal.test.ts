import { describe, expect, it } from "vitest";

import { LibraryError } from "./errors";
import { resolveLibraryRemovalFallback } from "./removal";

function expectLibraryError(operation: () => unknown, kind: LibraryError["kind"]) {
  expect(operation).toThrowError(LibraryError);
  try {
    operation();
  } catch (error) {
    expect(error).toMatchObject({
      kind,
      operation: "removeEditionFromLibrary",
    });
  }
}

describe("resolveLibraryRemovalFallback", () => {
  it("maps an absent membership to not_found", () => {
    expectLibraryError(() => resolveLibraryRemovalFallback(null), "not_found");
  });

  it("maps a still-visible membership to protected_history", () => {
    expectLibraryError(
      () => resolveLibraryRemovalFallback({ id: "membership-id" }),
      "protected_history",
    );
  });
});
