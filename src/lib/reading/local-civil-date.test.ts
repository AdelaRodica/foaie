import { describe, expect, it } from "vitest";

import { getLocalCivilDate } from "./local-civil-date";

describe("getLocalCivilDate", () => {
  it("pads a single-digit month and day", () => {
    expect(getLocalCivilDate(new Date(2026, 0, 3, 12))).toBe("2026-01-03");
  });

  it("preserves a two-digit month, day, and the local year", () => {
    expect(getLocalCivilDate(new Date(2026, 9, 18, 12))).toBe("2026-10-18");
  });
});
