import "server-only";

import { z } from "zod";

import { CatalogError, catalogValidationError } from "../errors";
import {
  authorInputSchema,
  editionCreateInputSchema,
  editionUpdateInputSchema,
  publisherInputSchema,
  seriesInputSchema,
  workInputSchema,
} from "../schemas";
import type {
  AuthorInput,
  EditionCreateInput,
  EditionUpdateInput,
  MutationIdResult,
  PublisherInput,
  SeriesInput,
  WorkInput,
} from "../types";
import { createAuthenticatedWritableCatalogClient } from "./auth";
import { mapCatalogMutationError, mapCatalogReadError } from "./errors";

const uuidSchema = z.string().uuid();

function parseId(value: string, operation: string) {
  const result = uuidSchema.safeParse(value);
  if (!result.success) throw catalogValidationError(result.error, operation);
  return result.data;
}

function parseInput<Output>(schema: z.ZodType<Output>, input: unknown, operation: string) {
  const result = schema.safeParse(input);
  if (!result.success) throw catalogValidationError(result.error, operation);
  return result.data;
}

function requireMutationResult(
  data: MutationIdResult | null,
  operation: string,
): MutationIdResult {
  if (!data) throw new CatalogError("unexpected", { operation });
  return data;
}

export async function createWork(input: WorkInput): Promise<MutationIdResult> {
  const parsed = parseInput(workInputSchema, input, "createWork");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("works").insert({
    title: parsed.title,
    original_title: parsed.originalTitle,
    description: parsed.description,
    original_publication_year: parsed.originalPublicationYear,
    original_language_code: parsed.originalLanguageCode,
  }).select("id").single();
  if (error) throw mapCatalogMutationError(error, "createWork");
  return requireMutationResult(data, "createWork");
}

export async function updateWork(workId: string, input: WorkInput): Promise<MutationIdResult> {
  const id = parseId(workId, "updateWork");
  const parsed = parseInput(workInputSchema, input, "updateWork");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("works").update({
    title: parsed.title,
    original_title: parsed.originalTitle,
    description: parsed.description,
    original_publication_year: parsed.originalPublicationYear,
    original_language_code: parsed.originalLanguageCode,
  }).eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "updateWork");
  if (data) return data;
  const existence = await supabase.from("works").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateWork.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateWork" });
}

export async function deleteWork(workId: string): Promise<void> {
  const id = parseId(workId, "deleteWork");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("works").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "deleteWork");
  if (data) return;
  const existence = await supabase.from("works").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "deleteWork.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "deleteWork" });
}

export async function createAuthor(input: AuthorInput): Promise<MutationIdResult> {
  const parsed = parseInput(authorInputSchema, input, "createAuthor");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("authors").insert({ name: parsed.name, sort_name: parsed.sortName }).select("id").single();
  if (error) throw mapCatalogMutationError(error, "createAuthor");
  return requireMutationResult(data, "createAuthor");
}

export async function updateAuthor(authorId: string, input: AuthorInput): Promise<MutationIdResult> {
  const id = parseId(authorId, "updateAuthor");
  const parsed = parseInput(authorInputSchema, input, "updateAuthor");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("authors").update({ name: parsed.name, sort_name: parsed.sortName }).eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "updateAuthor");
  if (data) return data;
  const existence = await supabase.from("authors").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateAuthor.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateAuthor" });
}

export async function deleteAuthor(authorId: string): Promise<void> {
  const id = parseId(authorId, "deleteAuthor");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("authors").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "deleteAuthor");
  if (data) return;
  const existence = await supabase.from("authors").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "deleteAuthor.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "deleteAuthor" });
}

export async function createPublisher(input: PublisherInput): Promise<MutationIdResult> {
  const parsed = parseInput(publisherInputSchema, input, "createPublisher");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("publishers").insert({ name: parsed.name }).select("id").single();
  if (error) throw mapCatalogMutationError(error, "createPublisher");
  return requireMutationResult(data, "createPublisher");
}

export async function updatePublisher(publisherId: string, input: PublisherInput): Promise<MutationIdResult> {
  const id = parseId(publisherId, "updatePublisher");
  const parsed = parseInput(publisherInputSchema, input, "updatePublisher");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("publishers").update({ name: parsed.name }).eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "updatePublisher");
  if (data) return data;
  const existence = await supabase.from("publishers").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updatePublisher.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updatePublisher" });
}

export async function deletePublisher(publisherId: string): Promise<void> {
  const id = parseId(publisherId, "deletePublisher");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("publishers").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "deletePublisher");
  if (data) return;
  const existence = await supabase.from("publishers").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "deletePublisher.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "deletePublisher" });
}

export async function createSeries(input: SeriesInput): Promise<MutationIdResult> {
  const parsed = parseInput(seriesInputSchema, input, "createSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("series").insert({ name: parsed.name, description: parsed.description }).select("id").single();
  if (error) throw mapCatalogMutationError(error, "createSeries");
  return requireMutationResult(data, "createSeries");
}

export async function updateSeries(seriesId: string, input: SeriesInput): Promise<MutationIdResult> {
  const id = parseId(seriesId, "updateSeries");
  const parsed = parseInput(seriesInputSchema, input, "updateSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("series").update({ name: parsed.name, description: parsed.description }).eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "updateSeries");
  if (data) return data;
  const existence = await supabase.from("series").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateSeries.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateSeries" });
}

export async function deleteSeries(seriesId: string): Promise<void> {
  const id = parseId(seriesId, "deleteSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("series").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "deleteSeries");
  if (data) return;
  const existence = await supabase.from("series").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "deleteSeries.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "deleteSeries" });
}

function editionUpdatePayload(parsed: EditionUpdateInput) {
  return {
    publisher_id: parsed.publisherId,
    edition_title: parsed.editionTitle,
    subtitle: parsed.subtitle,
    isbn10: parsed.isbn10,
    isbn13: parsed.isbn13,
    publication_date: parsed.publicationDate,
    publication_date_precision: parsed.publicationDatePrecision,
    language_code: parsed.languageCode,
    format: parsed.format,
    page_count: parsed.pageCount,
    audio_duration_minutes: parsed.audioDurationMinutes,
    cover_url: parsed.coverUrl,
    cover_storage_key: parsed.coverStorageKey,
  };
}

export async function createEdition(input: EditionCreateInput): Promise<MutationIdResult> {
  const parsed = parseInput(editionCreateInputSchema, input, "createEdition");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("editions").insert({
    work_id: parsed.workId,
    publisher_id: parsed.publisherId,
    edition_title: parsed.editionTitle,
    subtitle: parsed.subtitle,
    isbn10: parsed.isbn10,
    isbn13: parsed.isbn13,
    publication_date: parsed.publicationDate,
    publication_date_precision: parsed.publicationDatePrecision,
    language_code: parsed.languageCode,
    format: parsed.format,
    page_count: parsed.pageCount,
    audio_duration_minutes: parsed.audioDurationMinutes,
    cover_url: parsed.coverUrl,
    cover_storage_key: parsed.coverStorageKey,
  }).select("id").single();
  if (error) throw mapCatalogMutationError(error, "createEdition");
  return requireMutationResult(data, "createEdition");
}

export async function updateEdition(editionId: string, input: EditionUpdateInput): Promise<MutationIdResult> {
  const id = parseId(editionId, "updateEdition");
  const parsed = parseInput(editionUpdateInputSchema, input, "updateEdition");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("editions").update(editionUpdatePayload(parsed)).eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "updateEdition");
  if (data) return data;
  const existence = await supabase.from("editions").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateEdition.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateEdition" });
}

export async function deleteEdition(editionId: string): Promise<void> {
  const id = parseId(editionId, "deleteEdition");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { data, error } = await supabase.from("editions").delete().eq("id", id).select("id").maybeSingle();
  if (error) throw mapCatalogMutationError(error, "deleteEdition");
  if (data) return;
  const existence = await supabase.from("editions").select("id").eq("id", id).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "deleteEdition.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "deleteEdition" });
}

// Mutations are deliberately granular and independent. Saving a complete work
// atomically will require a dedicated transactional RPC decision in Stage 3E.
