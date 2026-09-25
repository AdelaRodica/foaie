"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { CatalogError } from "@/lib/catalog/errors";
import {
  CatalogEntryValidationError,
  catalogEntryInputSchema,
  parseCatalogIsbn,
  parseCatalogRelationsJson,
  parsePartialPublicationDate,
} from "@/lib/catalog/catalog-entry-validation";
import { createCatalogEntry } from "@/lib/catalog/server/catalog-entry";
import { createAuthor, createPublisher, createSeries } from "@/lib/catalog/server/mutations";
import {
  getAuthorById,
  getPublisherById,
  getSeriesById,
  searchAuthors,
  searchPublishers,
  searchSeries,
} from "@/lib/catalog/server/queries";
import type { CatalogEntryInput, CatalogEntryResult } from "@/lib/catalog/server/catalog-entry";
import type { AuthorSummary, CatalogErrorKind, PublisherSummary, SeriesSummary } from "@/lib/catalog/types";

type FieldErrors = Readonly<Record<string, string[]>>;

type ActionResult<T> =
  | Readonly<{ success: true; data: T }>
  | Readonly<{ success: false; kind: CatalogErrorKind; message: string; fieldErrors?: FieldErrors }>;

function publicFailure(error: unknown): ActionResult<never> {
  if (error instanceof CatalogError) {
    return { success: false, kind: error.kind, message: error.message };
  }
  return { success: false, kind: "unexpected", message: "No se ha podido completar la operación." };
}

async function safely<T>(operation: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { success: true, data: await operation() };
  } catch (error) {
    return publicFailure(error);
  }
}

export async function searchAuthorsAction(query: string) {
  return safely(() => searchAuthors({ query, limit: 10 }));
}

export async function searchPublishersAction(query: string) {
  return safely(() => searchPublishers({ query, limit: 10 }));
}

export async function searchSeriesAction(query: string) {
  return safely(() => searchSeries({ query, limit: 10 }));
}

export async function createAuthorAction(input: { name: string; sortName: string | null }): Promise<ActionResult<AuthorSummary>> {
  return safely(async () => getAuthorById((await createAuthor(input)).id));
}

export async function createPublisherAction(input: { name: string }): Promise<ActionResult<PublisherSummary>> {
  return safely(async () => getPublisherById((await createPublisher(input)).id));
}

export async function createSeriesAction(input: { name: string; description: string | null }): Promise<ActionResult<SeriesSummary>> {
  return safely(async () => getSeriesById((await createSeries(input)).id));
}

function readString(formData: FormData, name: string) {
  const value = formData.get(name);
  if (value === null) return "";
  if (typeof value === "string") return value;
  throw new CatalogEntryValidationError("El formulario contiene un valor no válido.");
}

function validationFailure(fieldErrors: FieldErrors): ActionResult<never> {
  return {
    success: false,
    kind: "validation",
    message: "Revisa los datos del formulario.",
    fieldErrors,
  };
}

function zodFieldErrors(error: z.ZodError): FieldErrors {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const [section, field] = issue.path;
    const key = typeof section === "string" && typeof field === "string"
      ? `${section}.${field}`
      : typeof section === "string" ? section : "form";
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

export async function createCatalogEntryAction(
  formData: FormData,
): Promise<ActionResult<CatalogEntryResult>> {
  try {
    let isbn;
    let date;
    let authorRelations;
    let genreRelations;
    let seriesRelations;

    try {
      isbn = parseCatalogIsbn(readString(formData, "edition.isbn"));
    } catch (error) {
      if (error instanceof CatalogEntryValidationError) {
        return validationFailure({ "edition.isbn": [error.message] });
      }
      throw error;
    }

    try {
      date = parsePartialPublicationDate(
        readString(formData, "edition.publicationDatePrecision"),
        readString(formData, "edition.publicationDateInput"),
      );
    } catch (error) {
      if (error instanceof CatalogEntryValidationError) {
        return validationFailure({ "edition.publicationDate": [error.message] });
      }
      throw error;
    }

    for (const [field, value] of [
      ["authorRelations", formData.get("authorRelations")],
      ["genreRelations", formData.get("genreRelations")],
      ["seriesRelations", formData.get("seriesRelations")],
    ] as const) {
      try {
        const relations = parseCatalogRelationsJson(value);
        if (field === "authorRelations") authorRelations = relations;
        if (field === "genreRelations") genreRelations = relations;
        if (field === "seriesRelations") seriesRelations = relations;
      } catch (error) {
        if (error instanceof CatalogEntryValidationError) {
          return validationFailure({ [field]: [error.message] });
        }
        throw error;
      }
    }

    const parsed = catalogEntryInputSchema.safeParse({
      work: {
        title: readString(formData, "work.title"),
        originalPublicationYear: readString(formData, "work.originalPublicationYear"),
        originalTitle: readString(formData, "work.originalTitle"),
        originalLanguageCode: readString(formData, "work.originalLanguageCode"),
        description: readString(formData, "work.description"),
      },
      authorRelations,
      genreRelations,
      seriesRelations,
      edition: {
        publisherId: readString(formData, "edition.publisherId"),
        editionTitle: readString(formData, "edition.editionTitle"),
        subtitle: readString(formData, "edition.subtitle"),
        ...isbn,
        ...date,
        languageCode: readString(formData, "edition.languageCode"),
        format: readString(formData, "edition.format"),
        pageCount: readString(formData, "edition.pageCount"),
        audioDurationMinutes: readString(formData, "edition.audioDurationMinutes"),
        coverUrl: readString(formData, "edition.coverUrl"),
        coverStorageKey: null,
      },
    });

    if (!parsed.success) return validationFailure(zodFieldErrors(parsed.error));
    const input: CatalogEntryInput = parsed.data;
    const result = await createCatalogEntry(input);
    revalidatePath("/biblioteca/nuevo");
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof CatalogEntryValidationError) {
      return validationFailure({ form: [error.message] });
    }
    return publicFailure(error);
  }
}
