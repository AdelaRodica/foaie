import { z } from "zod";

import {
  CatalogEntryValidationError,
  parseCatalogIsbn,
  parsePartialPublicationDate,
} from "./catalog-entry-validation";
import { editionUpdateInputSchema } from "./schemas";
import type { EditionUpdateInput } from "./types";

export type CatalogEditionFieldErrors = Readonly<Record<string, string[]>>;

export type CatalogEditionUpdateInput = Readonly<{
  workId: string;
  editionId: string;
  edition: EditionUpdateInput;
}>;

export type CatalogEditionFormValues = Readonly<{
  publisherId: string;
  editionTitle: string;
  subtitle: string;
  isbn: string;
  publicationDatePrecision: string;
  publicationDateInput: string;
  languageCode: string;
  format: string;
  pageCount: string;
  audioDurationMinutes: string;
  coverUrl: string;
}>;

type CatalogEditionValidationResult =
  | Readonly<{ success: true; data: CatalogEditionUpdateInput }>
  | Readonly<{ success: false; fieldErrors: CatalogEditionFieldErrors }>;

export const catalogEditionUpdateInputSchema = z.object({
  workId: z.string().uuid(),
  editionId: z.string().uuid(),
  edition: editionUpdateInputSchema,
}).strict();

const editionFieldMessages: Readonly<Record<string, string>> = {
  publisherId: "Selecciona una editorial válida.",
  editionTitle: "El título de edición no puede superar los 300 caracteres.",
  subtitle: "El subtítulo no puede superar los 300 caracteres.",
  isbn10: "Introduce un ISBN-10 o ISBN-13 válido.",
  isbn13: "Introduce un ISBN-10 o ISBN-13 válido.",
  publicationDate: "Introduce una fecha de publicación válida.",
  publicationDatePrecision: "Introduce una fecha de publicación válida.",
  languageCode: "El idioma no puede superar los 35 caracteres.",
  format: "Selecciona un formato válido.",
  pageCount: "Introduce un número de páginas válido.",
  audioDurationMinutes: "Introduce una duración válida.",
  coverUrl: "Introduce una URL de portada válida.",
};

export function catalogEditionFieldErrors(
  error: z.ZodError,
): CatalogEditionFieldErrors {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const [section, field] = issue.path;
    let key = "form";
    let message = "El formulario contiene campos no válidos.";

    if (section === "edition" && typeof field === "string") {
      key = field === "isbn10" || field === "isbn13"
        ? "edition.isbn"
        : field === "publicationDatePrecision"
          ? "edition.publicationDate"
          : `edition.${field}`;
      message = issue.code === "custom"
        ? issue.message
        : editionFieldMessages[field] ?? message;
    } else if (section === "workId" || section === "editionId") {
      key = section;
      message = "La ruta solicitada no es válida.";
    }

    const messages = (errors[key] ??= []);
    if (!messages.includes(message)) messages.push(message);
  }

  return errors;
}

export function validateCatalogEditionUpdate(
  workId: string,
  editionId: string,
  values: CatalogEditionFormValues,
): CatalogEditionValidationResult {
  let isbn: ReturnType<typeof parseCatalogIsbn>;
  let date: ReturnType<typeof parsePartialPublicationDate>;

  try {
    isbn = parseCatalogIsbn(values.isbn);
  } catch (error) {
    if (error instanceof CatalogEntryValidationError) {
      return {
        success: false,
        fieldErrors: { "edition.isbn": [error.message] },
      };
    }
    throw error;
  }

  try {
    date = parsePartialPublicationDate(
      values.publicationDatePrecision,
      values.publicationDateInput,
    );
  } catch (error) {
    if (error instanceof CatalogEntryValidationError) {
      return {
        success: false,
        fieldErrors: { "edition.publicationDate": [error.message] },
      };
    }
    throw error;
  }

  const parsed = catalogEditionUpdateInputSchema.safeParse({
    workId,
    editionId,
    edition: {
      publisherId: values.publisherId,
      editionTitle: values.editionTitle,
      subtitle: values.subtitle,
      ...isbn,
      ...date,
      languageCode: values.languageCode,
      format: values.format,
      pageCount: values.pageCount,
      audioDurationMinutes: values.audioDurationMinutes,
      coverUrl: values.coverUrl,
      coverStorageKey: null,
    },
  });

  if (!parsed.success) {
    return { success: false, fieldErrors: catalogEditionFieldErrors(parsed.error) };
  }
  return { success: true, data: parsed.data };
}
