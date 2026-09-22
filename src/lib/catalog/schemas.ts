import { z } from "zod";

const emptyToNull = (value: unknown) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
};

const nullableTrimmedString = (maximumLength?: number) =>
  z.preprocess(
    emptyToNull,
    (maximumLength === undefined
      ? z.string()
      : z.string().max(maximumLength)
    ).nullable(),
  );

const numericOrNull = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return value;
};

const nullableInteger = (schema: z.ZodNumber) =>
  z.preprocess(numericOrNull, schema.int().nullable());

const uuid = z.string().uuid();

export const workInputSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    originalTitle: nullableTrimmedString(300),
    description: nullableTrimmedString(),
    originalPublicationYear: nullableInteger(
      z.number().min(-5000).max(3000).refine((year) => year !== 0),
    ),
    originalLanguageCode: nullableTrimmedString(35),
  })
  .strict();

export const authorInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    sortName: nullableTrimmedString(200),
  })
  .strict();

export const publisherInputSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
  })
  .strict();

export const seriesInputSchema = z
  .object({
    name: z.string().trim().min(1).max(250),
    description: nullableTrimmedString(),
  })
  .strict();

export const editionFormats = ["PHYSICAL", "EBOOK", "AUDIOBOOK"] as const;
export const publicationDatePrecisions = ["YEAR", "MONTH", "DAY"] as const;

const isbn10 = z.preprocess(
  emptyToNull,
  z
    .string()
    .max(32)
    .regex(/^[0-9Xx -]+$/)
    .refine((value) => /^[0-9]{9}[0-9Xx]$/.test(value.replace(/[ -]/g, "")))
    .nullable(),
);

const isbn13 = z.preprocess(
  emptyToNull,
  z
    .string()
    .max(40)
    .regex(/^[0-9 -]+$/)
    .refine((value) => /^97[89][0-9]{10}$/.test(value.replace(/[ -]/g, "")))
    .nullable(),
);

const isoDate = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));

      return (
        year >= 1 &&
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
      );
    })
    .nullable(),
);

const nullableUuid = z.preprocess(emptyToNull, uuid.nullable());
const nullablePositiveInteger = nullableInteger(z.number().positive());
const nullablePublicationPrecision = z.preprocess(
  emptyToNull,
  z.enum(publicationDatePrecisions).nullable(),
);
const nullableCoverUrl = z.preprocess(emptyToNull, z.url().nullable());

const editionEditableFieldsSchema = z.object({
  publisherId: nullableUuid,
  editionTitle: nullableTrimmedString(300),
  subtitle: nullableTrimmedString(300),
  isbn10,
  isbn13,
  publicationDate: isoDate,
  publicationDatePrecision: nullablePublicationPrecision,
  languageCode: nullableTrimmedString(35),
  format: z.enum(editionFormats),
  pageCount: nullablePositiveInteger,
  audioDurationMinutes: nullablePositiveInteger,
  coverUrl: nullableCoverUrl,
  coverStorageKey: nullableTrimmedString(),
});

type EditionFields = z.infer<typeof editionEditableFieldsSchema>;

function validateEditionFields(
  data: Partial<EditionFields>,
  context: z.RefinementCtx,
  requireDatePair: boolean,
) {
  const hasDate = data.publicationDate !== undefined;
  const hasPrecision = data.publicationDatePrecision !== undefined;

  if (requireDatePair || hasDate || hasPrecision) {
    const date = data.publicationDate ?? null;
    const precision = data.publicationDatePrecision ?? null;

    if ((date === null) !== (precision === null)) {
      context.addIssue({
        code: "custom",
        path: [date === null ? "publicationDate" : "publicationDatePrecision"],
        message: "La fecha y su precisión deben indicarse juntas.",
      });
    } else if (date && precision === "YEAR" && !date.endsWith("-01-01")) {
      context.addIssue({ code: "custom", path: ["publicationDate"], message: "El año debe usar 01-01." });
    } else if (date && precision === "MONTH" && !date.endsWith("-01")) {
      context.addIssue({ code: "custom", path: ["publicationDate"], message: "El mes debe usar el día 01." });
    }
  }

  if (data.coverUrl && data.coverStorageKey) {
    context.addIssue({
      code: "custom",
      path: ["coverStorageKey"],
      message: "Solo puede utilizarse una fuente de portada.",
    });
  }
}

// PostgreSQL remains the canonical guarantee for ISBN checksums, derivation,
// and ISBN-10/ISBN-13 correspondence. These schemas only validate structure.
export const editionCreateInputSchema = editionEditableFieldsSchema
  .extend({ workId: uuid })
  .strict()
  .superRefine((data, context) => validateEditionFields(data, context, true));

export const editionUpdateInputSchema = editionEditableFieldsSchema
  .partial()
  .strict()
  .superRefine((data, context) => validateEditionFields(data, context, false));

export const workAuthorInputSchema = z
  .object({
    workId: uuid,
    authorId: uuid,
    position: z.coerce.number().int().positive(),
  })
  .strict();

export const workGenreInputSchema = z
  .object({
    workId: uuid,
    genreId: uuid,
    isPrimary: z.boolean(),
  })
  .strict();

const workSeriesPosition = z.preprocess(
  numericOrNull,
  z
    .number()
    .positive()
    .max(99999.999)
    .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-7)
    .nullable(),
);

export const workSeriesInputSchema = z
  .object({
    workId: uuid,
    seriesId: uuid,
    position: workSeriesPosition,
    positionLabel: nullableTrimmedString(60),
  })
  .strict();
