import { z } from "zod";

import {
  catalogEntryEditionInputSchema,
  workAuthorInputSchema,
  workGenreInputSchema,
  workInputSchema,
  workSeriesInputSchema,
} from "./schemas";

export class CatalogEntryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CatalogEntryValidationError";
  }
}

export function parseCatalogIsbn(value: string) {
  const normalized = value.trim().replace(/[\s-]/g, "").toUpperCase();

  if (normalized === "") return { isbn10: null, isbn13: null };
  if (/^[0-9]{9}[0-9X]$/.test(normalized)) {
    return { isbn10: normalized, isbn13: null };
  }
  if (/^[0-9]{13}$/.test(normalized)) {
    return { isbn10: null, isbn13: normalized };
  }

  throw new CatalogEntryValidationError("Introduce un ISBN-10 o ISBN-13 válido.");
}

function isExistingDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1
    && date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function parsePartialPublicationDate(precisionValue: string, dateValue: string) {
  const precision = precisionValue.trim();
  const value = dateValue.trim();

  if (precision === "" && value === "") {
    return { publicationDate: null, publicationDatePrecision: null };
  }
  if (precision === "" || value === "") {
    throw new CatalogEntryValidationError("Indica tanto la fecha como su precisión.");
  }

  if (precision === "YEAR" && /^\d{4}$/.test(value)) {
    const year = Number(value);
    if (isExistingDate(year, 1, 1)) {
      return { publicationDate: `${value}-01-01`, publicationDatePrecision: precision };
    }
  }

  if (precision === "MONTH" && /^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-").map(Number);
    if (isExistingDate(year, month, 1)) {
      return { publicationDate: `${value}-01`, publicationDatePrecision: precision };
    }
  }

  if (precision === "DAY" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    if (isExistingDate(year, month, day)) {
      return { publicationDate: value, publicationDatePrecision: precision };
    }
  }

  throw new CatalogEntryValidationError("La fecha de publicación no es válida.");
}

export function parseCatalogRelationsJson(value: unknown): unknown[] {
  if (typeof value !== "string") {
    throw new CatalogEntryValidationError("Las relaciones del catálogo no son válidas.");
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error("not-an-array");
    return parsed;
  } catch {
    throw new CatalogEntryValidationError("Las relaciones del catálogo no son válidas.");
  }
}

const authorRelationSchema = workAuthorInputSchema.omit({ workId: true });
const genreRelationSchema = workGenreInputSchema.omit({ workId: true });
const seriesRelationSchema = workSeriesInputSchema.omit({ workId: true });

export const catalogWorkFieldsSchema = z.object({
  work: workInputSchema,
  authorRelations: z.array(authorRelationSchema).superRefine((relations, context) => {
    const authorIds = new Set<string>();
    const positions = new Set<number>();
    relations.forEach((relation, index) => {
      if (authorIds.has(relation.authorId)) {
        context.addIssue({ code: "custom", path: [index, "authorId"], message: "No repitas autores." });
      }
      if (positions.has(relation.position)) {
        context.addIssue({ code: "custom", path: [index, "position"], message: "No repitas posiciones de autoría." });
      }
      authorIds.add(relation.authorId);
      positions.add(relation.position);
    });
  }),
  genreRelations: z.array(genreRelationSchema).superRefine((relations, context) => {
    const genreIds = new Set<string>();
    let primaryCount = 0;
    relations.forEach((relation, index) => {
      if (genreIds.has(relation.genreId)) {
        context.addIssue({ code: "custom", path: [index, "genreId"], message: "No repitas géneros." });
      }
      genreIds.add(relation.genreId);
      if (relation.isPrimary) primaryCount += 1;
    });
    if (primaryCount > 1) {
      context.addIssue({ code: "custom", message: "Solo puede existir un género principal." });
    }
  }),
  seriesRelations: z.array(seriesRelationSchema).superRefine((relations, context) => {
    const seriesIds = new Set<string>();
    relations.forEach((relation, index) => {
      if (seriesIds.has(relation.seriesId)) {
        context.addIssue({ code: "custom", path: [index, "seriesId"], message: "No repitas series." });
      }
      seriesIds.add(relation.seriesId);
    });
  }),
}).strict();

export const catalogEntryInputSchema = catalogWorkFieldsSchema.extend({
  edition: catalogEntryEditionInputSchema,
}).strict();
