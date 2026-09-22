import { describe, expect, it } from "vitest";

import {
  authorInputSchema,
  editionCreateInputSchema,
  editionFormats,
  editionUpdateInputSchema,
  publisherInputSchema,
  seriesInputSchema,
  workAuthorInputSchema,
  workGenreInputSchema,
  workInputSchema,
  workSeriesInputSchema,
} from "./schemas";

const workId = "11111111-1111-4111-8111-111111111111";
const relatedId = "22222222-2222-4222-8222-222222222222";

const validEdition = {
  workId,
  publisherId: null,
  editionTitle: null,
  subtitle: null,
  isbn10: null,
  isbn13: null,
  publicationDate: null,
  publicationDatePrecision: null,
  languageCode: null,
  format: "PHYSICAL" as const,
  pageCount: null,
  audioDurationMinutes: null,
  coverUrl: null,
  coverStorageKey: null,
};

describe("workInputSchema", () => {
  it("accepts and trims a valid work", () => {
    expect(workInputSchema.parse({ title: "  Una obra  " })).toEqual({
      title: "Una obra",
      originalTitle: null,
      description: null,
      originalPublicationYear: null,
      originalLanguageCode: null,
    });
  });

  it("rejects an empty title", () => {
    expect(() => workInputSchema.parse({ title: "   " })).toThrow();
  });

  it.each([0, -5001, 3001])("rejects invalid publication year %s", (year) => {
    expect(() => workInputSchema.parse({ title: "Obra", originalPublicationYear: year })).toThrow();
  });

  it("converts optional blank strings to null", () => {
    const result = workInputSchema.parse({
      title: "Obra",
      originalTitle: " ",
      description: "",
      originalLanguageCode: "   ",
    });
    expect(result.originalTitle).toBeNull();
    expect(result.description).toBeNull();
    expect(result.originalLanguageCode).toBeNull();
  });
});

describe("simple catalog schemas", () => {
  it("validates author input", () => {
    expect(authorInputSchema.parse({ name: "  Ursula  ", sortName: " " })).toEqual({ name: "Ursula", sortName: null });
  });

  it("validates publisher input", () => {
    expect(publisherInputSchema.parse({ name: "  Editorial  " })).toEqual({ name: "Editorial" });
  });

  it("validates series input without limiting description", () => {
    const description = "a".repeat(10_000);
    expect(seriesInputSchema.parse({ name: "  Saga  ", description })).toEqual({ name: "Saga", description });
  });
});

describe("edition schemas", () => {
  it("accepts a valid edition create input", () => {
    expect(editionCreateInputSchema.parse(validEdition)).toEqual(validEdition);
  });

  it("does not accept workId in updates", () => {
    expect(() => editionUpdateInputSchema.parse({ workId })).toThrow();
  });

  it.each(editionFormats)("accepts %s format", (format) => {
    expect(editionCreateInputSchema.parse({ ...validEdition, format }).format).toBe(format);
  });

  it("rejects an unknown format", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, format: "SCROLL" })).toThrow();
  });

  it.each([
    ["pageCount", 0],
    ["pageCount", 1.5],
    ["audioDurationMinutes", -1],
    ["audioDurationMinutes", 2.5],
  ])("rejects invalid %s", (field, value) => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, [field]: value })).toThrow();
  });

  it.each([
    ["2026-01-01", "YEAR"],
    ["2026-05-01", "MONTH"],
    ["2026-05-17", "DAY"],
  ])("accepts valid %s precision %s", (publicationDate, publicationDatePrecision) => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, publicationDate, publicationDatePrecision })).not.toThrow();
  });

  it.each([
    ["2026-02-01", "YEAR"],
    ["2026-05-02", "MONTH"],
    ["2026-02-31", "DAY"],
  ])("rejects invalid date %s for %s", (publicationDate, publicationDatePrecision) => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, publicationDate, publicationDatePrecision })).toThrow();
  });

  it("rejects a date without precision", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, publicationDate: "2026-05-17" })).toThrow();
  });

  it("rejects precision without a date", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, publicationDatePrecision: "DAY" })).toThrow();
  });

  it.each(["0-306-40615-2", "0 306 40615 2", "123456789X"])("accepts structural ISBN-10 %s", (isbn10) => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, isbn10 })).not.toThrow();
  });

  it("rejects impossible ISBN-10 characters", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, isbn10: "0-306-40A15-2" })).toThrow();
  });

  it("accepts a formatted structural ISBN-13", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, isbn13: "978 0 306 40615 7" })).not.toThrow();
  });

  it("rejects impossible ISBN-13 characters", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, isbn13: "978-0-306-A0615-7" })).toThrow();
  });

  it("accepts no cover", () => {
    expect(() => editionCreateInputSchema.parse(validEdition)).not.toThrow();
  });

  it("accepts only a cover URL", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, coverUrl: "https://example.com/cover.jpg" })).not.toThrow();
  });

  it("accepts only a storage key", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, coverStorageKey: "covers/example.jpg" })).not.toThrow();
  });

  it("rejects two cover sources", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, coverUrl: "https://example.com/cover.jpg", coverStorageKey: "covers/example.jpg" })).toThrow();
  });

  it("rejects an invalid cover URL", () => {
    expect(() => editionCreateInputSchema.parse({ ...validEdition, coverUrl: "not a URL" })).toThrow();
  });
});

describe("relationship schemas", () => {
  it("validates a positive author position", () => {
    expect(workAuthorInputSchema.parse({ workId, authorId: relatedId, position: 1 }).position).toBe(1);
  });

  it("validates a work genre relation", () => {
    expect(workGenreInputSchema.parse({ workId, genreId: relatedId, isPrimary: true }).isPrimary).toBe(true);
  });

  it.each([1, 2.5, 2.125, 99999.999, null])("accepts work series position %s", (position) => {
    expect(() => workSeriesInputSchema.parse({ workId, seriesId: relatedId, position, positionLabel: null })).not.toThrow();
  });

  it.each([0, -1, 2.1234, 100000])("rejects work series position %s", (position) => {
    expect(() => workSeriesInputSchema.parse({ workId, seriesId: relatedId, position, positionLabel: null })).toThrow();
  });

  it("allows null position and label", () => {
    const result = workSeriesInputSchema.parse({ workId, seriesId: relatedId, position: null, positionLabel: null });
    expect(result.position).toBeNull();
    expect(result.positionLabel).toBeNull();
  });
});
