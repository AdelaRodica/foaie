import { describe, expect, it } from "vitest";

import { getCivilDateInTimeZone } from "./current-date";

describe("getCivilDateInTimeZone", () => {
  it("formats UTC with padded month and day", () => {
    expect(
      getCivilDateInTimeZone(new Date("2026-01-02T03:04:05.000Z"), "UTC"),
    ).toBe("2026-01-02");
  });

  it("moves to the next date in Europe/Madrid", () => {
    expect(
      getCivilDateInTimeZone(
        new Date("2026-01-01T23:30:00.000Z"),
        "Europe/Madrid",
      ),
    ).toBe("2026-01-02");
  });

  it("moves to the previous date in America/Los_Angeles", () => {
    expect(
      getCivilDateInTimeZone(
        new Date("2026-06-01T02:30:00.000Z"),
        "America/Los_Angeles",
      ),
    ).toBe("2026-05-31");
  });

  it("derives the user's previous year rather than the UTC year", () => {
    expect(
      getCivilDateInTimeZone(
        new Date("2027-01-01T00:30:00.000Z"),
        "America/Los_Angeles",
      ),
    ).toBe("2026-12-31");
  });

  it("is independent of the process timezone", () => {
    const instant = new Date("2026-10-08T00:30:00.000Z");

    expect(getCivilDateInTimeZone(instant, "Pacific/Honolulu")).toBe(
      "2026-10-07",
    );
    expect(getCivilDateInTimeZone(instant, "Pacific/Kiritimati")).toBe(
      "2026-10-08",
    );
  });

  it("rejects an invalid timezone", () => {
    expect(() =>
      getCivilDateInTimeZone(
        new Date("2026-01-01T00:00:00.000Z"),
        "Invalid/Timezone",
      ),
    ).toThrow(RangeError);
  });
});
