import { describe, expect, it } from "vitest";

import {
  catalogEditionUpdateInputSchema,
  validateCatalogEditionUpdate,
} from "./catalog-edition-validation";

const workId = "11111111-1111-4111-8111-111111111111";
const editionId = "22222222-2222-4222-8222-222222222222";
const publisherId = "33333333-3333-4333-8333-333333333333";

const validValues = {
  publisherId: "",
  editionTitle: "",
  subtitle: "",
  isbn: "",
  publicationDatePrecision: "",
  publicationDateInput: "",
  languageCode: "",
  format: "PHYSICAL",
  pageCount: "",
  audioDurationMinutes: "",
  coverUrl: "",
};

function validate(overrides: Partial<typeof validValues> = {}) {
  return validateCatalogEditionUpdate(workId, editionId, {
    ...validValues,
    ...overrides,
  });
}

describe("validateCatalogEditionUpdate", () => {
  it("accepts a minimal valid update and fixes non-UI fields", () => {
    const result = validate();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        workId,
        editionId,
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
      });
    }
  });

  it.each([
    ["invalid", editionId, "workId"],
    [workId, "invalid", "editionId"],
  ])("rejects an invalid route ID", (work, edition, field) => {
    const result = validateCatalogEditionUpdate(work, edition, validValues);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty(field);
  });

  it("rejects external properties", () => {
    const valid = validate();
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(catalogEditionUpdateInputSchema.safeParse({
        ...valid.data,
        userId: publisherId,
      }).success).toBe(false);
      expect(catalogEditionUpdateInputSchema.safeParse({
        ...valid.data,
        edition: { ...valid.data.edition, workId },
      }).success).toBe(false);
    }
  });

  it("accepts an optional publisher UUID", () => {
    const empty = validate({ publisherId: "" });
    const selected = validate({ publisherId });
    expect(empty.success && empty.data.edition.publisherId).toBeNull();
    expect(selected.success && selected.data.edition.publisherId).toBe(publisherId);
  });

  it.each([
    ["", null, null],
    ["1-234 56789-X", "123456789X", null],
    ["978 123456789 0", null, "9781234567890"],
  ])("normalizes structural ISBN %s", (isbn, isbn10, isbn13) => {
    const result = validate({ isbn });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.edition).toMatchObject({ isbn10, isbn13 });
    }
  });

  it("rejects a structurally invalid ISBN", () => {
    const result = validate({ isbn: "123" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.fieldErrors).toHaveProperty("edition.isbn");
  });

  it.each([
    ["YEAR", "2026", "2026-01-01"],
    ["MONTH", "2026-09", "2026-09-01"],
    ["DAY", "2026-09-26", "2026-09-26"],
  ])("canonicalizes a %s publication date", (precision, input, date) => {
    const result = validate({
      publicationDatePrecision: precision,
      publicationDateInput: input,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.edition).toMatchObject({
        publicationDate: date,
        publicationDatePrecision: precision,
      });
    }
  });

  it("rejects an incoherent partial date", () => {
    const result = validate({
      publicationDatePrecision: "MONTH",
      publicationDateInput: "2026-13",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toHaveProperty("edition.publicationDate");
    }
  });

  it.each([
    [
      { publisherId: "invalid" },
      "edition.publisherId",
      "Selecciona una editorial válida.",
    ],
    [
      { editionTitle: "x".repeat(301) },
      "edition.editionTitle",
      "El título de edición no puede superar los 300 caracteres.",
    ],
    [
      { subtitle: "x".repeat(301) },
      "edition.subtitle",
      "El subtítulo no puede superar los 300 caracteres.",
    ],
    [
      { languageCode: "x".repeat(36) },
      "edition.languageCode",
      "El idioma no puede superar los 35 caracteres.",
    ],
    [
      { format: "SCROLL" },
      "edition.format",
      "Selecciona un formato válido.",
    ],
    [
      { pageCount: "0" },
      "edition.pageCount",
      "Introduce un número de páginas válido.",
    ],
    [
      { audioDurationMinutes: "0" },
      "edition.audioDurationMinutes",
      "Introduce una duración válida.",
    ],
    [
      { coverUrl: "not-a-url" },
      "edition.coverUrl",
      "Introduce una URL de portada válida.",
    ],
  ])("returns a public message for an invalid edition field", (
    overrides,
    field,
    message,
  ) => {
    const result = validate(overrides);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors[field]).toEqual([message]);
      expect(result.fieldErrors[field]?.join(" ")).not.toMatch(
        /Invalid|Too small|Too big|expected|Zod/i,
      );
    }
  });
});
