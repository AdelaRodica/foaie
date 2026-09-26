import { describe, expect, it } from "vitest";

import { getEditionFormInitialValues } from "./edition-form-values";
import type { WorkEditionDetails } from "./types";

function edition(overrides: Partial<WorkEditionDetails> = {}): WorkEditionDetails {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    editionTitle: null,
    subtitle: null,
    isbn10: null,
    isbn13: null,
    publicationDate: null,
    publicationDatePrecision: null,
    languageCode: null,
    format: "PHYSICAL",
    pageCount: null,
    audioDurationMinutes: null,
    coverUrl: null,
    coverStorageKey: "private/cover.jpg",
    publisher: null,
    ...overrides,
  };
}

describe("getEditionFormInitialValues", () => {
  it.each([
    ["YEAR", "2020-01-01", "2020"],
    ["MONTH", "2020-06-01", "2020-06"],
    ["DAY", "2020-06-15", "2020-06-15"],
  ])("formats %s publication dates", (precision, date, expected) => {
    expect(getEditionFormInitialValues(edition({
      publicationDatePrecision: precision,
      publicationDate: date,
    })).publicationDateInput).toBe(expected);
  });

  it("prefers ISBN-10 and falls back to ISBN-13", () => {
    expect(getEditionFormInitialValues(edition({ isbn10: "0306406152", isbn13: "9780306406157" })).isbn).toBe("0306406152");
    expect(getEditionFormInitialValues(edition({ isbn13: "9791234567896" })).isbn).toBe("9791234567896");
  });

  it("uses an empty ISBN when neither value exists", () => {
    expect(getEditionFormInitialValues(edition()).isbn).toBe("");
  });

  it("does not expose the stored cover key", () => {
    expect(getEditionFormInitialValues(edition())).not.toHaveProperty("coverStorageKey");
  });
});
