import "server-only";

import { z } from "zod";

import { CatalogError, catalogValidationError } from "../errors";
import { workAuthorInputSchema, workGenreInputSchema, workSeriesInputSchema } from "../schemas";
import type { WorkAuthorInput, WorkGenreInput, WorkSeriesInput } from "../types";
import { createAuthenticatedWritableCatalogClient } from "./auth";
import { mapCatalogMutationError, mapCatalogReadError } from "./errors";

const uuidPairSchema = z.object({ first: z.string().uuid(), second: z.string().uuid() });

function parseIds(first: string, second: string, operation: string) {
  const result = uuidPairSchema.safeParse({ first, second });
  if (!result.success) throw catalogValidationError(result.error, operation);
  return result.data;
}

function parseInput<Output>(schema: z.ZodType<Output>, input: unknown, operation: string) {
  const result = schema.safeParse(input);
  if (!result.success) throw catalogValidationError(result.error, operation);
  return result.data;
}

export async function addWorkAuthor(input: WorkAuthorInput): Promise<void> {
  const parsed = parseInput(workAuthorInputSchema, input, "addWorkAuthor");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { error } = await supabase.from("work_authors").insert({ work_id: parsed.workId, author_id: parsed.authorId, position: parsed.position });
  if (error) throw mapCatalogMutationError(error, "addWorkAuthor");
}

export async function updateWorkAuthorPosition(input: WorkAuthorInput): Promise<void> {
  const parsed = parseInput(workAuthorInputSchema, input, "updateWorkAuthorPosition");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_authors").update({ position: parsed.position }).eq("work_id", parsed.workId).eq("author_id", parsed.authorId).select("work_id,author_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "updateWorkAuthorPosition");
  if (mutation.data) return;
  const existence = await supabase.from("work_authors").select("work_id").eq("work_id", parsed.workId).eq("author_id", parsed.authorId).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateWorkAuthorPosition.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateWorkAuthorPosition" });
}

export async function removeWorkAuthor(workId: string, authorId: string): Promise<void> {
  const ids = parseIds(workId, authorId, "removeWorkAuthor");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_authors").delete().eq("work_id", ids.first).eq("author_id", ids.second).select("work_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "removeWorkAuthor");
  if (mutation.data) return;
  const existence = await supabase.from("work_authors").select("work_id").eq("work_id", ids.first).eq("author_id", ids.second).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "removeWorkAuthor.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "removeWorkAuthor" });
}

export async function addWorkGenre(input: WorkGenreInput): Promise<void> {
  const parsed = parseInput(workGenreInputSchema, input, "addWorkGenre");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { error } = await supabase.from("work_genres").insert({ work_id: parsed.workId, genre_id: parsed.genreId, is_primary: parsed.isPrimary });
  if (error) throw mapCatalogMutationError(error, "addWorkGenre");
}

export async function updateWorkGenrePrimary(input: WorkGenreInput): Promise<void> {
  const parsed = parseInput(workGenreInputSchema, input, "updateWorkGenrePrimary");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_genres").update({ is_primary: parsed.isPrimary }).eq("work_id", parsed.workId).eq("genre_id", parsed.genreId).select("work_id,genre_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "updateWorkGenrePrimary");
  if (mutation.data) return;
  const existence = await supabase.from("work_genres").select("work_id").eq("work_id", parsed.workId).eq("genre_id", parsed.genreId).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateWorkGenrePrimary.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateWorkGenrePrimary" });
}

export async function removeWorkGenre(workId: string, genreId: string): Promise<void> {
  const ids = parseIds(workId, genreId, "removeWorkGenre");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_genres").delete().eq("work_id", ids.first).eq("genre_id", ids.second).select("work_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "removeWorkGenre");
  if (mutation.data) return;
  const existence = await supabase.from("work_genres").select("work_id").eq("work_id", ids.first).eq("genre_id", ids.second).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "removeWorkGenre.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "removeWorkGenre" });
}

export async function addWorkSeries(input: WorkSeriesInput): Promise<void> {
  const parsed = parseInput(workSeriesInputSchema, input, "addWorkSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const { error } = await supabase.from("work_series").insert({ work_id: parsed.workId, series_id: parsed.seriesId, position: parsed.position, position_label: parsed.positionLabel });
  if (error) throw mapCatalogMutationError(error, "addWorkSeries");
}

export async function updateWorkSeries(input: WorkSeriesInput): Promise<void> {
  const parsed = parseInput(workSeriesInputSchema, input, "updateWorkSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_series").update({ position: parsed.position, position_label: parsed.positionLabel }).eq("work_id", parsed.workId).eq("series_id", parsed.seriesId).select("work_id,series_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "updateWorkSeries");
  if (mutation.data) return;
  const existence = await supabase.from("work_series").select("work_id").eq("work_id", parsed.workId).eq("series_id", parsed.seriesId).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "updateWorkSeries.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "updateWorkSeries" });
}

export async function removeWorkSeries(workId: string, seriesId: string): Promise<void> {
  const ids = parseIds(workId, seriesId, "removeWorkSeries");
  const supabase = await createAuthenticatedWritableCatalogClient();
  const mutation = await supabase.from("work_series").delete().eq("work_id", ids.first).eq("series_id", ids.second).select("work_id").maybeSingle();
  if (mutation.error) throw mapCatalogMutationError(mutation.error, "removeWorkSeries");
  if (mutation.data) return;
  const existence = await supabase.from("work_series").select("work_id").eq("work_id", ids.first).eq("series_id", ids.second).maybeSingle();
  if (existence.error) throw mapCatalogReadError(existence.error, "removeWorkSeries.exists");
  throw new CatalogError(existence.data ? "permission" : "not_found", { operation: "removeWorkSeries" });
}
