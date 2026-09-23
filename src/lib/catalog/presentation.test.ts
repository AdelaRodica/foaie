import { describe, expect, it } from "vitest";

import { formatAudioDuration, formatPublicationDate } from "./presentation";
import { normalizeIsbnSearch } from "./mappers";

describe("normalizeIsbnSearch", () => {
  it("normalizes plausible ISBN-10 and ISBN-13 values", () => {
    expect(normalizeIsbnSearch("0-8044-2957-x")).toEqual({ field: "isbn10", value: "080442957X" });
    expect(normalizeIsbnSearch("978 0 306 40615 7")).toEqual({ field: "isbn13", value: "9780306406157" });
  });

  it("rejects non-ISBN search terms without checking a checksum", () => {
    expect(normalizeIsbnSearch("una novela")).toBeNull();
    expect(normalizeIsbnSearch("1234")).toBeNull();
  });
});

describe("formatPublicationDate", () => {
  it.each([
    ["2026-01-01", "YEAR", "2026"],
    ["2026-05-01", "MONTH", "mayo de 2026"],
    ["2026-05-17", "DAY", "17 de mayo de 2026"],
  ])("formats %s with %s precision", (date, precision, expected) => {
    expect(formatPublicationDate(date, precision)).toBe(expected);
  });

  it("omits incomplete dates", () => {
    expect(formatPublicationDate(null, null)).toBeNull();
  });
});

describe("formatAudioDuration", () => {
  it.each([[45, "45 min"], [120, "2 h"], [135, "2 h 15 min"]])(
    "formats %s minutes",
    (minutes, expected) => expect(formatAudioDuration(minutes)).toBe(expected),
  );
});
