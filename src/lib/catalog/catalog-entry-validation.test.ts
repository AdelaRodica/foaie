import { describe, expect, it } from "vitest";

import {
  catalogEntryInputSchema,
  parseCatalogIsbn,
  parseCatalogRelationsJson,
  parsePartialPublicationDate,
} from "./catalog-entry-validation";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";

const validEntry = {
  work: {
    title: "Obra",
    originalTitle: null,
    description: null,
    originalPublicationYear: null,
    originalLanguageCode: null,
  },
  authorRelations: [],
  genreRelations: [],
  seriesRelations: [],
  edition: {
    publisherId: null,
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
    coverStorageKey: null,
  },
};

describe("parseCatalogIsbn", () => {
  it("maps an empty value to null ISBN fields", () => {
    expect(parseCatalogIsbn("  ")).toEqual({ isbn10: null, isbn13: null });
  });

  it.each([
    ["1234567890", "1234567890"],
    ["1-234 56789-0", "1234567890"],
    ["123456789x", "123456789X"],
  ])("normalizes structural ISBN-10 %s", (value, expected) => {
    expect(parseCatalogIsbn(value)).toEqual({ isbn10: expected, isbn13: null });
  });

  it("accepts a structural ISBN-13", () => {
    expect(parseCatalogIsbn("978 123456789 0")).toEqual({
      isbn10: null,
      isbn13: "9781234567890",
    });
  });

  it.each(["123", "12345678A0", "978123456789X"])("rejects invalid structure %s", (value) => {
    expect(() => parseCatalogIsbn(value)).toThrow();
  });
});

describe("parsePartialPublicationDate", () => {
  it("maps two empty values to null", () => {
    expect(parsePartialPublicationDate("", "")).toEqual({
      publicationDate: null,
      publicationDatePrecision: null,
    });
  });

  it.each([
    ["YEAR", "2026", "2026-01-01"],
    ["MONTH", "2026-09", "2026-09-01"],
    ["DAY", "2026-09-23", "2026-09-23"],
  ])("canonicalizes %s input", (precision, value, publicationDate) => {
    expect(parsePartialPublicationDate(precision, value)).toEqual({
      publicationDate,
      publicationDatePrecision: precision,
    });
  });

  it.each([
    ["YEAR", ""],
    ["", "2026"],
    ["MONTH", "2026-13"],
    ["DAY", "2026-02-30"],
    ["YEAR", "26"],
  ])("rejects incoherent date %s / %s", (precision, value) => {
    expect(() => parsePartialPublicationDate(precision, value)).toThrow();
  });
});

describe("parseCatalogRelationsJson", () => {
  it("parses an array without trusting its elements", () => {
    expect(parseCatalogRelationsJson('[{"authorId":"value"}]')).toEqual([{ authorId: "value" }]);
  });

  it.each(["broken", "{}", null])("rejects malformed relation input", (value) => {
    expect(() => parseCatalogRelationsJson(value)).toThrow();
  });
});

describe("catalogEntryInputSchema", () => {
  it("accepts empty relationships", () => {
    expect(catalogEntryInputSchema.safeParse(validEntry).success).toBe(true);
  });

  it("rejects duplicate authors", () => {
    const relation = { authorId: firstId, position: 1 };
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, authorRelations: [relation, { ...relation, position: 2 }] }).success).toBe(false);
  });

  it("rejects duplicate author positions", () => {
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, authorRelations: [{ authorId: firstId, position: 1 }, { authorId: secondId, position: 1 }] }).success).toBe(false);
  });

  it("rejects duplicate genres", () => {
    const relation = { genreId: firstId, isPrimary: false };
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, genreRelations: [relation, relation] }).success).toBe(false);
  });

  it("rejects more than one primary genre", () => {
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, genreRelations: [{ genreId: firstId, isPrimary: true }, { genreId: secondId, isPrimary: true }] }).success).toBe(false);
  });

  it("rejects duplicate series", () => {
    const relation = { seriesId: firstId, position: null, positionLabel: null };
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, seriesRelations: [relation, relation] }).success).toBe(false);
  });

  it("rejects an invalid format", () => {
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, edition: { ...validEntry.edition, format: "SCROLL" } }).success).toBe(false);
  });

  it("rejects an invalid publisher ID", () => {
    expect(catalogEntryInputSchema.safeParse({ ...validEntry, edition: { ...validEntry.edition, publisherId: "invalid" } }).success).toBe(false);
  });
});
